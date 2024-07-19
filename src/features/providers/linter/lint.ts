import * as vscode from "vscode";

import { ThrottledDelayer } from "../../helper/async";
import Configuration from "../../helper/configuration";
import RunTrigger from "../../helper/types/runTrigger";
import Utilities from "../../helper/utilities";
import SQLFluff from "../sqlfluff";
import CommandOptions from "../types/commandOptions";
import CommandType from "../types/commandType";
import FileDiagnostic from "./types/fileDiagnostic";
import Linter from "./types/linter";

export default class LintingProvider {
  private executableNotFound: boolean;
  private documentTypeListener!: vscode.Disposable;
  private documentSaveListener!: vscode.Disposable;
  private diagnosticCollection!: vscode.DiagnosticCollection;
  private delayers!: { [key: string]: ThrottledDelayer<void> };
  private linter: Linter;

  constructor(linter: Linter) {
    this.linter = linter;
    this.executableNotFound = false;
  }

  public activate(subscriptions: vscode.Disposable[]) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
    subscriptions.push(this);
    this.loadConfiguration();

    vscode.workspace.onDidChangeConfiguration(this.loadConfiguration, this, subscriptions);
    vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
    vscode.workspace.onDidCloseTextDocument(
      (textDocument) => {
        if (!Configuration.lintEntireProject()) {
          this.diagnosticCollection.delete(textDocument.uri);
        }
        delete this.delayers[textDocument.uri.toString()];
      },
      null,
      subscriptions
    );
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }

  private loadConfiguration(): void {
    this.delayers = Object.create(null);

    if (this.documentSaveListener) {
      this.documentSaveListener.dispose();
    }

    if (this.documentTypeListener) {
      this.documentTypeListener.dispose();
    }

    if (Configuration.runTrigger() === RunTrigger.onType) {
      this.documentTypeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        this.triggerLint(event.document, true, false);
      });
    }

    this.documentSaveListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);

    // Lint all documents in the workspace.
    if (Configuration.lintEntireProject()) this.lintProject();
  }

  public async lintProject(forceLint = false): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders : [];

    for (const workspaceFolder of workspaceFolders) {
      while (SQLFluff.childProcesses.length > 5) {
        await new Promise((sleep) => setTimeout(sleep, 1000));
      }

      const workspacePath = Utilities.normalizePath(workspaceFolder.uri.fsPath);
      this.triggerLint(undefined, false, forceLint, workspacePath);
      // TODO: Wait for child process to be created before continuing with loop.
      await new Promise((sleep) => setTimeout(sleep, 500));
    }
  }

  private triggerLint(
    textDocument?: vscode.TextDocument,
    currentDocument = false,
    forceLint = false,
    workspacePath?: string
  ): void {
    if (
      (textDocument && !this.linter.languageId.includes(textDocument.languageId)) ||
      this.executableNotFound ||
      (Configuration.runTrigger() === RunTrigger.off && !forceLint)
    ) {
      return;
    }

    const key = textDocument?.uri.toString() ?? workspacePath ?? "project";
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
      return this.doLint(textDocument, currentDocument, workspacePath);
    });
  }

  public async doLint(
    document?: vscode.TextDocument,
    currentDocument?: boolean,
    workspacePath?: string
  ): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;
    const workingDirectory = workspacePath ?? Configuration.workingDirectory(rootPath);
    const filePath = document && document.fileName ? Utilities.normalizePath(document.fileName) : workingDirectory;

    if (!filePath) {
      Utilities.outputChannel.appendLine("ERROR: File path not found.");
      if (!Configuration.suppressNotifications()) {
        vscode.window.showErrorMessage("File path not found.");
      }
      return;
    }

    if (workingDirectory?.includes("${")) {
      return;
    }

    if (document && document.isUntitled && document.getText() === "") {
      return;
    }

    const args: string[] = [...Configuration.lintFileArguments()];
    const options: CommandOptions = { filePath: filePath };

    if (workspacePath) {
      options.workspacePath = workspacePath;
    }

    if (Configuration.runTrigger() === RunTrigger.onSave || !currentDocument) {
      options.filePath = filePath;
    } else {
      options.fileContents = document?.getText();
      options.filePath = filePath;
    }

    const result = await SQLFluff.run(workingDirectory, CommandType.LINT, args, options);

    if (!result.succeeded) {
      Utilities.outputChannel.appendLine("Linting command failed to execute");
    }

    let fileDiagnostics: FileDiagnostic[] = [];
    if (result.lines?.length > 0) {
      fileDiagnostics = this.linter.process(result.lines, filePath);

      if (fileDiagnostics.length === 0 && document) {
        this.diagnosticCollection.set(document.uri, []);
        return;
      }

      fileDiagnostics.forEach(async (fileDiagnostic) => {
        const filePath = document ? Utilities.normalizePath(document.fileName) : undefined;

        try {
          if (document && fileDiagnostic.filePath === "stdin") {
            this.diagnosticCollection.set(document.uri, fileDiagnostic.diagnostics);
            return;
          }

          const file = filePath ? filePath : Utilities.normalizePath(fileDiagnostic.filePath);
          if (file) {
            const uri = vscode.Uri.file(file);
            this.diagnosticCollection.set(uri, fileDiagnostic.diagnostics);
          }
        } catch (error) {
          Utilities.outputChannel.appendLine(`ERROR: File ${fileDiagnostic.filePath} not found.`);
          Utilities.outputChannel.appendLine(error as string);
          Utilities.appendHyphenatedLine;
          if (!Configuration.suppressNotifications()) {
            vscode.window.showErrorMessage(`File ${fileDiagnostic.filePath} not found.`);
          }
        }
      });
    }
  }
}
