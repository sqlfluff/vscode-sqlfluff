import * as vscode from "vscode";

import { EXCLUDE_RULE,EXCLUDE_RULE_WORKSPACE,ExcludeRules } from "./features/commands/excludeRules";
import { Documentation, VIEW_DOCUMENTATION } from "./features/commands/showDocumentation";
import { FormattingEditProvider } from "./features/formatter";
import Configuration from "./features/helper/configuration";
import LinterProvider from "./features/linter";
import HoverProvider from "./features/providers/linter/actions/hover";
import QuickFixProvider from "./features/providers/linter/actions/quickFix";

export const activate = (context: vscode.ExtensionContext) => {
  Configuration.initialize();

  const linterProvider = new LinterProvider();
  const lintingProvider = linterProvider.activate(context.subscriptions);

  vscode.languages.registerDocumentFormattingEditProvider("sql", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("sql-bigquery", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("jinja-sql", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("postgres", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("snowflake-sql", new FormattingEditProvider().activate());

  if (!Configuration.osmosisEnabled()) {
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
      vscode.languages.registerCodeActionsProvider("postgres", new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
      }),
      vscode.languages.registerCodeActionsProvider("snowflake-sql", new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
      })
    );
  }

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("sql", new HoverProvider()),
    vscode.languages.registerHoverProvider("sql-bigquery", new HoverProvider()),
    vscode.languages.registerHoverProvider("jinja-sql", new HoverProvider()),
    vscode.languages.registerHoverProvider("postgres", new HoverProvider()),
    vscode.languages.registerHoverProvider("snowflake-sql", new HoverProvider()),
  );

  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE, ExcludeRules.toggleRule));
  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE_WORKSPACE, ExcludeRules.toggleRuleWorkspace));
  context.subscriptions.push(vscode.commands.registerCommand(VIEW_DOCUMENTATION, Documentation.showDocumentation));

  const lintCommand = "sqlfluff.lint";
  const lintCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        lintingProvider.doLint(currentDocument, true);
      }
    }
  }

  const lintProjectCommand = "sqlfluff.lintProject";
  const lintProjectCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        lintingProvider.lintProject(true);
      }
    }
  }

  const fixCommand = "sqlfluff.fix";
  const fixCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        vscode.commands.executeCommand("editor.action.formatDocument")
      }
    }
  }

  context.subscriptions.push(vscode.commands.registerCommand(lintCommand, lintCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(lintProjectCommand, lintProjectCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(fixCommand, fixCommandHandler));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };
