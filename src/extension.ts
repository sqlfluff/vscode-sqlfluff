import * as vscode from "vscode";

import { EXCLUDE_RULE, FormattingEditProvider, LinterProvider, QuickFixProvider } from "./features/linter";

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
    })
  );

  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE, toggleRule));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };

function toggleRule(rule: string) {
  const configuration = vscode.workspace.getConfiguration("sqlfluff");
  const excludeRulesArray: string[] = configuration.get("excludeRules");

  if (!excludeRulesArray.includes(rule)) {
    excludeRulesArray.push(rule);
  }

  excludeRulesArray.sort((x, y) => {
    return parseInt(x.substring(1)) - parseInt(y.substring(1));
  });

  return configuration.update("excludeRules", excludeRulesArray, vscode.ConfigurationTarget.Global);
}
