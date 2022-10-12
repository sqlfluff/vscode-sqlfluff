"use strict";
import * as vscode from "vscode";

import { ThrottledDelayer } from "../helper/async";
import { Configuration } from "../helper/configuration";
import { SQLFluff, SQLFluffCommand, SQLFluffCommandOptions } from "../helper/sqlfluff";
import { normalize, Utilities } from "../helper/utilities";

export enum RunTrigger {
  onSave = "onSave",
  onType = "onType",
  off = "off"
}

export interface Linter {
  languageId: Array<string>,
  process: (output: string[]) => vscode.Diagnostic[];
}

export class LintingProvider {
  private executableNotFound: boolean;
  private documentListener!: vscode.Disposable;
  private diagnosticCollection!: vscode.DiagnosticCollection;
  private delayers!: { [key: string]: ThrottledDelayer<void>; };
  private linter: Linter;

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

  private async doLint(document: vscode.TextDocument): Promise<void> {
    const filePath = normalize(document.fileName);
    const rootPath = normalize(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const workingDirectory = Configuration.workingDirectory(rootPath);

    const args: string[] = [...Configuration.lintFileArguments()];
    const options: SQLFluffCommandOptions = {};

    if (Configuration.runTrigger() === RunTrigger.onSave) {
      options.targetFileFullPath = filePath;
    } else {
      options.fileContents = document.getText();
      options.targetFileFullPath = filePath;
    }

    const result = await SQLFluff.run(
      workingDirectory,
      SQLFluffCommand.LINT,
      args,
      options
    );

    if (!result.succeeded) {
      Utilities.outputChannel.appendLine("Linting command failed to execute");
    }

    let diagnostics: vscode.Diagnostic[] = [];
    if (result.lines?.length > 0) {
      diagnostics = this.linter.process(result.lines);
      this.diagnosticCollection.set(document.uri, diagnostics);
    }
  }
}
