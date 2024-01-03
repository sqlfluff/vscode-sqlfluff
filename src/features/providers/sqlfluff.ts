import * as CProcess from "child_process";
import * as path from "path";
import { StringDecoder } from "string_decoder";
import * as vscode from "vscode";

import Configuration from "../helper/configuration";
import { DbtInterface } from "../helper/dbtInterface";
import { LineDecoder } from "../helper/lineDecoder";
import Utilities from "../helper/utilities";
import FilePath from "./linter/types/filePath";
import CommandOptions from "./types/commandOptions";
import CommandOutput from "./types/commandOutput";
import CommandType from "./types/commandType";

export default class SQLFluff {
  static childProcesses: CProcess.ChildProcess[] = [];

  public static async run(
    workingDirectory: string | undefined,
    command: CommandType,
    args: string[],
    options: CommandOptions,
  ): Promise<CommandOutput> {
    if (!options.fileContents && !options.filePath) {
      throw new Error("You must supply either a target file path or the file contents to scan");
    }

    if (Configuration.dbtInterfaceEnabled() && command === CommandType.FIX) {
      // Handles CommandType.FIX when dbt-core-interface is enabled.
      // TRICKY: Note that this actually hits the dbt-core-interface /format
      // endpoint. This is a deliberate choice, but may look odd to readers of
      // the code.
      const dbtInterface = new DbtInterface(
        undefined,
        options.workspacePath ?? options.filePath,
        Configuration.config(),
      );

      Utilities.outputChannel.appendLine("\n--------------------Executing Command--------------------\n");
      Utilities.outputChannel.appendLine(dbtInterface.getFormatURL());
      Utilities.appendHyphenatedLine();

      const response: any = await dbtInterface.format();
      const output: FilePath[] = [
        {
          filepath: options.filePath,
          // The server returns a message field which contains any errors.
          // Should we display this to the user in the error handling block
          // below?
          //message: response.message ?? "",
          // The "FilePath" interface requires a "violations" field, but /format
          // doesn't return any violations. We'll just return an empty array.
          violations: [],
        },
      ];

      Utilities.outputChannel.appendLine("Raw DBT-Interface /format output:");
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine(JSON.stringify(response, undefined, 2));
      Utilities.appendHyphenatedLine();

      return new Promise<CommandOutput>((resolve) => {
        const code = response?.error?.code ?? 0;
        const succeeded = code === 0;
        if (!succeeded && !Configuration.suppressNotifications()) {
          const message = response?.error?.message ?? "DBT-Interface formatting error.";
          const detail = response?.error?.data?.error ?? "";

          vscode.window.showErrorMessage([message, detail].join("\n"));
        }

        resolve({
          // 0 = all good, 1 = format passed but contains unfixable linting violations, 65 = lint passed but found errors
          succeeded: succeeded,
          lines: [],
        });
      });
    }

    // This is an unlikely scenario, but we should limit the amount of processes happening at once.
    while (SQLFluff.childProcesses.length > 10) {
      const process = SQLFluff.childProcesses.shift();
      process?.kill("SIGKILL");
    }

    const normalizedWorkingDirectory = workingDirectory ? Utilities.normalizePath(workingDirectory) : undefined;
    const shouldUseStdin = !!options.fileContents?.length;
    const finalArgs = [command, ...args, ...Configuration.extraArguments()];

    Utilities.appendHyphenatedLine();
    if (shouldUseStdin) {
      Utilities.outputChannel.appendLine("Reading from stdin, not file, input may be dirty/partial");
      finalArgs.push("-");
    } else if (options.workspacePath) {
      Utilities.outputChannel.appendLine("Reading from workspace, not stdin");
    } else {
      Utilities.outputChannel.appendLine("Reading from file, not stdin");
      // We want to use relative path to the file so intermediate sqlfluff config files can be found
      const normalizedFilePath = Utilities.normalizePath(options.filePath);
      const targetFileRelativePath = normalizedWorkingDirectory
        ? Utilities.normalizePath(path.relative(normalizedWorkingDirectory, normalizedFilePath))
        : normalizedFilePath;
      finalArgs.push(targetFileRelativePath);
    }

    if (Configuration.dbtInterfaceEnabled() && command === CommandType.LINT) {
      const dbtInterface = new DbtInterface(
        shouldUseStdin ? options.fileContents : undefined,
        options.workspacePath ?? options.filePath,
        Configuration.config(),
      );

      Utilities.outputChannel.appendLine("\n--------------------Executing Command--------------------\n");
      Utilities.outputChannel.appendLine(dbtInterface.getLintURL());
      if (shouldUseStdin) {
        Utilities.outputChannel.appendLine("\n-----Request Body-----\n");
        if (options.fileContents) {
          Utilities.outputChannel.appendLine(options.fileContents);
        } else {
          Utilities.outputChannel.appendLine("ERROR: File contents not found.");
        }
      }

      Utilities.appendHyphenatedLine();

      const response: any = await dbtInterface.lint();
      const output: FilePath[] = [
        {
          filepath: options.filePath,
          violations: response.result ?? [],
        },
      ];

      Utilities.outputChannel.appendLine("Raw dbt-omsosis /lint output:");
      Utilities.appendHyphenatedLine();
      Utilities.outputChannel.appendLine(JSON.stringify(response, undefined, 2));
      Utilities.appendHyphenatedLine();

      return new Promise<CommandOutput>((resolve) => {
        const code = response?.error?.code ?? 0;
        const succeeded = code === 0;
        if (!succeeded && !Configuration.suppressNotifications()) {
          const message = response?.error?.message ?? "DBT-Interface linting error.";
          const detail = response?.error?.data?.error ?? "";

          vscode.window.showErrorMessage([message, detail].join("\n"));
        }

        resolve({
          // 0 = all good, 1 = format passed but contains unfixable linting violations, 65 = lint passed but found errors
          succeeded: succeeded,
          lines: [JSON.stringify(output)],
        });
      });
    }

    return new Promise<CommandOutput>((resolve) => {
      const stdoutLint = new LineDecoder();
      const stdoutFix: Buffer[] = [];
      const stderrLines: string[] = [];
      let stdoutLines: string[];

      Utilities.outputChannel.appendLine("\n--------------------Executing Command--------------------\n");
      Utilities.outputChannel.appendLine(Configuration.executablePath() + " " + finalArgs.join(" "));
      Utilities.appendHyphenatedLine();

      const shell = Configuration.shell();
      const environmentVariables = Configuration.environmentVariables(process.env);

      // HERE: Spawn Process
      const childProcess = CProcess.spawn(
        Configuration.executablePath(),
        finalArgs,
        {
          cwd: normalizedWorkingDirectory,
          env: environmentVariables,
          shell: shell,
        },
      );

      SQLFluff.childProcesses.push(childProcess);

      if (childProcess.pid) {
        childProcess.stdout.on("data", onStdoutDataEvent);
        childProcess.stderr.on("data", onStderrDataEvent);
        childProcess.on("close", (code, number) => onCloseEvent(code, number, childProcess));
        if (shouldUseStdin) {
          childProcess.stdin.write(options.fileContents);
          childProcess.stdin.end();
        }
      }

      childProcess.on("message", (message) => {
        Utilities.outputChannel.appendLine("Received message from child process");
        Utilities.outputChannel.appendLine(message.toString());
      });

      childProcess.on("error", (error: Error) => {
        Utilities.outputChannel.appendLine("Child process threw error");
        Utilities.outputChannel.appendLine(error.toString());
        let { message } = error;

        if ((error as any).code === "ENOENT") {
          message = "The sqlfluff executable was not found. ";
          message += "Use the 'Executable Path' setting to configure the location of the executable, or add it to your PATH.";
        }

        if (!Configuration.suppressNotifications()) {
          vscode.window.showErrorMessage(message);
        }

        resolve({ succeeded: false, lines: [] });
      });

      function onStdoutDataEvent(data: Buffer) {
        if (command === CommandType.LINT) {
          stdoutLint.write(data);
        } else {
          stdoutFix.push(data);
        }
      }

      function onStderrDataEvent(data: Buffer) {
        stderrLines.push(data.toString("utf8"));
      }

      function onCloseEvent(code: number | null, signal: any, process: CProcess.ChildProcess) {
        Utilities.outputChannel.appendLine(`Received close event, code ${code} signal ${signal}`);
        Utilities.outputChannel.appendLine("Raw stdout output:");
        Utilities.appendHyphenatedLine();

        if (command === CommandType.LINT) {
          stdoutLint.end();
          stdoutLines = stdoutLint.getLines();
          Utilities.outputChannel.appendLine(stdoutLines.join("\n"));
        } else {
          const encoding: BufferEncoding = "utf8";
          const stringDecoder = new StringDecoder(encoding);

          const stdoutAllLines = stdoutFix.reduce((response, buffer) => {
            response += stringDecoder.write(buffer);
            return response;
          }, "");
          stdoutLines = [stdoutAllLines];
          Utilities.outputChannel.appendLine(stdoutLines.join("\n"));
        }
        Utilities.appendHyphenatedLine();

        if (stderrLines.length > 0) {
          Utilities.outputChannel.appendLine("Raw stderr output:");
          Utilities.appendHyphenatedLine();
          Utilities.outputChannel.appendLine(stderrLines.join("\n"));
          Utilities.appendHyphenatedLine();
        }

        if (stderrLines?.length > 0 && !Configuration.suppressNotifications()) {
          const stderrString = stderrLines.join("\n");
          if (!stderrString.includes("ignored by a .sqlfluffignore pattern")) {
            vscode.window.showErrorMessage(stderrString);
          }
        }

        SQLFluff.childProcesses = SQLFluff.childProcesses.filter(childProcess => childProcess !== process);

        return resolve({
          // 0 = all good, 1 = format passed but contains unfixable linting violations, 65 = lint passed but found errors
          succeeded: code === 0 || code === 1 || code === 65,
          lines: stdoutLines,
        });
      }
    });
  }
}
