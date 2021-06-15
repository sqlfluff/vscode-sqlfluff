'use strict';
import * as vscode from 'vscode';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';
import { DocumentFormattingEditProvider } from './formatter/formattingProvider';

export class SqlFluffLinterProvider implements Linter {

	public languageId = ['sql', 'jinja-sql'];

	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this);
		provider.activate(subscriptions);
	}

	public loadConfiguration(): LinterConfiguration {
		let section = workspace.getConfiguration();

		const linterConfiguration = {
			executable: section.get<string>('sql.linter.executablePath', 'sqlfluff'),
			fileArgs: ['lint', '--format', 'json'],
			bufferArgs: ['lint', '--format', 'json', '-'],
			extraArgs: ['--ignore', 'parsing'],
			runTrigger: section.get<string>('sql.linter.run', 'onType'),
			formatterEnabled: section.get<boolean>('sql.format.enable', true),
		};
		console.log('loaded config,', linterConfiguration);
		return linterConfiguration;
	}

	public process(lines: string[]): Diagnostic[] {
		let diagnostics: Diagnostic[] = [];
		lines.forEach((line) => {
			let filePaths: Array<FilePath> = JSON.parse(line);

			filePaths.forEach((filePath: FilePath) => {
				filePath.violations.forEach((violation: Violation) => {
					diagnostics.push({
						range: new Range(violation.line_no-1, violation.line_pos, violation.line_no-1, violation.line_pos),
						severity: DiagnosticSeverity.Error,
						message: violation.description,
						code: violation.code,
						source: 'sqlfluff'
					});
				});
			});

		});
		return diagnostics;
	}
}

interface FilePath {
	violations: Array<Violation>
}

export class SqlFLuffDocumentFormattingEditProvider {
	activate(): vscode.DocumentFormattingEditProvider {
		const configuration = new SqlFluffLinterProvider().loadConfiguration;
		console.log('creating formatter??');
		return new DocumentFormattingEditProvider(configuration);
	}
}

interface Violation {
	line_no: number,
	line_pos: number,
	description: string,
	code: string,
}