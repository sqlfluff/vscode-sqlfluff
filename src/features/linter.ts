"use strict";
import * as vscode from "vscode";
import { Diagnostic, DiagnosticSeverity, Disposable, Range } from "vscode";

import { normalize } from "./helper/utilities";
import { FormattingProvider } from "./providers/format";
import { Linter, LintingProvider } from "./providers/lint";

export const EXCLUDE_RULE = "sqlfluff.quickfix.command";
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
      const normalizedLine = normalize(line);
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

            const diagnostic = new Diagnostic(
              range,
              violation.description,
              DiagnosticSeverity.Error,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    // for each diagnostic entry that has the matching `code`, create a code action command
    const codeActions = context.diagnostics.map((diagnostic) =>
      this.createCodeAction(diagnostic)
    );

    const documentationActions = context.diagnostics.map((diagnostic) =>
      this.createDocumentationAction(diagnostic)
    );

    return [...codeActions, ...documentationActions];
  }

  private createCodeAction(
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Exclude Rule ${diagnostic.code}`,
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: EXCLUDE_RULE,
      title: `Exclude Rule ${diagnostic.code}`,
      tooltip: `This will exclude the rule ${diagnostic.code} in settings.json`,
      arguments: [diagnostic.code]
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }

  private createDocumentationAction(
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `View Documentation for Rule ${diagnostic.code}`,
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: VIEW_DOCUMENTATION,
      title: `View Documentation for Rule ${diagnostic.code}`,
      tooltip: `This will open the SQLFluff documentation for rule ${diagnostic.code}`,
      arguments: [diagnostic.code]
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = false;

    return action;
  }
}
