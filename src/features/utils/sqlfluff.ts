import * as vscode from "vscode";
import * as path from "path";
import * as childProcess from "child_process";

import { Configuration } from "../helpers/configuration"
import { LineDecoder } from "./lineDecoder";

export enum SQLFluffCommand {
  LINT = 'lint',
  FIX = 'fix',
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
  public executableNotFound: boolean;
  public outputChannel: vscode.OutputChannel;
  private process: childProcess.ChildProcess;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  run(cwd: string, command: SQLFluffCommand, args: string[], options: SQLFluffCommandOptions): Promise<SQLFluffCommandOutput> {
    if (!options.fileContents && !options.targetFileFullPath) {
      throw new Error('You must supply either a target file path or the file contents to scan');
    }
    if (this.process) {
      this.process.kill('SIGKILL');
      this.process = undefined;
    }
    const workspaceFolderRootPath = path.normalize(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const workingDirectory = Configuration.workingDirectory() ? Configuration.workingDirectory() : workspaceFolderRootPath;
    const normalizedCwd = path.normalize(cwd);

    return new Promise<SQLFluffCommandOutput>((resolve) => {
      const stdoutDecoder = new LineDecoder();
      let stderrLines = [];

      const onStdoutDataEvent = (data: Buffer) => {
        stdoutDecoder.write(data);
      };

      const onStderrDataEvent = (data: Buffer) => {
        stderrLines.push(data.toString('utf8'));
      };

      const onCloseEvent = (code, signal) => {
        this.outputChannel.appendLine(`Received close event, code ${code} signal ${signal}`);
        stdoutDecoder.end();

        const stdoutLines = stdoutDecoder.getLines();
        this.outputChannel.appendLine(`Raw stdout output:`);
        this.outputChannel.appendLine(stdoutLines.join('\n'));
        this.outputChannel.appendLine(`Raw stderr output:`);
        this.outputChannel.appendLine(stderrLines.join('\n'));

        if (stderrLines?.length > 0) {
          vscode.window.showErrorMessage(stderrLines.join('\n'));
        }

        return resolve({
          succeeded: code === 0 || code === 65, // 0 = all good, 65 = lint passed, but found errors
          lines: stdoutLines,
        });
      };

      const shouldUseStdin = !!options.fileContents?.length;

      const finalArgs = [
        command,
        ...args,
        ...Configuration.extraArguments(),
      ];

      if (shouldUseStdin) {
        this.outputChannel.appendLine('Reading from stdin, not file, input may be dirty/partial');
        finalArgs.push('-');
      } else {
        this.outputChannel.appendLine('Reading from file, not stdin');
        // we want to use relative path to the file so intermediate sqlfluff config
        // files can be found
        const normalizedTargetFileFullPath = path.normalize(options.targetFileFullPath);
        const targetFileRelativePath = path.relative(normalizedCwd, normalizedTargetFileFullPath);
        finalArgs.push(targetFileRelativePath);
      }
      this.process = childProcess.spawn(Configuration.executablePath(), finalArgs, {
        cwd: workingDirectory,
      });

      if (this.process.pid) {
        this.process.stdout.on("data", onStdoutDataEvent);
        this.process.stderr.on("data", onStderrDataEvent);
        this.process.on("close", onCloseEvent);
        if (shouldUseStdin) {
          this.process.stdin.write(options.fileContents);
          this.process.stdin.end();
        }
      }

      this.process.on('message', (message) => {
        this.outputChannel.appendLine('Received message from child process');
        this.outputChannel.appendLine(message.toString());
      })

      this.process.on("error", (error: Error) => {
        this.outputChannel.appendLine('Child process threw error');
        this.outputChannel.appendLine(error.toString());
        let { message } = error;

        if ((error as any).code === "ENOENT") {
          message = "The sqlfluff executable was not found. Use the 'Executable Path' setting to configure the location of the executable, or add it to your PATH.";
        }

        this.executableNotFound = true;
        vscode.window.showErrorMessage(message);
        resolve({ succeeded: false, lines: [] });
      });
    });
  }
}
