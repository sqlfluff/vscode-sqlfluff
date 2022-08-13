import * as vscode from "vscode";

export class Configuration {
  public static executablePath(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get("executablePath");
  }

  private static config(): string[] {
    const config: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("config");

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

  public static workingDirectory(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get("workingDirectory");
  }

  public static formatEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.format")
      .get("enabled");
  }

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("run");
  }

  public static lintBufferArguments(): string[] {
    return ["--format", "json"];
  }

  public static lintFileArguments(): string[] {
    return ["--format", "json"];
  }

  public static formatBufferArguments(): string[] {
    return ["--force"];
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
}
