import * as CProcess from "child_process";
import { StringDecoder } from "string_decoder";
import * as vscode from "vscode";

import Configuration from "../helper/configuration";
import Utilities from "../helper/utilities";

export default class Debug {
  public static sqlFluffLocation = "";

  public static async debug(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = Configuration.workingDirectory(rootPath);
    const normalizedWorkingDirectory = workingDirectory ? Utilities.normalizePath(workingDirectory) : undefined;
    const shell = Configuration.shell();

    Utilities.outputChannel.appendLine("\n--------------------Testing Extension--------------------\n");
    Utilities.outputChannel.appendLine("working directory - " + normalizedWorkingDirectory);
    Utilities.outputChannel.appendLine("shell - " + shell);

    const testWorkingDirectory = await Debug.testWorkingDirectory(normalizedWorkingDirectory);
    if (!testWorkingDirectory) {
      Debug.endTesting();
      return;
    }

    const testSqlfluffLocation = await Debug.testSqlfluffLocation(normalizedWorkingDirectory);
    if (!testSqlfluffLocation) {
      Debug.endTesting();
      return;
    }

    const testSqlfluffVersion = await Debug.testSqlfluffVersion(normalizedWorkingDirectory);
    if (!testSqlfluffVersion) {
      if (Debug.sqlFluffLocation !== "") {
        const testSqlfluffVersionRetry = await Debug.testSqlfluffVersion(
          normalizedWorkingDirectory,
          Debug.sqlFluffLocation
        );

        if (!testSqlfluffVersionRetry) {
          Debug.endTesting();
          return;
        }
      } else {
        Debug.endTesting();
        return;
      }
    }

    Debug.endTesting();
  }

  public static async testWorkingDirectory(
    normalizedWorkingDirectory?: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const stdout: Buffer[] = [];
      const stderrLines: string[] = [];

      const command = "dir";
      const args: any[] = [];
      const shell = Configuration.shell();
      const environmentVariables = Configuration.environmentVariables(process.env);

      Utilities.outputChannel.appendLine("\n--------------------Testing Working Directory--------------------\n");
      Utilities.outputChannel.appendLine("command - " + command + " " + args.join(" "));
      if (!shell) {
        Utilities.outputChannel.appendLine("Temporarily settings 'shell' to 'true' for this test");
      }
      Utilities.outputChannel.appendLine("");

      const childProcess = CProcess.spawn(
        command,
        args,
        {
          cwd: normalizedWorkingDirectory,
          env: environmentVariables,
          shell: shell ? shell : true,
        }
      );

      if (childProcess.pid) {
        childProcess.stdout.on("data", onStdoutDataEvent);
        childProcess.stderr.on("data", onStderrDataEvent);
        childProcess.on("close", onCloseEvent);
      }

      childProcess.on("error", (error: Error) => {
        Utilities.outputChannel.appendLine("Child process threw error");
        Utilities.outputChannel.appendLine(error.toString());
        if ((error as any).code === "ENOENT") {
          Utilities.outputChannel.appendLine("TEST FAILED - Invalid Working Directory");
        }

        resolve(false);
      });

      function onStdoutDataEvent(data: Buffer) {
        stdout.push(data);
      }

      function onStderrDataEvent(data: Buffer) {
        stderrLines.push(data.toString("utf8"));
      }

      function onCloseEvent() {
        if (stderrLines.length > 0) {
          Utilities.outputChannel.appendLine("\nTEST FAILED - Invalid Working Directory\n");
          Utilities.outputChannel.appendLine(stderrLines.join("\n"));

          return resolve(false);
        } else {
          Utilities.outputChannel.appendLine("\nTEST SUCCESS - Valid Working Directory");
          return resolve(true);
        }
      }
    });
  }

  public static async testSqlfluffLocation(
    normalizedWorkingDirectory?: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const stdout: Buffer[] = [];
      const stderrLines: string[] = [];
      let stdoutLines: string[];

      const command = "where";
      const args: any[] = ["sqlfluff"];
      const shell = Configuration.shell();
      const environmentVariables = Configuration.environmentVariables(process.env);

      Utilities.outputChannel.appendLine("\n--------------------Testing SQLFluff Location--------------------\n");
      Utilities.outputChannel.appendLine("command - " + command + " " + args.join(" "));

      const childProcess = CProcess.spawn(
        command,
        args,
        {
          cwd: normalizedWorkingDirectory,
          env: environmentVariables,
          shell: shell
        }
      );

      if (childProcess.pid) {
        childProcess.stdout.on("data", onStdoutDataEvent);
        childProcess.stderr.on("data", onStderrDataEvent);
        childProcess.on("close", onCloseEvent);
      }

      childProcess.on("error", (error: Error) => {
        Utilities.outputChannel.appendLine("\nTEST FAILED - SQLFluff location not found");
        Utilities.outputChannel.appendLine(error.toString());

        resolve(false);
      });

      function onStdoutDataEvent(data: Buffer) {
        stdout.push(data);
      }

      function onStderrDataEvent(data: Buffer) {
        stderrLines.push(data.toString("utf8"));
      }

      function onCloseEvent() {
        const encoding: BufferEncoding = "utf8";
        const stringDecoder = new StringDecoder(encoding);

        const stdoutAllLines = stdout.reduce((response, buffer) => {
          response += stringDecoder.write(buffer)
            .replace("\r\n", "")
            .replace("\n", "")
            .split("\\")
            .join("/");


          return response;
        }, "");

        stdoutLines = [stdoutAllLines];
        Debug.sqlFluffLocation = stdoutAllLines;

        if (stderrLines.length > 0) {
          Utilities.outputChannel.appendLine("\nTEST FAILED - SQLFluff location not found\n");
          Utilities.outputChannel.appendLine(stderrLines.join("\n"));

          return resolve(false);
        }

        Utilities.outputChannel.appendLine("\nTEST SUCCESS - SQLFluff Location = " + stdoutLines.join("\n"));

        return resolve(true);
      }
    });
  }

  public static async testSqlfluffVersion(
    normalizedWorkingDirectory?: string,
    retryCommand?: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const stdout: Buffer[] = [];
      const stderrLines: string[] = [];
      let stdoutLines: string[];

      const command = retryCommand ?? Configuration.executablePath();
      const args: any[] = ["--version"];
      const shell = Configuration.shell();
      const environmentVariables = Configuration.environmentVariables(process.env);

      if (retryCommand) {
        Utilities.outputChannel.appendLine("\n--------------------Testing SQLFluff Version (Retrying with path found in location test)--------------------\n");
      } else {
        Utilities.outputChannel.appendLine("\n--------------------Testing SQLFluff Version--------------------\n");
      }
      Utilities.outputChannel.appendLine("command - " + command + " " + args.join(" "));

      const childProcess = CProcess.spawn(
        command,
        args,
        {
          cwd: normalizedWorkingDirectory,
          env: environmentVariables,
          shell: shell
        }
      );

      if (childProcess.pid) {
        childProcess.stdout.on("data", onStdoutDataEvent);
        childProcess.stderr.on("data", onStderrDataEvent);
        childProcess.on("close", onCloseEvent);
      }

      childProcess.on("error", (error: Error) => {
        Utilities.outputChannel.appendLine("\nTEST FAILED - SQLFluff Version not found");
        Utilities.outputChannel.appendLine(error.toString());

        resolve(false);
      });

      function onStdoutDataEvent(data: Buffer) {
        stdout.push(data);
      }

      function onStderrDataEvent(data: Buffer) {
        stderrLines.push(data.toString("utf8"));
      }

      function onCloseEvent() {
        const encoding: BufferEncoding = "utf8";
        const stringDecoder = new StringDecoder(encoding);

        const stdoutAllLines = stdout.reduce((response, buffer) => {
          response += stringDecoder.write(buffer)
            .replace("\r\n", "")
            .replace("\n", "")
            .split("\\")
            .join("/");

          return response;
        }, "");

        stdoutLines = [stdoutAllLines];

        if (stderrLines.length > 0) {
          Utilities.outputChannel.appendLine("\nTEST FAILED - SQLFluff Version not found");
          Utilities.outputChannel.appendLine(stderrLines.join("\n"));

          return resolve(false);
        }

        Utilities.outputChannel.appendLine("\nTEST SUCCESS - SQLFluff Version = " + stdoutLines.join("\n"));

        return resolve(true);
      }
    });
  }

  private static endTesting() {
    Utilities.appendHyphenatedLine(false);
    Utilities.outputChannel.appendLine("");
    Debug.sqlFluffLocation = "";
  }
}
