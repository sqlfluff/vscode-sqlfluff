import * as vscode from 'vscode';

import SqlFluffLinterProvider from './features/sqlFluffLinter';

export const activate = (context: vscode.ExtensionContext) => {
	new SqlFluffLinterProvider().activate(context.subscriptions);
};

export const deactivate: any = () => {};

