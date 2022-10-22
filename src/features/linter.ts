/* eslint-disable @typescript-eslint/no-unused-vars */
"use strict";
import * as vscode from "vscode";
import { Diagnostic, DiagnosticSeverity, Disposable, Range } from "vscode";

import { Configuration } from "./helper/configuration";
import { normalize } from "./helper/utilities";
import { FormattingProvider } from "./providers/format";
import { Linter, LintingProvider } from "./providers/lint";

export const EXCLUDE_RULE = "sqlfluff.quickfix.excludeRule";
export const EXCLUDE_RULE_WORKSPACE = "sqlfluff.quickfix.excludeRuleWorkspace";
export const VIEW_DOCUMENTATION = "sqlfluff.quickfix.viewDocumentation";

export class LinterProvider implements Linter {
  public languageId = ["sql", "jinja-sql", "sql-bigquery"];

  public activate(subscriptions: Disposable[]) {
    const provider = new LintingProvider(this);
    provider.activate(subscriptions);
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
            const violationPosition = new vscode.Position(violation.line_no - 1, violation.line_pos - 1);
            let range = new Range(
              violation.line_no - 1,
              violation.line_pos - 1,
              violation.line_no - 1,
              violation.line_pos - 1
            );

            if (editorPath.includes(path)) {
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

interface FilePath {
  filepath: string;
  violations: Array<Violation>;
}

export class FormattingEditProvider {
  activate(): vscode.DocumentFormattingEditProvider {
    return new FormattingProvider();
  }
}

interface Violation {
  line_no: number,
  line_pos: number,
  description: string,
  code: string,
}

export class QuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKind = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    // for each diagnostic entry that has the matching `code`, create a code action command
    const excludeRulesGlobal = context.diagnostics.map((diagnostic) =>
      this.createCodeAction(diagnostic, true)
    );

    const excludeRulesWorkspace = context.diagnostics.map((diagnostic) =>
      this.createCodeAction(diagnostic, false)
    );

    return [...excludeRulesGlobal, ...excludeRulesWorkspace];
  }

  private createCodeAction(
    diagnostic: vscode.Diagnostic,
    global: boolean
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Exclude Rule ${diagnostic.code} ${global ? "from Global Settings" : "from Workspace Settings"}`,
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: global ? EXCLUDE_RULE : EXCLUDE_RULE_WORKSPACE,
      title: `Exclude Rule ${diagnostic.code} ${global ? "from Global Settings" : "from Workspace Settings"}`,
      tooltip: `This will exclude the rule ${diagnostic.code} in the ${global ? "Global" : "Workspace"} Settings`,
      arguments: [diagnostic.code]
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
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
