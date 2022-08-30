"use strict";
import * as cp from "child_process";
import * as vscode from "vscode";

import { Configuration } from "../Helpers/configuration";
import { ThrottledDelayer } from "./async";
import { LineDecoder } from "./lineDecoder";

enum RunTrigger {
  onSave = "onSave",
  onType = "onType",
  off = "off"
}

export interface Linter {
  languageId: Array<string>,
  process: (output: string[]) => vscode.Diagnostic[];
}

export class LintingProvider {
  public oldExecutablePath: string;

  private executableNotFound: boolean;
  private documentListener!: vscode.Disposable;
  private diagnosticCollection!: vscode.DiagnosticCollection;
  private delayers!: { [key: string]: ThrottledDelayer<void>; };
  private linter: Linter;
  private childProcess: cp.ChildProcess;

  constructor(linter: Linter) {
    this.linter = linter;
    this.executableNotFound = false;
  }

  public activate(subscriptions: vscode.Disposable[]) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
    subscriptions.push(this);
    vscode.workspace.onDidChangeConfiguration(this.loadConfiguration, this, subscriptions);
    this.loadConfiguration();

    vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
    vscode.workspace.onDidCloseTextDocument((textDocument) => {
      this.diagnosticCollection.delete(textDocument.uri);
      delete this.delayers[textDocument.uri.toString()];
    }, null, subscriptions);

    // Lint all open documents documents
    vscode.workspace.textDocuments.forEach(this.triggerLint, this);
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }

  private loadConfiguration(): void {
    this.delayers = Object.create(null);

    if (this.executableNotFound) {
      this.executableNotFound = this.oldExecutablePath === Configuration.executablePath();
    }

    if (this.documentListener) {
      this.documentListener.dispose();
    }

    if (Configuration.runTrigger() === RunTrigger.onType) {
      this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
        this.triggerLint(e.document);
      });
    }
    this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);

    // Configuration has changed. Reevaluate all documents.
    vscode.workspace.textDocuments.forEach(this.triggerLint, this);
  }

  private triggerLint(textDocument: vscode.TextDocument): void {
    if (
      !this.linter.languageId.includes(textDocument.languageId)
      || this.executableNotFound
      || Configuration.runTrigger() === RunTrigger.off
    ) {
      return;
    }

    const key = textDocument.uri.toString();
    let delayer = this.delayers[key];

    if (!delayer) {
      delayer = new ThrottledDelayer<void>(500);
      this.delayers[key] = delayer;
    }

    delayer.trigger(() => { return this.doLint(textDocument); });
  }

  private doLint(document: vscode.TextDocument): Promise<void> {
    return new Promise<void>((resolve) => {
      const decoder = new LineDecoder();
      const filePath = document.fileName.replace(/\\+/g, "/");
      const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\+/g, "/");
      const workingDirectory = Configuration.workingDirectory() ? Configuration.workingDirectory() : rootPath;

      let args: string[];
      let diagnostics: vscode.Diagnostic[] = [];

      const onDataEvent = (data: Buffer) => {
        decoder.write(data);
      };

      const onEndEvent = () => {
        decoder.end();

        const lines = decoder.getLines();
        if (lines && lines.length > 0) {
          diagnostics = this.linter.process(lines);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
        resolve();
      };

      const options = workingDirectory ?
        {
          cwd: workingDirectory,
          env: {
            LANG: "en_US.utf-8"
          }
        } : undefined;

      if (Configuration.runTrigger() === RunTrigger.onSave) {
        args = [...Configuration.lintFileArguments(), filePath];
      } else {
        args = Configuration.lintBufferArguments();
      }
      args = args.concat(Configuration.extraArguments());

      if (this.childProcess) {
        this.childProcess.kill();
      }
      this.childProcess = cp.spawn(Configuration.executablePath(), args, options);

      this.childProcess.on("error", (error: Error) => {
        let message = "";
        if (this.executableNotFound) {
          resolve();
          return;
        }

        if ((<any>error).code === "ENOENT") {
          message = `Cannot lint ${document.fileName}. The executable was not found. Use the 'Executable Path' setting to configure the location of the executable`;
        } else {
          message = error.message ? error.message : `Failed to run executable using path: ${Configuration.executablePath()}. Reason is unknown.`;
        }

        this.oldExecutablePath = Configuration.executablePath();
        this.executableNotFound = true;
        vscode.window.showInformationMessage(message);
        resolve();
      });

      if (this.childProcess.pid) {
        if (Configuration.runTrigger() === RunTrigger.onType) {
          this.childProcess.stdin.write(document.getText());
          this.childProcess.stdin.end();
        }

        this.childProcess.stdout.on("data", onDataEvent);
        this.childProcess.stdout.on("end", onEndEvent);
        resolve();
      } else {
        resolve();
      }
    });
  }
}
