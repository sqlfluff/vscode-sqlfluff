import * as vscode from "vscode";

import { EXCLUDE_RULE, EXCLUDE_RULE_WORKSPACE, ExcludeRules } from "./features/commands/excludeRules";
import { Documentation, VIEW_DOCUMENTATION } from "./features/commands/showDocumentation";
import { FormattingEditProvider, RangeFormattingEditProvider } from "./features/formatter";
import Configuration from "./features/helper/configuration";
import Utilities from "./features/helper/utilities";
import LinterProvider from "./features/linter";
import Debug from "./features/providers/debug";
import HoverProvider from "./features/providers/linter/actions/hover";
import QuickFixProvider from "./features/providers/linter/actions/quickFix";

export const activate = (context: vscode.ExtensionContext) => {
  Configuration.initialize();

  const linterProvider = new LinterProvider();
  const lintingProvider = linterProvider.activate(context.subscriptions);

  const selectors = ["sql", "sql-bigquery", "jinja-sql", "postgres", "snowflake-sql"];

  selectors.forEach(selector => {
    // Register the "Format Document" command
    const formattingProvider = new FormattingEditProvider().activate();
    vscode.languages.registerDocumentFormattingEditProvider(
      selector,
      formattingProvider,
    );

    // Register the "Format Selection" command
    if (!Configuration.executeInTerminal()) {
      const rangeFormattingProvider = new RangeFormattingEditProvider().activate();
      vscode.languages.registerDocumentRangeFormattingEditProvider(
        selector,
        rangeFormattingProvider,
      );
    }

    // Register the code actions
    if (!Configuration.osmosisEnabled()) {
      const codeActionProvider = vscode.languages.registerCodeActionsProvider(selector, new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind,
      });
      context.subscriptions.push(codeActionProvider);
    }

    const hoverProvider = vscode.languages.registerHoverProvider(selector, new HoverProvider());
    context.subscriptions.push(hoverProvider);
  });

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
  };

  const lintProjectCommand = "sqlfluff.lintProject";
  const lintProjectCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
      const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        lintingProvider.lintProject(true);
      }
    }
  };

  const fixCommand = "sqlfluff.fix";
  const fixCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
      const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        vscode.commands.executeCommand("editor.action.formatDocument");
      }
    }
  };

  const debugCommand = "sqlfluff.debug";
  const debugCommandHandler = async () => {
    Debug.debug();
  };

  const showOutputChannelCommand = "sqlfluff.showOutputChannel";
  const showOutputChannelCommandHandler = async () => {
    Utilities.outputChannel.show();
  };

  context.subscriptions.push(vscode.commands.registerCommand(lintCommand, lintCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(lintProjectCommand, lintProjectCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(fixCommand, fixCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(debugCommand, debugCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(showOutputChannelCommand, showOutputChannelCommandHandler));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };
