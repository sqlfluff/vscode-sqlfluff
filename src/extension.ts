import * as vscode from 'vscode';

import {SqlFluffLinterProvider, SqlFLuffDocumentFormattingEditProvider} from './features/sqlFluffLinter';

export const activate = (context: vscode.ExtensionContext) => {
	new SqlFluffLinterProvider().activate(context.subscriptions);

	vscode.languages.registerDocumentFormattingEditProvider('jinja-sql', new SqlFLuffDocumentFormattingEditProvider().activate());
	vscode.languages.registerDocumentFormattingEditProvider('sql', new SqlFLuffDocumentFormattingEditProvider().activate());
};

export const deactivate: any = () => {};

