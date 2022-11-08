/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";

import { EXCLUDE_RULE, EXCLUDE_RULE_WORKSPACE } from "../../../commands/excludeRules";
import Configuration from "../../../helper/configuration";

export default class QuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKind = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    let noqaSingleRules = [];
    let noqaAllRules = [];
    let excludeRulesGlobal = [];
    let excludeRulesWorkspace = [];

    if (Configuration.noqaEnabled()) {
      noqaSingleRules = context.diagnostics.map((diagnostic) => {
        if (Configuration.noqaDisabledRules().includes(diagnostic.code.toString())) return;
        return this.createNoqaCodeFix(document, diagnostic, false);
      }
      );

      noqaAllRules = context.diagnostics.map((diagnostic) => {
        if (Configuration.noqaDisabledRules().includes(diagnostic.code.toString())) return;
        return this.createNoqaCodeFix(document, diagnostic, true);
      }
      );
    }

    if (Configuration.excludeRulesWorkspace()) {
      excludeRulesWorkspace = context.diagnostics.map((diagnostic) =>
        this.createExcludeRulesCodeAction(diagnostic, false)
      );
    }

    if (Configuration.excludeRulesGlobal()) {
      excludeRulesGlobal = context.diagnostics.map((diagnostic) =>
        this.createExcludeRulesCodeAction(diagnostic, true)
      );
    }

    return [...noqaSingleRules, ...noqaAllRules, ...excludeRulesWorkspace, ...excludeRulesGlobal];
  }

  private createNoqaCodeFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    allRules: boolean
  ): vscode.CodeAction {
    const title = allRules ? "Ignore all rules for this line" : `Ignore rule ${diagnostic.code} for this line`;
    const fix = new vscode.CodeAction(
      title,
      vscode.CodeActionKind.QuickFix
    );
    fix.diagnostics = [diagnostic];
    fix.edit = new vscode.WorkspaceEdit();

    const line = document.lineAt(diagnostic.range.start.line);
    const endPosition = new vscode.Position(line.range.end.line, line.range.end.character > 0 ? line.range.end.character : 0);
    const noqaREGEX = /\s*-- noqa(?::(\s?\w\d{3},?)*)?.*/;
    const noqa = noqaREGEX.exec(line.text);
    if (noqa) {
      const startNoqa = new vscode.Position(line.lineNumber, line.text.length - noqa[0].length);
      const rangeNoqa = new vscode.Range(startNoqa, endPosition);
      if (allRules) {
        fix.edit.replace(document.uri, rangeNoqa, " -- noqa");
      } else {
        if (noqa.length > 1) {
          if (noqa[1]) {
            if (noqa[1].endsWith(",")) {
              fix.edit.insert(document.uri, endPosition, ` ${diagnostic.code}`);
            } else {
              fix.edit.insert(document.uri, endPosition, `, ${diagnostic.code}`);
            }
          } else {
            fix.edit.insert(document.uri, endPosition, `: ${diagnostic.code}`);
          }
        }
      }
    } else {
      if (allRules) {
        fix.edit.insert(document.uri, endPosition, " -- noqa");
      } else {
        fix.edit.insert(document.uri, endPosition, ` -- noqa: ${diagnostic.code}`);
      }
    }

    return fix;
  }

  private createExcludeRulesCodeAction(
    diagnostic: vscode.Diagnostic,
    global: boolean
  ): vscode.CodeAction {
    const title = `Exclude Rule ${diagnostic.code} ${global ? "from Global Settings" : "from Workspace Settings"}`;
    const action = new vscode.CodeAction(
      title,
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: global ? EXCLUDE_RULE : EXCLUDE_RULE_WORKSPACE,
      title: title,
      tooltip: `This will exclude the rule ${diagnostic.code} in the ${global ? "Global" : "Workspace"} Settings`,
      arguments: [diagnostic.code]
    };
    action.diagnostics = [diagnostic];

    return action;
  }
}
