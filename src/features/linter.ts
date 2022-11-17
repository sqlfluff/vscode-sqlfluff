/* eslint-disable @typescript-eslint/no-unused-vars */
"use strict";
import * as vscode from "vscode";
import { Diagnostic, Disposable } from "vscode";

import Configuration from "./helper/configuration";
import FilePath from "./helper/types/filePath";
import Linter from "./helper/types/linter";
import Violation from "./helper/types/violation";
import Utilities from "./helper/utilities";
import LintingProvider from "./providers/linter/lint";

export default class LinterProvider implements Linter {
  public languageId = ["sql", "jinja-sql", "sql-bigquery"];

  public activate(subscriptions: Disposable[]): LintingProvider {
    const provider = new LintingProvider(this);
    provider.activate(subscriptions);
    return provider;
  }

  public process(lines: string[]): Diagnostic[] {
    const editor = vscode.window.activeTextEditor;
    const diagnostics: Diagnostic[] = [];

    if (!editor) return diagnostics;

    lines.forEach((line) => {
      let filePaths: Array<FilePath> = [];
      const normalizedLine = Utilities.normalizePath(line, true);
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
            const editorPath = Utilities.normalizePath(editor.document.fileName);
            const line = violation.line_no - 1 > 0 ? violation.line_no - 1 : 0;
            const character = violation.line_pos - 1 > 0 ? violation.line_pos - 1 : 0;
            const violationPosition = new vscode.Position(line, character);
            let range = new vscode.Range(line, character, line, character);

            if (editorPath.includes(path) || path === "stdin") {
              range = editor.document.getWordRangeAtPosition(violationPosition) || range;
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
