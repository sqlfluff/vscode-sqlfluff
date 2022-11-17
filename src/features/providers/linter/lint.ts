import * as vscode from "vscode";

import { ThrottledDelayer } from "../../helper/async";
import Configuration from "../../helper/configuration";
import Linter from "../../helper/types/linter";
import RunTrigger from "../../helper/types/runTrigger";
import Utilities from "../../helper/utilities";
import { SQLFluff, SQLFluffCommand, SQLFluffCommandOptions } from "../sqlfluff";

const filePattern = "**/*.{sql,sql-bigquery,jinja-sql}";
const fileRegex = /^.*\.(sql|sql-bigquery|jinja-sql)$/;

export default class LintingProvider {
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

    // Lint all documents in the workspace.
    if (Configuration.lintEntireProject()) this.lintProject();
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
        this.triggerLint(e.document, false, true);
      });
    }
    this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);

    // Configuration has changed. Lint all documents in the workspace.
    if (Configuration.lintEntireProject()) this.lintProject();
  }

  public lintProject(forceLint = false): void {
    vscode.workspace.findFiles(filePattern).then(files => {
      for (const file of files) {
        if (fileRegex.exec(file.path)) {
          vscode.workspace.openTextDocument(file.path).then((document) => {
            this.triggerLint(document, forceLint);
          });
        }
      }
    });
  }

  private triggerLint(textDocument: vscode.TextDocument, forceLint = false, currentDocument = false): void {
    if (
      !this.linter.languageId.includes(textDocument.languageId)
      || this.executableNotFound
      || (Configuration.runTrigger() === RunTrigger.off && !forceLint)
    ) {
      return;
    }

    const key = textDocument.uri.toString();
    let delayer = this.delayers[key];

    if (!delayer) {
      if (Configuration.runTrigger() === RunTrigger.onType) {
        delayer = new ThrottledDelayer<void>(Configuration.delay());
      } else {
        delayer = new ThrottledDelayer<void>(0);
      }
      this.delayers[key] = delayer;
    }

    delayer.trigger(() => {
      return this.doLint(textDocument, currentDocument);
    });
  }

  public async doLint(document: vscode.TextDocument, currentDocument: boolean): Promise<void> {
    const filePath = Utilities.normalizePath(document.fileName);
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = Configuration.workingDirectory(rootPath);

    if (!filePath) {
      Utilities.outputChannel.appendLine("ERROR: File path not found.");
      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage("File path not found.");
      }
      return;
    }

    const args: string[] = [...Configuration.lintFileArguments()];
    const options: SQLFluffCommandOptions = {
      targetFileFullPath: filePath
    };

    if (Configuration.runTrigger() === RunTrigger.onSave || !currentDocument) {
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
