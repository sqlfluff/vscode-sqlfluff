"use strict";
import * as cp from "child_process";
import * as vscode from "vscode";
import * as path from "path";

import { Configuration } from "../helpers/configuration";
import { ThrottledDelayer } from "../utils/async";
import { LineDecoder } from "../utils/lineDecoder";
import { SQLFluff, SQLFluffCommand, SQLFluffCommandOptions } from "../utils/sqlfluff";

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
  public outputChannel: vscode.OutputChannel;
  public oldExecutablePath: string;
  public runner: SQLFluff;

  private executableNotFound: boolean;
  private documentListener!: vscode.Disposable;
  private diagnosticCollection!: vscode.DiagnosticCollection;
  private delayers!: { [key: string]: ThrottledDelayer<void>; };
  private linter: Linter;
  private childProcess: cp.ChildProcess;

  constructor(outputChannel: vscode.OutputChannel, linter: Linter) {
    this.linter = linter;
    this.executableNotFound = false;
    this.outputChannel = outputChannel;
    this.runner = new SQLFluff(this.outputChannel);
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
    this.outputChannel.appendLine(`Lint triggered for ${key}`);
    let delayer = this.delayers[key];

    if (!delayer) {
      delayer = new ThrottledDelayer<void>(500);
      this.delayers[key] = delayer;
    }

    delayer.trigger(() => { return this.doLint(textDocument); });
  }

  private async doLint(document: vscode.TextDocument): Promise<void> {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
    const workingDirectory = Configuration.workingDirectory() || rootPath;

    let args: string[] = [];
    let options: SQLFluffCommandOptions = {};

    if (document.isDirty && Configuration.runTrigger() === RunTrigger.onType) {
      // doc is dirty and we run on type, so pass it to buffer input linting
      args = [...Configuration.lintBufferArguments()]
      options.fileContents = document.getText();
    } else {
      // doc is clean (saved) or we are linting onSave, so we should lint from file
      args = [...Configuration.lintFileArguments()]
      options.targetFileFullPath = document.fileName;
    }

    const result = await this.runner.run(
      workingDirectory,
      SQLFluffCommand.LINT,
      args,
      options,
    );

    if (!result.succeeded) {
      throw new Error('Command failed to execute, check logs for details');
    }

    let diagnostics: vscode.Diagnostic[] = [];
    if (result.lines?.length > 0) {
      diagnostics = this.linter.process(result.lines);
      this.diagnosticCollection.set(document.uri, diagnostics);
    }
  }
}
