import * as path from "path";
import * as vscode from "vscode";

import Variables from "./types/variables";
import { normalize, Utilities } from "./utilities";

export class Configuration {
  public static executablePath(): string {
    let executablePath: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("executablePath") || "sqlfluff";

    executablePath = Utilities.interpolateString(executablePath, Configuration.variables());

    return executablePath;
  }

  private static config(): string[] {
    let config: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("config") || "";

    config = Utilities.interpolateString(config, Configuration.variables());

    return config ? ["--config", config] : [];
  }

  private static dialect(): string[] {
    const dialect: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("dialect");

    return dialect ? ["--dialect", dialect] : [];
  }

  private static excludeRules(): string[] {
    const excludeRulesArray: string[] = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("excludeRules");

    const excludeRules = excludeRulesArray.join(",");
    return excludeRules ? ["--exclude-rules", excludeRules] : [];
  }

  private static ignoreLocalConfig(): string[] {
    const ignoreLocalConfig = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("ignoreLocalConfig");

    return ignoreLocalConfig ? ["--ignore-local-config"] : [];
  }

  private static ignoreParsing(): string[] {
    const ignoreParsing = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("ignoreParsing");

    return ignoreParsing ? ["--ignore", "parsing"] : [];
  }

  private static rules(): string[] {
    const rulesArray: string[] = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("rules");

    const rules = rulesArray.join(",");
    return rules ? ["--rules", rules] : [];
  }

  public static workingDirectory(rootPath: string): string {
    const workingDirectory: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("workingDirectory");
    return workingDirectory ? workingDirectory : rootPath;
  }

  public static formatEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.format")
      .get("enabled");
  }

  public static executeInTerminal(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.experimental.format")
      .get("executeInTerminal");
  }

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("run");
  }

  public static lintFileArguments(): string[] {
    return ["--format", "json"];
  }

  public static formatFileArguments(): string[] {
    return ["--force"];
  }

  public static extraArguments(): string[] {
    let extraArguments = [];

    extraArguments = extraArguments.concat(this.config());
    extraArguments = extraArguments.concat(this.dialect());
    extraArguments = extraArguments.concat(this.excludeRules());
    extraArguments = extraArguments.concat(this.ignoreLocalConfig());
    extraArguments = extraArguments.concat(this.ignoreParsing());
    extraArguments = extraArguments.concat(this.rules());

    return extraArguments;
  }

  /**
   * @returns The variables for a terminal
   */
  static variables(): Variables {
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
