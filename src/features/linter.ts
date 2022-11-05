/* eslint-disable @typescript-eslint/no-unused-vars */
"use strict";
import * as vscode from "vscode";
import { Diagnostic, Disposable } from "vscode";

import { Configuration } from "./helper/configuration";
import { normalize } from "./helper/utilities";
import { Linter, LintingProvider } from "./providers/lint";

export const EXCLUDE_RULE = "sqlfluff.quickfix.excludeRule";
export const EXCLUDE_RULE_WORKSPACE = "sqlfluff.quickfix.excludeRuleWorkspace";
export const VIEW_DOCUMENTATION = "sqlfluff.quickfix.viewDocumentation";

interface FilePath {
  filepath: string;
  violations: Array<Violation>;
}

interface Violation {
  line_no: number,
  line_pos: number,
  description: string,
  code: string,
}

export class LinterProvider implements Linter {
  public languageId = ["sql", "jinja-sql", "sql-bigquery"];

  public activate(subscriptions: Disposable[]): LintingProvider {
    const provider = new LintingProvider(this);
    provider.activate(subscriptions);
    return provider;
  }

  public process(lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    lines.forEach((line) => {
      let filePaths: Array<FilePath>;
      const normalizedLine = normalize(line, true);
      try {
        filePaths = JSON.parse(normalizedLine);
      } catch (e) {
        // JSON.parse may fail if sqlfluff compilation prints non-JSON formatted messages
        console.warn(`Failed to parse the following JSON response: ${normalizedLine}`);
        console.warn(e);
      }

      if (filePaths) {
        filePaths.forEach((filePath: FilePath) => {
          filePath.violations.forEach((violation: Violation) => {
            const path = filePath.filepath;
            const editorPath = normalize(vscode.window.activeTextEditor.document.uri.fsPath);
            const line = violation.line_no - 1 > 0 ? violation.line_no - 1 : 0;
            const character = violation.line_pos - 1 > 0 ? violation.line_pos - 1 : 0;
            const violationPosition = new vscode.Position(line, character);
            let range = new vscode.Range(line, character, line, character);

            if (editorPath.includes(path) || path === "stdin") {
              range = vscode.window.activeTextEditor.document.getWordRangeAtPosition(violationPosition) || range;
            }

            const diagnosticSeverity = Configuration.diagnosticSeverityByRule(violation.code);

            const diagnostic = new Diagnostic(
              range,
              violation.description,
              diagnosticSeverity,
            );
            diagnostic.code = violation.code;
            diagnostic.source = "sqlfluff";
            diagnostics.push(diagnostic);
          });
        });
      }
    });

    return diagnostics;
  }
}

export class QuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKind = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    // for each diagnostic entry that has the matching `code`, create a code action command
    const excludeRulesGlobal = context.diagnostics.map((diagnostic) =>
      this.createExcludeRulesCodeAction(diagnostic, true)
    );

    const excludeRulesWorkspace = context.diagnostics.map((diagnostic) =>
      this.createExcludeRulesCodeAction(diagnostic, false)
    );

    const noqaSingleRules = context.diagnostics.map((diagnostic) =>
      this.createNoqaCodeFix(document, diagnostic, false)
    );

    const noqaAllRules = context.diagnostics.map((diagnostic) =>
      this.createNoqaCodeFix(document, diagnostic, true)
    );

    return [...excludeRulesGlobal, ...excludeRulesWorkspace, ...noqaSingleRules, ...noqaAllRules];
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
    action.isPreferred = true;

    return action;
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
    fix.edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(diagnostic.range.start.line);
    const endPosition = new vscode.Position(line.range.end.line, line.range.end.character > 0 ? line.range.end.character : 0);
    const noqaREGEX = /\s*-- noqa(?::(\s?\w\d{3},?)*)?.*/;

    const noqa = noqaREGEX.exec(line.text)
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
            fix.edit.insert(document.uri, endPosition, `: ${diagnostic.code}`)
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
}

export class HoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    let hover: vscode.Hover = undefined;
    diagnostics.forEach(diagnostic => {
      if (hover) return;
      if (position.isAfterOrEqual(diagnostic.range.start) && position.isBeforeOrEqual(diagnostic.range.end)) {
        hover = this.createHover(diagnostic);
      }
    });

    return hover;
  }

  private createHover(
    diagnostic: vscode.Diagnostic
  ): vscode.Hover {
    const path = `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.rules.Rule_${diagnostic.code}`;
    const markdownString = new vscode.MarkdownString();

    markdownString.appendMarkdown(`[View Documentation](${path}) for Rule ${diagnostic.code}.\n`);

    return new vscode.Hover(markdownString);
  }
}
