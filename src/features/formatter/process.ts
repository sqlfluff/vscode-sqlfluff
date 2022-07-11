import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { StringDecoder } from "string_decoder";
import { TextDocument } from "vscode";

export default class Process {
  private process: ChildProcess | null = null;

  /**
   * Creates a child process to execute a command.
   *
   * @param command - The command to run.
   * @param args - A list of string arguments.
   * @param options - The working directory and environment variables.
   * @returns The output of the child process.
   */
  run(command: string, args: string[], options: SpawnOptions, document: TextDocument): Promise<string> {
    return new Promise((resolve) => {
      const buffers: any[] = [];

      this.process = spawn(
        command,
        args,
        options
      );

      if (!this.process) {
        return;
      }

      if (this.process.pid) {
        this.process.stdin.write(document.getText());
        this.process.stdin.end();
      }

      this.process.stdout?.on("data", data => {
        buffers.push(data);
      });

      this.process.on("error", (error: any) => {
        resolve(error.message);
      });

      this.process.on("close", () => {
        const encoding: BufferEncoding = "utf8";
        const stringDecoder = new StringDecoder(encoding);

        const output = buffers.reduce((response, buffer) => {
          response += stringDecoder.write(buffer);
          return (response);
        }, "");

        resolve(output);
      });
    });
  }
}
