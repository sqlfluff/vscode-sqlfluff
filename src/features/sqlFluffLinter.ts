"use strict";
import * as vscode from "vscode";
import { Diagnostic, DiagnosticSeverity, Disposable, Range } from "vscode";

import { DocumentFormattingEditProvider } from "./formatter/formattingProvider";
import { Configuration } from "./Helpers/configuration";
import { Linter, LinterConfiguration, LintingProvider } from "./utils/lintingProvider";

export class SqlFluffLinterProvider implements Linter {
	public languageId = ["sql", "jinja-sql", "sql-bigquery"];

	public activate(subscriptions: Disposable[]) {
		const provider = new LintingProvider(this);
		provider.activate(subscriptions);
	}

	public loadConfiguration(): LinterConfiguration {
		const linterConfiguration = {
			executable: Configuration.executablePath(),
			fileArgs: ["lint", "--format", "json"],
			bufferArgs: ["lint", "--format", "json", "-"],
			extraArgs: Configuration.extraArguments(),
			runTrigger: Configuration.runTrigger(),
			formatterEnabled: Configuration.formattingEnabled(),
		};

		return linterConfiguration;
	}

	public process(lines: string[]): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		lines.forEach((line) => {
			const filePaths: Array<FilePath> = JSON.parse(line);

			filePaths.forEach((filePath: FilePath) => {
				filePath.violations.forEach((violation: Violation) => {
					diagnostics.push({
						range: new Range(
							violation.line_no - 1,
							violation.line_pos,
							violation.line_no - 1,
							violation.line_pos
						),
						severity: DiagnosticSeverity.Error,
						message: violation.description,
						code: violation.code,
						source: "sqlfluff",
					});
				});
			});

		});

		return diagnostics;
	}
}

interface FilePath {
	violations: Array<Violation>;
}

export class SqlFLuffDocumentFormattingEditProvider {
	activate(): vscode.DocumentFormattingEditProvider {
		const configuration = new SqlFluffLinterProvider().loadConfiguration;
		return new DocumentFormattingEditProvider(configuration);
	}
}

interface Violation {
	line_no: number,
	line_pos: number,
	description: string,
	code: string,
}
