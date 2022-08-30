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
    const documentUri = Helper.getDocumentUri("/test_sql/bad.sql");
    await Helper.activate(documentUri);

    const actualDiagnostics = vscode.languages.getDiagnostics(documentUri);

    assert.strictEqual(actualDiagnostics.length, 2);
    [
      { range: Helper.toRange(1, 10, 1, 10), message: "Keywords must be consistently upper case.", code: "L010" },
      { range: Helper.toRange(2, 1, 2, 1), message: "Files must end with a single trailing newline.", code: "L009" },
    ].forEach((expectedDiagnostic, i) => {
      assertDiagnosticIsEqual(actualDiagnostics[i], expectedDiagnostic);
    });
  }).timeout(TIMEOUT);

  test("Bad SQL has zero diagnostics after document format", async () => {
    const documentUri = Helper.getDocumentUri("/test_sql/format.sql");
    // const document = await Helper.activate(documentUri);
    // const preFormatDiagnostics = vscode.languages.getDiagnostics(documentUri);
    // assert.strictEqual(preFormatDiagnostics.length, 1, "Pre-format diagnostics not expected length");

    await Helper.format(documentUri);
    // await Helper.activate(documentUri);

    const postFormatDiagnostics = vscode.languages.getDiagnostics(documentUri);
    assert.strictEqual(postFormatDiagnostics.length, 0, "Post-format diagnostics not expected length");

  }).timeout(TIMEOUT);

  const assertDiagnosticIsEqual = (actual: vscode.Diagnostic, expected: { range: any; message: any; code: any; }) => {
    assert.deepStrictEqual(actual.range, expected.range);
    assert.strictEqual(actual.severity, 0);
    assert.strictEqual(actual.message, expected.message);
    assert.strictEqual(actual.code, expected.code);
    assert.strictEqual(actual.source, "sqlfluff");
  };
});
