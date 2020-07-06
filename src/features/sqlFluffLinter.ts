'use strict';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';

export default class SqlFluffLinterProvider implements Linter {

	public languageId = ['sql', 'jinja-sql'];

	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this);
		provider.activate(subscriptions);
	}

	public loadConfiguration(): LinterConfiguration | null{
		let section = workspace.getConfiguration();
		if (!section) {
			return null;
		}

		const linterConfiguration = {
			executable: section.get<string>('linter.executablePath', 'sqlfluff'),
			fileArgs: ['lint', '--format', 'json'],
			bufferArgs: ['lint', '--format', 'json', '-'],
			extraArgs: [],
			runTrigger: section.get<string>('linter.run', 'onType')
		};
		return linterConfiguration;
	}

	public process(lines: string[]): Diagnostic[] {
		let diagnostics: Diagnostic[] = [];
		lines.forEach((line) => {
			let filePaths: Array<FilePath> = JSON.parse(line);

			filePaths.forEach((filePath: FilePath) => {
				filePath.violations.forEach((violation: Violation) => {
					diagnostics.push({
						range: new Range(violation.line_no, violation.line_pos, violation.line_no, violation.line_pos),
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

interface Violation {
	line_no: number,
	line_pos: number,
	description: string,
	code: string,
}