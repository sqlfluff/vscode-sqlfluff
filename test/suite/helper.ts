import * as vscode from 'vscode';

export const activate = async (docUri: vscode.Uri): Promise<vscode.TextDocument | undefined> => {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('vscode-sqlfluff');
    await ext?.activate();
    try {
        const document = await vscode.workspace.openTextDocument(docUri);
        const editor = await vscode.window.showTextDocument(document);

        await sleep(2000); // Wait for server activation

        return document;
    } catch (e) {
        console.error(e);
    }
};

export const format = async (document: vscode.TextDocument | undefined) => {
    if (document) {
        try {
            await vscode.commands.executeCommand("editor.action.formatDocument");
            await sleep(2000);
            await document.save();
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        } catch (e) {
            console.error(e);
        }
    }
};

const sleep = async (ms: number): Promise<any> => {
    return new Promise(resolve => {
        return setTimeout(resolve, ms);
    });
};

export const getDocUri = (p: string) => {
    return vscode.Uri.file(__dirname + p);
};

export const toRange = (sLine: number, sChar: number, eLine: number, eChar: number) => {
    const start = new vscode.Position(sLine, sChar);
    const end = new vscode.Position(eLine, eChar);
    return new vscode.Range(start, end);
};