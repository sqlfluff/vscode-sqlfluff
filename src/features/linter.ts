/* eslint-disable @typescript-eslint/no-unused-vars */
"use strict";
import * as vscode from "vscode";
import { Diagnostic, Disposable } from "vscode";

import Configuration from "./helper/configuration";
import Utilities from "./helper/utilities";
import LintingProvider from "./providers/linter/lint";
import FileDiagnostic from "./providers/linter/types/fileDiagnostic";
import FilePath from "./providers/linter/types/filePath";
import Linter from "./providers/linter/types/linter";
import Violation from "./providers/linter/types/violation";

export default class LinterProvider implements Linter {
  public languageId = Configuration.linterLanguages();

  public activate(subscriptions: Disposable[]): LintingProvider {
    const provider = new LintingProvider(this);
    provider.activate(subscriptions);
    return provider;
  }

  public process(lines: string[], documentPath: string): FileDiagnostic[] {
    const editor = vscode.window.activeTextEditor;
    const diagnostics: FileDiagnostic[] = [];

    lines.forEach((line) => {
      let filePaths: FilePath[] = [];
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
          const fileDiagnostic: FileDiagnostic = {
            filePath: Utilities.normalizePath(filePath.filepath),
            diagnostics: [],
          };

          filePath.violations.forEach((violation: Violation) => {
            const path = filePath.filepath;
            const start_line_no = Math.max(0, (violation.line_no ?? violation.start_line_no ?? 1) - 1);
            const start_line_pos = Math.max(0, (violation.line_pos ?? violation.start_line_pos ?? 1) - 1);
            const end_line_no = Math.max(0, (violation.line_no ?? violation.end_line_no ?? 1) - 1);
            const end_line_pos = Math.max(0, (violation.line_pos ?? violation.end_line_pos ?? 1) - 1);
            const violationPosition = new vscode.Position(start_line_no, start_line_pos);
            let range = new vscode.Range(start_line_no, start_line_pos, end_line_no, end_line_pos);

            if (editor) {
              const editorPath = Utilities.normalizePath(editor.document.fileName);
              if (editorPath.includes(documentPath) || path === "stdin") {
                range = editor.document.getWordRangeAtPosition(violationPosition) || range;
              }
            }

            const diagnosticSeverity = Configuration.diagnosticSeverityByRule(violation.code);

            const diagnostic = new Diagnostic(
              range,
              violation.description,
              diagnosticSeverity,
            );
            diagnostic.code = violation.code;
            diagnostic.source = "sqlfluff";
            fileDiagnostic.diagnostics.push(diagnostic);
          });

          diagnostics.push(fileDiagnostic);
        });
      }
    });

    return diagnostics;
  }
}
