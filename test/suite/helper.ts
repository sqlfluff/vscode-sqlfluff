import * as vscode from "vscode";

export const SLEEP_TIME = 10000;

export const activate = async (documentUri: vscode.Uri): Promise<vscode.TextDocument | undefined> => {
    // The extensionId is `publisher.name` from package.json
    const extension = vscode.extensions.getExtension("vscode-sqlfluff");
    await extension?.activate();
    try {
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        const document = await vscode.workspace.openTextDocument(documentUri);
        await vscode.window.showTextDocument(document);
        await document.save();

        await sleep(SLEEP_TIME); // Wait for server activation

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
        await vscode.commands.executeCommand("editor.action.formatDocument");
        await sleep(SLEEP_TIME);
        await document.save();

        await sleep(SLEEP_TIME); // Wait for server activation

        return document;
    } catch (e) {
        console.error(e);
    }
};

export const sleep = async (ms: number): Promise<any> => {
    return new Promise(resolve => {
        return setTimeout(resolve, ms);
    });
};

export const getDocumentUri = (p: string) => {
    return vscode.Uri.file(__dirname + p);
};

export const toRange = (startLine: number, StartCharacter: number, endLine: number, endCharacter: number) => {
    const start = new vscode.Position(startLine, StartCharacter);
    const end = new vscode.Position(endLine, endCharacter);
    return new vscode.Range(start, end);
};
