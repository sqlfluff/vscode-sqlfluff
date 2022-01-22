import * as vscode from 'vscode';

export class Configuration {
  public static executablePath(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("executablePath");
  }

  public static runTrigger(): string {
    return vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("run");
  }

  public static extraArguments(): string[] {
    let extraArguments = [];

    extraArguments = extraArguments.concat(this.config());
    extraArguments = extraArguments.concat(this.ignoreParsing());

    return [];
  }

  private static config(): string[] {
    let config: string = vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("config");

    return config ? [config] : [];
  }

  private static ignoreParsing(): string[] {
    let ignoreParsing = vscode.workspace
      .getConfiguration("sqlfluff.linter")
      .get("ignoreParsing");

    return ignoreParsing ? ['--ignore parsing'] : [];
  }
}
