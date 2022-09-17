import * as vscode from "vscode";

import { EXCLUDE_RULE, EXCLUDE_RULE_WORKSPACE, FormattingEditProvider, HoverProvider, LinterProvider, QuickFixProvider, VIEW_DOCUMENTATION } from "./features/linter";

export const activate = (context: vscode.ExtensionContext) => {
  new LinterProvider().activate(context.subscriptions);

  vscode.languages.registerDocumentFormattingEditProvider("sql", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("sql-bigquery", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("jinja-sql", new FormattingEditProvider().activate());

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("sql", new QuickFixProvider(), {
      providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
    }),
    vscode.languages.registerCodeActionsProvider("sql-bigquery", new QuickFixProvider(), {
      providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
    }),
    vscode.languages.registerCodeActionsProvider("jinja-sql", new QuickFixProvider(), {
      providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
    }),
    vscode.languages.registerHoverProvider("sql", new HoverProvider()),
    vscode.languages.registerHoverProvider("sql-bigquery", new HoverProvider()),
    vscode.languages.registerHoverProvider("jinja-sql", new HoverProvider()),
  );

  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE, toggleRule));
  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE_WORKSPACE, toggleRuleWorkspace));
  context.subscriptions.push(vscode.commands.registerCommand(VIEW_DOCUMENTATION, showDocumentation));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };

function toggleRule(rule: string) {
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

function toggleRuleWorkspace(rule: string) {
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

function showDocumentation(rule: string) {
  const path = `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.rules.Rule_${rule}`;

  return vscode.env.openExternal(vscode.Uri.parse(path));
}
