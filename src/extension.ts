import * as vscode from "vscode";

import { EXCLUDE_RULE, SQLFLuffDocumentFormattingEditProvider, SQLFluffLinterProvider, SQLFluffQuickFix } from "./features/sqlFluffLinter";

export const activate = (context: vscode.ExtensionContext) => {
  new SQLFluffLinterProvider().activate(context.subscriptions);

  vscode.languages.registerDocumentFormattingEditProvider("sql", new SQLFLuffDocumentFormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("sql-bigquery", new SQLFLuffDocumentFormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("jinja-sql", new SQLFLuffDocumentFormattingEditProvider().activate());

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("sql", new SQLFluffQuickFix(), {
      providedCodeActionKinds: SQLFluffQuickFix.providedCodeActionKind
    }),
    vscode.languages.registerCodeActionsProvider("sql-bigquery", new SQLFluffQuickFix(), {
      providedCodeActionKinds: SQLFluffQuickFix.providedCodeActionKind
    }),
    vscode.languages.registerCodeActionsProvider("jinja-sql", new SQLFluffQuickFix(), {
      providedCodeActionKinds: SQLFluffQuickFix.providedCodeActionKind
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

