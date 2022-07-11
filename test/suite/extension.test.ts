import * as assert from "assert";
import * as vscode from "vscode";

import { activate, format, getDocUri, toRange } from "./helper";

const TIMEOUT = 4000;
suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Good SQL should have zero diagnostics", async () => {

    const docUri = getDocUri("/test_sql/good.sql");
    await activate(docUri);


    const actualDiagnostics = vscode.languages.getDiagnostics(docUri);


    assert.strictEqual(actualDiagnostics.length, 0);

  }).timeout(TIMEOUT);

  test("Bad SQL should have the correct diagnostics", async () => {

    const docUri = getDocUri("/test_sql/bad.sql");
    await activate(docUri);


    const actualDiagnostics = vscode.languages.getDiagnostics(docUri);


    assert.strictEqual(actualDiagnostics.length, 3);
    [
      { range: toRange(0, 1, 0, 1), message: "Query produces an unknown number of result columns.", code: "L044" },
      { range: toRange(0, 10, 0, 10), message: "Inconsistent capitalisation of keywords.", code: "L010" },
      { range: toRange(0, 22, 0, 22), message: "Files must end with a trailing newline.", code: "L009" },
    ].forEach((expectedDiagnostic, i) => {
      assertDiagnosticIsEqual(actualDiagnostics[i], expectedDiagnostic);
    });

  }).timeout(TIMEOUT);

  test("Bad SQL has zero diagnostics after document format", async () => {

    const docUri = getDocUri("/test_sql/format.sql");
    const document = await activate(docUri);
    const preFormatDiagnostics = vscode.languages.getDiagnostics(docUri);
    assert.strictEqual(preFormatDiagnostics.length, 1, "Pre-format diagnostics not expected length");


    await format(document);
    await activate(docUri);


    const postFormatDiagnostics = vscode.languages.getDiagnostics(docUri);
    assert.strictEqual(postFormatDiagnostics.length, 0, "Post-format diagnostics not expected length");

  }).timeout(9999999);

  const assertDiagnosticIsEqual = (actual: vscode.Diagnostic, expected: { range: any; message: any; code: any; }) => {
    assert.deepStrictEqual(actual.range, expected.range);
    assert.strictEqual(actual.severity, 0);
    assert.strictEqual(actual.message, expected.message);
    assert.strictEqual(actual.code, expected.code);
    assert.strictEqual(actual.source, "sqlfluff");
  };

});
