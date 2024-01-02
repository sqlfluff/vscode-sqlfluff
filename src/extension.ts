import * as vscode from "vscode";

import { EXCLUDE_RULE, EXCLUDE_RULE_WORKSPACE, ExcludeRules } from "./features/commands/excludeRules";
import { Documentation, VIEW_DOCUMENTATION } from "./features/commands/showDocumentation";
import { FormattingEditProvider, RangeFormattingEditProvider } from "./features/formatter";
import Configuration from "./features/helper/configuration";
import Utilities from "./features/helper/utilities";
import LinterProvider from "./features/linter";
import Debug from "./features/providers/debug";
import { FormatSelectionProvider } from "./features/providers/formatter/rangeFormat";
import HoverProvider from "./features/providers/linter/actions/hover";
import QuickFixProvider from "./features/providers/linter/actions/quickFix";

export const activate = (context: vscode.ExtensionContext) => {
  Configuration.initialize();

  const linterProvider = new LinterProvider();
  const lintingProvider = linterProvider.activate(context.subscriptions);

  const formatSelectors = Configuration.formatLanguages();
  const linterSelectors = Configuration.linterLanguages();

  formatSelectors.forEach(selector => {
    // Register the "Format Document" command
    const formattingProvider = new FormattingEditProvider().activate();
    vscode.languages.registerDocumentFormattingEditProvider(
      selector,
      formattingProvider,
    );

    // Register the "Format Selection" command
    if (!Configuration.executeInTerminal() && !Configuration.dbtInterfaceEnabled()) {
      const rangeFormattingProvider = new RangeFormattingEditProvider().activate();
      vscode.languages.registerDocumentRangeFormattingEditProvider(
        selector,
        rangeFormattingProvider,
      );
    }
  });

  linterSelectors.forEach(selector => {
    // Register the code actions
    if (!Configuration.dbtInterfaceEnabled()) {
      const codeActionProvider = vscode.languages.registerCodeActionsProvider(selector, new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind,
      });
      context.subscriptions.push(codeActionProvider);
    }

    // Register the hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(selector, new HoverProvider());
    context.subscriptions.push(hoverProvider);
  });

  const contextMenuItems = Configuration.formatLanguagesContextMenuItems();
  vscode.commands.executeCommand("setContext", "sqlfluff.formatLanguages", formatSelectors)
  vscode.commands.executeCommand("setContext", "sqlfluff.contextLanguages", contextMenuItems)

  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE, ExcludeRules.toggleRule));
  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE_WORKSPACE, ExcludeRules.toggleRuleWorkspace));
  context.subscriptions.push(vscode.commands.registerCommand(VIEW_DOCUMENTATION, Documentation.showDocumentation));

  const lintCommand = "sqlfluff.lint";
  const lintCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
      const document = vscode.window.activeTextEditor.document;
      if (document) {
        lintingProvider.doLint(document, true);
      }
    }
  };
  context.subscriptions.push(vscode.commands.registerCommand(lintCommand, lintCommandHandler));

  const lintProjectCommand = "sqlfluff.lintProject";
  const lintProjectCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
      const document = vscode.window.activeTextEditor.document;
      if (document) {
        lintingProvider.lintProject(true);
      }
    }
  };
  context.subscriptions.push(vscode.commands.registerCommand(lintProjectCommand, lintProjectCommandHandler));

  const fixCommand = "sqlfluff.fix";
  const fixCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
      const document = vscode.window.activeTextEditor.document;
      if (document) {
        vscode.commands.executeCommand("editor.action.formatDocument");
      }
    }
  };
  context.subscriptions.push(vscode.commands.registerCommand(fixCommand, fixCommandHandler));

  if (Configuration.dbtInterfaceEnabled()) {
      // When dbt-core-interface is enabled, adds a "Format document with
      // sqlfluff" button to the lower right corner of the VS Code window. Use
      // of the word "format" is deliberate, as the button hits the
      // dbt-core-interface "/format" endpoint, equivalent to "sqlfluff format".
      const customStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
      customStatusBarItem.text = "$(pencil)";
      customStatusBarItem.tooltip = "Format document with sqlfluff";
      customStatusBarItem.command = fixCommand;
      customStatusBarItem.show();
  }
  else {
    // When dbt-core-interface is not enabled, adds a "format selection" action.
    const formatSelection = "sqlfluff.format.selection";
    const formatSelectionHandler = async () => {
      if (vscode.window.activeTextEditor) {
        // Check if available language
        const document = vscode.window.activeTextEditor.document;
        const range = new vscode.Range(
          vscode.window.activeTextEditor.selection.start,
          vscode.window.activeTextEditor.selection.end,
        )

        const textEdits = await FormatSelectionProvider.provideTextEdits(
          document,
          range,
        );

        textEdits.forEach((textEdit) => {
          const workspaceEdit = new vscode.WorkspaceEdit();
          workspaceEdit.replace(document.uri, textEdit.range, textEdit.newText);

          vscode.workspace.applyEdit(workspaceEdit);
        })
      }
    };
    context.subscriptions.push(vscode.commands.registerCommand(formatSelection, formatSelectionHandler));
  }

  const debugCommand = "sqlfluff.debug";
  const debugCommandHandler = async () => {
    Debug.debug();
  };
  context.subscriptions.push(vscode.commands.registerCommand(debugCommand, debugCommandHandler));

  const showOutputChannelCommand = "sqlfluff.showOutputChannel";
  const showOutputChannelCommandHandler = async () => {
    Utilities.outputChannel.show();
  };
  context.subscriptions.push(vscode.commands.registerCommand(showOutputChannelCommand, showOutputChannelCommandHandler));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };
