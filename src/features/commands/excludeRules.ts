import * as vscode from "vscode";

export const EXCLUDE_RULE = "sqlfluff.quickfix.excludeRule";
export const EXCLUDE_RULE_WORKSPACE = "sqlfluff.quickfix.excludeRuleWorkspace";

export class ExcludeRules {
  static toggleRule(rule: string) {
    const configuration = vscode.workspace.getConfiguration("sqlfluff");
    const excludeRules: any = configuration.inspect("excludeRules");
    const excludeRulesArray = excludeRules.globalValue ?? [];

    if (!excludeRulesArray.includes(rule)) {
      excludeRulesArray.push(rule);
    }

    excludeRulesArray.sort((x: string, y: string) => {
      return parseInt(x.substring(1)) - parseInt(y.substring(1));
    });

    return configuration.update("excludeRules", excludeRulesArray, vscode.ConfigurationTarget.Global);
  }

  static toggleRuleWorkspace(rule: string) {
    const configuration = vscode.workspace.getConfiguration("sqlfluff");
    const excludeRules: any = configuration.inspect("excludeRules");
    const excludeRulesArray = excludeRules.workspaceValue ?? [];

    if (!excludeRulesArray.includes(rule)) {
      excludeRulesArray.push(rule);
    }

    excludeRulesArray.sort((x: string, y: string) => {
      return parseInt(x.substring(1)) - parseInt(y.substring(1));
    });

    return configuration.update("excludeRules", excludeRulesArray, vscode.ConfigurationTarget.Workspace);
  }
}
