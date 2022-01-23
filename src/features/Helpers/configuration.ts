import * as vscode from 'vscode';

export class Configuration {
  public static executablePath(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff")
      .get("executablePath");
  }

  public static formattingEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("sqlfluff.format")
      .get("enabled");
  }

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("run");
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

  private static config(): string[] {
    let config: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("config");

    return config ? ['--config', config] : [];
  }

  private static dialect(): string[] {
    let dialect: string = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("config");

    return dialect ? ['--dialect', dialect] : [];
  }

  private static excludeRules(): string[] {
    let excludeRulesArray: string[] = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("excludeRules");

    let excludeRules = excludeRulesArray.join(',');
    return excludeRules ? ['--exclude-rules', excludeRules] : [];
  }

  private static ignoreLocalConfig(): string[] {
    let ignoreLocalConfig = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("ignoreLocalConfig");

    return ignoreLocalConfig ? ['--ignore-local-config'] : [];
  }

  private static ignoreParsing(): string[] {
    let ignoreParsing = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("ignoreParsing");

    return ignoreParsing ? ['--ignore', 'parsing'] : [];
  }

  private static rules(): string[] {
    let rulesArray: string[] = vscode.workspace
      .getConfiguration("sqlfluff")
      .get("rules");

    let rules = rulesArray.join(',');
    return rules ? ['--rules', rules] : [];
  }
}
