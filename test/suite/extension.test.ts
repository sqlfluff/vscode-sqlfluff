import * as assert from "assert";
import * as vscode from "vscode";

import * as Helper from "./helper";

const TIMEOUT = 1000000;

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Good SQL should have zero diagnostics", async () => {
    const documentUri = Helper.getDocumentUri("/test_sql/good.sql");
    await Helper.activate(documentUri);

    const actualDiagnostics = vscode.languages.getDiagnostics(documentUri);

    assert.strictEqual(actualDiagnostics.length, 0);
  }).timeout(TIMEOUT);

  test("Bad SQL should have the correct diagnostics", async () => {
    const documentUri = Helper.getDocumentUri("/test_sql/diagnostics.sql");
    await Helper.activate(documentUri);

    const actualDiagnostics = vscode.languages.getDiagnostics(documentUri);

    assert.strictEqual(actualDiagnostics.length, 2);
    [
      {
        range: Helper.toRange(1, 0, 1, 4),
        message: "Keywords must be upper case.",
        code: "CP01: capitalisation.keywords",
      },
      {
        range: Helper.toRange(1, 5, 1, 12),
        message: "Files must end with a single trailing newline.",
        code: "LT12: layout.end_of_file",
      },
    ].forEach((expectedDiagnostic, i) => {
      assertDiagnosticIsEqual(actualDiagnostics[i], expectedDiagnostic);
    });
  }).timeout(TIMEOUT);

  test("Bad SQL has zero diagnostics after document format", async () => {
    const documentUri = Helper.getDocumentUri("/test_sql/format.sql");
    await Helper.activate(documentUri);
    const preFormatDiagnostics = vscode.languages.getDiagnostics(documentUri);
    assert.strictEqual(preFormatDiagnostics.length, 1, "Pre-format diagnostics not expected length");
    await Helper.format(documentUri);
    const postFormatDiagnostics = vscode.languages.getDiagnostics(documentUri);
    assert.strictEqual(postFormatDiagnostics.length, 0, "Post-format diagnostics not expected length");
  }).timeout(TIMEOUT);

  test("Warning SQL should have the correct diagnostics", async () => {
    const documentUri = Helper.getDocumentUri("/test_sql/warning.sql");
    await Helper.activate(documentUri);

    const actualDiagnostics = vscode.languages.getDiagnostics(documentUri);

    assert.strictEqual(actualDiagnostics.length, 1, JSON.stringify(actualDiagnostics, null, 4));
    [
      {
        range: Helper.toRange(0, 0, 0, 6),
        message: "Query produces an unknown number of result columns.",
        code: "AM04: ambiguous.column_count",
        severity: vscode.DiagnosticSeverity.Warning,
      },
    ].forEach((expectedDiagnostic, i) => {
      assertDiagnosticIsEqual(actualDiagnostics[i], expectedDiagnostic);
    });
  }).timeout(TIMEOUT);

  const assertDiagnosticIsEqual = (
    actual: vscode.Diagnostic,
    expected: { range: any; message: any; code: any; severity?: vscode.DiagnosticSeverity },
  ) => {
    assert.deepStrictEqual(actual.range, expected.range);
    assert.strictEqual(actual.severity, expected.severity == undefined ? 0 : expected.severity);
    assert.strictEqual(actual.message, expected.message);
    assert.strictEqual(actual.code, expected.code);
    assert.strictEqual(actual.source, "sqlfluff");
  };
});
