import * as childProcess from "child_process";
import path = require("path");
import { StringDecoder } from "string_decoder";
import * as vscode from "vscode";

import { Configuration } from "./configuration";
import { LineDecoder } from "./lineDecoder";
import { Osmosis } from "./osmosis";
import { normalize, Utilities } from "./utilities";

export enum SQLFluffCommand {
  LINT = "lint",
  FIX = "fix",
}

export interface SQLFluffCommandOutput {
  succeeded: boolean;
  lines: string[];
}

export interface SQLFluffCommandOptions {
  targetFileFullPath?: string;
  fileContents?: string;
}

export class SQLFluff {
  static process: childProcess.ChildProcess;

  public static async run(cwd: string, command: SQLFluffCommand, args: string[], options: SQLFluffCommandOptions): Promise<SQLFluffCommandOutput> {
    if (!options.fileContents && !options.targetFileFullPath) {
      throw new Error("You must supply either a target file path or the file contents to scan");
    }

    if (SQLFluff.process) {
      SQLFluff.process.kill("SIGKILL");
      SQLFluff.process = undefined;
    }

    const normalizedCwd = normalize(cwd);
    const shouldUseStdin = !!options.fileContents?.length;
    const finalArgs = [
      command,
      ...args,
      ...Configuration.extraArguments(),
    ];

    if (shouldUseStdin) {
      Utilities.outputChannel.appendLine("Reading from stdin, not file, input may be dirty/partial");
      finalArgs.push("-");
    } else {
      Utilities.outputChannel.appendLine("Reading from file, not stdin");
      // we want to use relative path to the file so intermediate sqlfluff config files can be found
      const normalizedTargetFileFullPath = normalize(options.targetFileFullPath);
      const targetFileRelativePath = path.relative(normalizedCwd, normalizedTargetFileFullPath);
      finalArgs.push(targetFileRelativePath);
    }

    if (Configuration.osmosisEnabled() && command === SQLFluffCommand.LINT) {
      const response: any = await Osmosis.lint(
        // TODO: Find a way to correctly pass in the file contents for the sql query param
        undefined, // shouldUseStdin ? options.fileContents : undefined,
        options.targetFileFullPath,
        Configuration.config(),
        Configuration.ignoreLocalConfig()
      );
      // const output = `{"filepath": "${options.targetFileFullPath}", violations: ${response.result ? JSON.stringify(response.result) : "[]"}}`;
      const output = [{
        filepath: options.targetFileFullPath,
        violations: response.result ?? []
      }];

      return new Promise<SQLFluffCommandOutput>((resolve) => {
        const code = response?.data?.code ? response.data.code : (response?.error?.code ? response.error.code : -1);

        resolve({
          // 0 = all good, 1 = format passed but contains unfixable linting violations, 65 = lint passed but found errors
          succeeded: code === 0 || code === 1 || code === 65,
          lines: [JSON.stringify(output)]
        });
      });
    }

    return new Promise<SQLFluffCommandOutput>((resolve) => {
      const stdoutLint = new LineDecoder();
      const stdoutFix = [];
      let stdoutLines: string[];
      const stderrLines = [];

      const onStdoutDataEvent = (data: Buffer) => {
        if (command === SQLFluffCommand.LINT) {
          stdoutLint.write(data);
        } else {
          stdoutFix.push(data);
        }
      };

      const onStderrDataEvent = (data: Buffer) => {
        stderrLines.push(data.toString("utf8"));
      };

      const onCloseEvent = (code: number, signal: any) => {
        Utilities.outputChannel.appendLine(`Received close event, code ${code} signal ${signal}`);
        Utilities.outputChannel.appendLine("Raw stdout output:");

        Utilities.appendHyphenatedLine();
        if (command === SQLFluffCommand.LINT) {
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
          vscode.window.showErrorMessage(stderrLines.join("\n"));
        }

        return resolve({
          // 0 = all good, 1 = format passed but contains unfixable linting violations, 65 = lint passed but found errors
          succeeded: code === 0 || code === 1 || code === 65,
          lines: stdoutLines,
        });
      };

      Utilities.outputChannel.appendLine("\n--------------------Executing Command--------------------\n");
      Utilities.outputChannel.appendLine(Configuration.executablePath() + " " + finalArgs.join(" "));
      Utilities.appendHyphenatedLine();

      SQLFluff.process = childProcess.spawn(Configuration.executablePath(), finalArgs, {
        cwd: normalizedCwd,
      });

      if (SQLFluff.process.pid) {
        SQLFluff.process.stdout.on("data", onStdoutDataEvent);
        SQLFluff.process.stderr.on("data", onStderrDataEvent);
        SQLFluff.process.on("close", onCloseEvent);
        if (shouldUseStdin) {
          SQLFluff.process.stdin.write(options.fileContents);
          SQLFluff.process.stdin.end();
        }
      }

      SQLFluff.process.on("message", (message) => {
        Utilities.outputChannel.appendLine("Received message from child process");
        Utilities.outputChannel.appendLine(message.toString());
      });

      SQLFluff.process.on("error", (error: Error) => {
        Utilities.outputChannel.appendLine("Child process threw error");
        Utilities.outputChannel.appendLine(error.toString());
        let { message } = error;

        if ((error as any).code === "ENOENT") {
          message = "The sqlfluff executable was not found. Use the 'Executable Path' setting to configure the location of the executable, or add it to your PATH.";
        }

        if (!Configuration.suppressNotifications()) {
          vscode.window.showErrorMessage(message);
        }

        resolve({ succeeded: false, lines: [] });
      });
    });
  }
}
