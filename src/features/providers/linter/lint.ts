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

    // Lint all documents in the workspace.
    if (Configuration.lintEntireProject()) this.lintProject(true);
  }

  public async lintProject(forceLint = false): Promise<void> {
    const files = await vscode.workspace.findFiles(filePattern);

    for (const file of files) {
      if (fileRegex.exec(file.path)) {
        while (SQLFluff.childProcesses.length > 4) {
          await new Promise(sleep => setTimeout(sleep, 1000));
        }

        const document = await vscode.workspace.openTextDocument(file.path);
        this.triggerLint(document, forceLint);
        // TODO: Wait for child process to be created before continuing with loop.
        await new Promise(sleep => setTimeout(sleep, 500));
      }
    }
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
        const delay = forceLint ? 0 : Configuration.delay();
        delayer = new ThrottledDelayer<void>(delay);
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
