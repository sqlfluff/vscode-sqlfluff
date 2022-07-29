import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { StringDecoder } from "string_decoder";
import { TextDocument } from "vscode";

export default class Process {
  static process: ChildProcess | null = null;

  /**
   * Creates a child process to execute a command.
   *
   * @param command - The command to run.
   * @param args - A list of string arguments.
   * @param options - The working directory and environment variables.
   * @returns The output of the child process.
   */
  static run(command: string, args: string[], options: SpawnOptions, document: TextDocument): Promise<string> {
    return new Promise((resolve) => {
      const buffers: any[] = [];

      const onData = (data: Buffer) => {
        buffers.push(data);
      };

      const onClose = () => {
        const encoding: BufferEncoding = "utf8";
        const stringDecoder = new StringDecoder(encoding);

        const output = buffers.reduce((response, buffer) => {
          response += stringDecoder.write(buffer);
          return (response);
        }, "");

        resolve(output);
      };

      if (this.process) {
        this.process.kill();
      }

      this.process = spawn(
        command,
        args,
        options
      );

      if (this.process && this.process.pid) {
        this.process.stdin.write(document.getText());
        this.process.stdin.end();

        this.process.stdout.on("data", onData);

        this.process.on("error", (error: any) => {
          resolve(error.message);
        });

        this.process.on("close", onClose);
      }
    });
  }
}
