import * as path from "path";
import * as vscode from "vscode";
import { DiagnosticSeverity } from "vscode";

import { RunTrigger } from "../providers/lint";
import { DiagnosticSetting } from "./types/diagnosticSetting";
import Variables from "./types/variables";
import { normalize, Utilities } from "./utilities";

export class Configuration {
  /** Initialize the configuration options that require a reload upon change. */
  static initialize(): void {
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("sqlfluff.osmosis.enabled")
      ) {
        const action = "Reload";
        vscode.window
          .showInformationMessage(
            "Reload window for configuration change to take effect.",
            action
          )
          .then(selectedAction => {
            if (selectedAction === action) {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });
      }
    });
  }

  public static executablePath(): string {
    let executablePath: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get<string>("executablePath", "sqlfluff");

    executablePath = Utilities.interpolateString(executablePath, Configuration.variables());

    return executablePath;
  }

  public static config(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get<string>("config", "");
  }

  private static dialect(): string[] {
    const dialect: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("dialect");

    return dialect ? ["--dialect", dialect] : [];
  }

  private static excludeRules(): string[] {
    const excludeRulesConfiguration: any = vscode.workspace
      .getConfiguration("sqlfluff")
      .inspect("excludeRules");

    const excludeRulesGlobalArray = excludeRulesConfiguration.globalValue ?? [];
    const excludeRulesWorkspaceArray = excludeRulesConfiguration.workspaceValue ?? [];
    const excludeRulesArray = [...excludeRulesGlobalArray, ...excludeRulesWorkspaceArray];

    const excludeRules = excludeRulesArray.join(",");
    return excludeRules ? ["--exclude-rules", excludeRules] : [];
  }

  public static fixArguments(): string[] {
    return vscode.workspace
      .getConfiguration("sqlfluff.format")
      .get<Array<string>>("arguments", []);
  }

  public static ignoreLocalConfig(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get<boolean>("ignoreLocalConfig");
  }

  private static ignoreParsing(): string[] {
    const ignoreParsing = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("ignoreParsing");

    return ignoreParsing ? ["--ignore", "parsing"] : [];
  }

  public static lintArguments(): string[] {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<Array<string>>("arguments", []);
  }

  private static rules(): string[] {
    const rulesConfiguration: any = vscode.workspace
      .getConfiguration("sqlfluff")
      .inspect("rules");

    const rulesGlobalArray = rulesConfiguration.globalValue ?? [];
    const rulesWorkspaceArray = rulesConfiguration.workspaceValue ?? [];
    const rulesArray = [...rulesGlobalArray, ...rulesWorkspaceArray];

    const rules = rulesArray.join(",");
    return rules ? ["--rules", rules] : [];
  }

  public static suppressNotifications(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get<boolean>("suppressNotifications", false);
  }

  public static workingDirectory(rootPath: string): string {
    const workingDirectory: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get<string>("workingDirectory", "");

    return workingDirectory ? workingDirectory : rootPath;
  }

  /* Format */

  public static formatEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.format")
      .get<boolean>("enabled", true);
  }

  public static executeInTerminal(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.experimental.format")
      .get<boolean>("executeInTerminal", false);
  }

  /* Linter */

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<string>("run", RunTrigger.onType);
  }

  public static delay(): number {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<number>("delay", 100);
  }

  public static diagnosticSeverity(): number {
    const diagnosticSeverity = vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<string>("diagnosticSeverity", "error");

    switch (diagnosticSeverity) {
      case "error":
        return DiagnosticSeverity.Error;
      case "warning":
        return DiagnosticSeverity.Warning;
      case "hint":
        return DiagnosticSeverity.Hint;
      case "information":
        return DiagnosticSeverity.Information;
    }

    return DiagnosticSeverity.Error;
  }

  public static diagnosticSeverityByRule(violation: string): number {
    const diagnosticSeverityByRule = vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<DiagnosticSetting[]>("diagnosticSeverityByRule", []);

    let diagnosticSeverity = undefined;
    for (const diagnosticSetting of diagnosticSeverityByRule) {
      const rule = diagnosticSetting?.rule ?? undefined;
      const severity = diagnosticSetting?.severity ?? undefined;
      if (violation === rule) {
        diagnosticSeverity = severity;
        break;
      }
    }

    switch (diagnosticSeverity) {
      case "error":
        return DiagnosticSeverity.Error;
      case "warning":
        return DiagnosticSeverity.Warning;
      case "hint":
        return DiagnosticSeverity.Hint;
      case "information":
        return DiagnosticSeverity.Information;
    }

    return this.diagnosticSeverity();
  }

  /* Arguments */

  public static lintFileArguments(): string[] {
    const extraArguments = [...this.lintArguments(), "--format", "json"]

    return extraArguments;
  }

  public static formatFileArguments(): string[] {
    const extraArguments = [...this.fixArguments(), "--force"];

    return extraArguments;
  }

  public static extraArguments(): string[] {
    let extraArguments = [];

    extraArguments = Configuration.config() ? extraArguments.concat(["--config", this.config()]) : extraArguments;
    extraArguments = extraArguments.concat(this.dialect());
    extraArguments = extraArguments.concat(this.excludeRules());
    extraArguments = Configuration.ignoreLocalConfig() ? extraArguments.concat(["--ignore-local-config"]) : extraArguments;
    extraArguments = extraArguments.concat(this.ignoreParsing());
    extraArguments = extraArguments.concat(this.rules());

    return extraArguments;
  }

  /* Osmosis */

  public static osmosisEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.osmosis")
      .get<boolean>("enabled", false);
  }

  public static osmosisHost(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.osmosis")
      .get<string>("host", "localhost");
  }

  public static osmosisPort(): number {
    return vscode.workspace
      .getConfiguration("sqlfluff.osmosis")
      .get<number>("port", 8581);
  }

  /**
   * @returns The variables for a terminal
   */
  private static variables(): Variables {
    const rootPath = normalize(vscode.workspace.workspaceFolders[0].uri.fsPath);

    const editor = vscode.window.activeTextEditor;
    const fileName = editor ? normalize(editor.document.fileName) : null;

    const vars: Variables = {
      // - the path of the folder opened in VS Code
      workspaceFolder: rootPath,

      // - the last portion of the path of the folder opened in VS Code
      workspaceFolderBasename: (rootPath) ? path.basename(rootPath) : null,

      // - the current opened file
      file: fileName,

      // - the current opened file relative to workspaceFolder
      relativeFile: (vscode.window.activeTextEditor && rootPath) ? normalize(path.relative(
        rootPath,
        fileName
      )) : null,

      // - the last portion of the path to the file
      fileBasename: fileName ? path.basename(fileName) : null,

      // - the last portion of the path to the file with no file extension
      fileBasenameNoExtension: fileName ? path.parse(path.basename(fileName)).name : null,

      // - the current opened file's dirname
      fileDirname: fileName ? path.dirname(fileName) : null,

      // - the current opened file's extension
      fileExtname: fileName ? path.parse(path.basename(fileName)).ext : null,

      // - the current selected line number in the active file
      lineNumber: (editor) ? editor.selection.active.line + 1 : null,

      // - the current selected text in the active file
      selectedText: (editor) ? editor.document.getText(editor.selection) : null,

      // - the path to the running VS Code executable
      execPath: process.execPath
    };

    return vars;
  }
}
