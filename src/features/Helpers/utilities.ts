import * as vscode from "vscode";

export function normalize(path: string): string {
  return path.replace(/\\+/g, "/");
}

export class Utilities {
  static outputChannel = vscode.window.createOutputChannel("SQLFluff");

  public static appendHyphenatedLine() {
    Utilities.outputChannel.appendLine("\n------------------------------------------------------------\n");
  }

  public static interpolateString(command: string, data: object): string {
    let match: RegExpExecArray;
    const regex = /\$\{([^\}]+)\}/g; // eslint-disable-line no-useless-escape
    while (match = regex.exec(command)) { // eslint-disable-line no-cond-assign
      const path = match[1].split(".").reverse();
      let arg = data[path.pop()];
      while (path.length) arg = arg[path.pop()];
      command = command.replace(match[0], arg);
    }
    return command;
  }

  public static async sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}
