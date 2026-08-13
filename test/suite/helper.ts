import * as assert from "assert";
import * as vscode from "vscode";

const DIAGNOSTICS_TIMEOUT = 15000;

// The linter spawns an external `sqlfluff` process, whose run time varies with
// CI machine speed; a fixed sleep here was too short on slower runners, so
// wait for the diagnostics update that the lint run produces instead.
const waitForDiagnostics = (uri: vscode.Uri, timeout = DIAGNOSTICS_TIMEOUT): Promise<void> => {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      disposable.dispose();
      resolve();
    };
    const timer = setTimeout(finish, timeout);
    const disposable = vscode.languages.onDidChangeDiagnostics((event) => {
      if (event.uris.some((changedUri) => changedUri.toString() === uri.toString())) {
        finish();
      }
    });
  });
};

export const activate = async (documentUri: vscode.Uri): Promise<vscode.TextDocument | undefined> => {
  // The extensionId is `publisher.name` from package.json
  const extension = vscode.extensions.getExtension("sqlfluff.vscode-sqlfluff");
  assert.notStrictEqual(extension, undefined);
  await extension?.activate();
  try {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    const diagnosticsChanged = waitForDiagnostics(documentUri);
    const document = await vscode.workspace.openTextDocument(documentUri);
    await vscode.window.showTextDocument(document);
    await document.save();
    await diagnosticsChanged;
    return document;
  } catch (e) {
    console.error(e);
  }
};

export const format = async (documentUri: vscode.Uri) => {
  try {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    const document = await vscode.workspace.openTextDocument(documentUri);
    await vscode.window.showTextDocument(document);
    // The document is already open at this point (activate() opened it), so
    // formatting -- not opening -- is what triggers the next lint run.
    const diagnosticsChanged = waitForDiagnostics(documentUri);
    await vscode.commands.executeCommand("editor.action.formatDocument");
    await document.save();
    await diagnosticsChanged;
    return document;
  } catch (e) {
    console.error(e);
  }
};

export const getDocumentUri = (p: string) => {
  return vscode.Uri.file(__dirname + p);
};

export const toRange = (startLine: number, StartCharacter: number, endLine: number, endCharacter: number) => {
  const start = new vscode.Position(startLine, StartCharacter);
  const end = new vscode.Position(endLine, endCharacter);
  return new vscode.Range(start, end);
};
