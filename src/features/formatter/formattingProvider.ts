"use strict";

import * as cp from "child_process";

import { TextEdit, Range } from "vscode";
import * as vscode from "vscode";

import { LinterConfiguration } from "../utils/lintingProvider";
import { LineDecoder } from "../utils/lineDecoder";

export class DocumentFormattingEditProvider {
  public linterConfigurationFunc: () => LinterConfiguration;

  constructor(linterConfigurationFunc: () => LinterConfiguration) {
    this.linterConfigurationFunc = linterConfigurationFunc;
    vscode.workspace.onDidChangeConfiguration(linterConfigurationFunc, this);
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): vscode.TextEdit[] {
    const textEdits: TextEdit[] = [];
    const linterConfiguration = this.linterConfigurationFunc();

    if (linterConfiguration.formatterEnabled) {
      let executable = linterConfiguration.executable;
      let tmp = linterConfiguration.bufferArgs;

      // let args: string[] = ["fix", "--force", document.fileName];
      let args: string[] = ["fix", "--force", "-"];
      let options = vscode.workspace.rootPath
        ? { cwd: vscode.workspace.rootPath }
        : undefined;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "SQLFluff is formatting the file.",
          cancellable: true,
        },
        async (progress, token) => {
          return new Promise<void>((resolve, reject) => {
            let childProcess = cp.spawn(executable, args, options);
            token.onCancellationRequested(_ => {
              childProcess.kill();
              resolve();
            });
            childProcess.on("error", (error: Error) => {
              let message: string = "";
              if ((<any>error).code === "ENOENT") {
                message = `Cannot lint ${document.fileName}. The executable was not found. Use the 'Executable Path' setting to configure the location of the executable`;
              } else {
                message = error.message
                  ? error.message
                  : `Failed to run executable using path: ${executable}. Reason is unknown.`;
              }
              vscode.window.showErrorMessage(message);
              reject(message);
            });
            let decoder = new LineDecoder();
            let onDataEvent = (data: Buffer) => {
              decoder.formatResultWriter(data);
            };
  
            let onEndEvent = () => {
              decoder.end();
              let lines = decoder.getLines();
              if (lines && lines.length > 0) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                  const document = editor.document;
                  const selection = editor.selection;
  
                  editor.edit((editBuilder) => {
                    const lineCount = document.lineCount;
                    let lastLineRange = document.lineAt(lineCount - 1).range;
                    const endChar = lastLineRange.end.character;
                    if (lines[0].startsWith("NO SAFETY:")) {
                      lines.shift();
                      lines.shift();
                    }
                    editBuilder.replace(
                      new Range(0, 0, document.lineCount, endChar),
                      lines.join("\n")
                    );
                  });
                }
              }
              resolve();
            };
  
            if (childProcess.pid) {
              childProcess.stdin.write(document.getText());
              childProcess.stdin.end();
              childProcess.stdout.on("data", onDataEvent);
              childProcess.stdout.on("end", onEndEvent);
  
              childProcess.on('exit', (code) => {
                if (code !== null && code !== 0) {
                  vscode.window.showErrorMessage(`sqlfluff process exited with code ${code}`);
                  reject();
                }
                resolve();
              });
            } else {
              reject();
            }
          });
        }
      );
    }
    return textEdits;
  }
}
