import * as path from "path";
import * as vscode from "vscode";
import { DiagnosticSeverity } from "vscode";

import DiagnosticSetting from "./types/diagnosticSetting";
import EnvironmentVariable from "./types/environmentVariable";
import RunTrigger from "./types/runTrigger";
import Variables from "./types/variables";
import Utilities from "./utilities";

export const filePattern = "**/*.{sql,sql-bigquery,jinja-sql}";
export const fileRegex = /^.*\.(sql|sql-bigquery|jinja-sql)$/;

export default class Configuration {
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

  public static environmentVariables(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    const environmentVariables = vscode.workspace
      .getConfiguration("sqlfluff")
      .get<EnvironmentVariable[]>("environmentVariables", []);

    const environment = env;
    for (const variable of environmentVariables) {
      const key = variable?.key ?? undefined;
      const value = variable?.value ?? undefined;
      if (key && value) {
        environment[key] = value;
      }
    }

    return environment;
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
    const dialect: string | undefined = vscode.workspace
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
      .get<string[]>("arguments", []);
  }

  public static ignoreLocalConfig(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get<boolean>("ignoreLocalConfig", false);
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
      .get<string[]>("arguments", []);
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

  public static workingDirectory(rootPath: string | undefined): string | undefined {
    const workingDirectory: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get<string>("workingDirectory", "");

    return workingDirectory ? workingDirectory : rootPath;
  }

  /* Code Actions */

  public static excludeRulesWorkspace(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.codeActions.excludeRules")
      .get<boolean>("workspace", true);
  }

  public static excludeRulesGlobal(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.codeActions.excludeRules")
      .get<boolean>("global", true);
  }

  public static noqaEnabled(): boolean {
    const noqa = vscode.workspace
      .getConfiguration("sqlfluff.codeActions")
      .get<string[] | boolean>("noqa", true);

    if (noqa === false) return noqa;
    return true;
  }

  public static noqaDisabledRules(): string[] {
    const defaultDisabledRules = ["L015", "L017", "L019", "L030", "L032", "L034", "L035", "L037", "L038", "L040", "L041", "L042", "L043", "L044", "L054", "L058", "L063", "L064"];
    const noqa = vscode.workspace
      .getConfiguration("sqlfluff.codeActions")
      .get<string[] | boolean>("noqa", defaultDisabledRules);

    if (typeof noqa === "boolean") return [];

    return noqa;
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

  public static lintEntireProject(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<boolean>("lintEntireProject", false);
  }

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get<string>("run", RunTrigger.onType);
  }

  /* Arguments */

  public static lintFileArguments(): string[] {
    const extraArguments = [...this.lintArguments(), "--format", "json"];

    return extraArguments;
  }

  public static formatFileArguments(): string[] {
    const extraArguments = [...this.fixArguments(), "--force"];

    return extraArguments;
  }

  public static extraArguments(): string[] {
    let extraArguments: any[] = [];

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
  static variables(): Variables {
    // HERE: workspace
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    const rootPath = workspaceFolder ? Utilities.normalizePath(workspaceFolder) : undefined;

    const editor = vscode.window.activeTextEditor;
    const fileName = editor ? Utilities.normalizePath(editor.document.fileName) : undefined;

    const vars: Variables = {
      // - the path of the folder opened in VS Code
      workspaceFolder: rootPath,

      // - the last portion of the path of the folder opened in VS Code
      workspaceFolderBasename: rootPath ? path.basename(rootPath) : undefined,

      // - the current opened file
      file: fileName,

      // - the current opened file relative to workspaceFolder
      relativeFile: (vscode.window.activeTextEditor && rootPath && fileName) ? Utilities.normalizePath(path.relative(
        rootPath,
        fileName
      )) : undefined,

      // - the last portion of the path to the file
      fileBasename: fileName ? path.basename(fileName) : undefined,

      // - the last portion of the path to the file with no file extension
      fileBasenameNoExtension: fileName ? path.parse(path.basename(fileName)).name : undefined,

      // - the current opened file's dirname
      fileDirname: fileName ? path.dirname(fileName) : undefined,

      // - the current opened file's extension
      fileExtname: fileName ? path.parse(path.basename(fileName)).ext : undefined,

      // - the current selected line number in the active file
      lineNumber: editor ? (editor.selection.active.line + 1).toString() : undefined,

      // - the current selected text in the active file
      selectedText: editor ? editor.document.getText(editor.selection) : undefined,

      // - the path to the running VS Code executable
      execPath: process.execPath
    };

    return vars;
  }
}
