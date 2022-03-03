import * as vscode from "vscode";

import { SqlFLuffDocumentFormattingEditProvider, SqlFluffLinterProvider } from "./features/sqlFluffLinter";

export const activate = (context: vscode.ExtensionContext) => {
	new SqlFluffLinterProvider().activate(context.subscriptions);

	vscode.languages.registerDocumentFormattingEditProvider("sql", new SqlFLuffDocumentFormattingEditProvider().activate());
	vscode.languages.registerDocumentFormattingEditProvider("sql-bigquery", new SqlFLuffDocumentFormattingEditProvider().activate());
	vscode.languages.registerDocumentFormattingEditProvider("jinja-sql", new SqlFLuffDocumentFormattingEditProvider().activate());
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };

