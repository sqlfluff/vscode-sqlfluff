'use strict';

import * as cp from 'child_process';

import * as vscode from 'vscode';

import { ThrottledDelayer } from './async';
import { LineDecoder } from './lineDecoder';
import { stringify } from 'querystring';

enum RunTrigger {
	onSave,
	onType,
	off
}

namespace RunTrigger {
	export let strings = {
		onSave: 'onSave',
		onType: 'onType',
		off: 'off'
	};
	export let from = function(value: string): RunTrigger {
		if (value === 'onType') {
			return RunTrigger.onType;
		} else if (value === 'onSave') {
			return RunTrigger.onSave;
		} else {
			return RunTrigger.off;
		}
	};
}

export interface LinterConfiguration {
	executable:string,
	fileArgs:string[],
	bufferArgs:string[],
	extraArgs:string[],
	runTrigger:string,
	formatterEnabled:boolean,
}

export interface Linter {
	languageId: Array<string>,
	loadConfiguration:()=>LinterConfiguration | null,
	process:(output:string[])=>vscode.Diagnostic[]	
}

export class LintingProvider {
	
	public linterConfiguration!: LinterConfiguration;

	private executableNotFound: boolean;
	
	private documentListener!: vscode.Disposable;
	private diagnosticCollection!: vscode.DiagnosticCollection;
	private delayers!: { [key: string]: ThrottledDelayer<void> };
	
	
	private linter:Linter;
	constructor(linter:Linter) {
		this.linter = linter;
		this.executableNotFound = false;
	}

	public activate(subscriptions: vscode.Disposable[]) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
		subscriptions.push(this);
		vscode.workspace.onDidChangeConfiguration(this.loadConfiguration, this, subscriptions);
		this.loadConfiguration();

		vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument)=> {
			this.diagnosticCollection.delete(textDocument.uri);
			delete this.delayers[textDocument.uri.toString()];
		}, null, subscriptions);

		// Lint all open documents documents
		vscode.workspace.textDocuments.forEach(this.triggerLint, this);
	}

	public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}

	private loadConfiguration(): void {
		let oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
		const config = this.linter.loadConfiguration();
		if(config){
			this.linterConfiguration = config;
		}
		
		this.delayers = Object.create(null);
		if (this.executableNotFound) {
			this.executableNotFound = oldExecutable === this.linterConfiguration.executable;
		}
		if (this.documentListener) {
			this.documentListener.dispose();
		}
		if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType) {
			this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
				this.triggerLint(e.document);
			});
		} else {
			this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);
		}		
		this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);
		// Configuration has changed. Reevaluate all documents.
		vscode.workspace.textDocuments.forEach(this.triggerLint, this);
	}

	private triggerLint(textDocument: vscode.TextDocument): void {
		if (!this.linter.languageId.includes(textDocument.languageId) || this.executableNotFound || RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.off){
			return;
		}
		let key = textDocument.uri.toString();
		let delayer = this.delayers[key];
		if (!delayer) {
			delayer = new ThrottledDelayer<void>(RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType ? 250 : 0);
			this.delayers[key] = delayer;
		}
		delayer.trigger(() => {return this.doLint(textDocument);} );
	}

	private doLint(textDocument: vscode.TextDocument): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let executable = this.linterConfiguration.executable;
			let filePath = textDocument.fileName;
			let decoder = new LineDecoder();
			let decoded = [];
			let diagnostics: vscode.Diagnostic[] = [];
			
			let options = vscode.workspace.rootPath ? {
				 cwd: vscode.workspace.rootPath,
				 env: {
					 LANG: 'en_US.utf-8'
				 }
				} : undefined;
			let args: string[];
			if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onSave) {
				args = this.linterConfiguration.fileArgs.slice(0);
				args.push(textDocument.fileName);
			} else {
				args = this.linterConfiguration.bufferArgs;
			}
			args = args.concat(this.linterConfiguration.extraArgs);

			let childProcess = cp.spawn(executable, args, options);
			childProcess.on('error', (error: Error) => {
				if (this.executableNotFound) {
					resolve();
					return;
				}
				let message: string = "";
				if ((<any>error).code === 'ENOENT') {
					message = `Cannot lint ${textDocument.fileName}. The executable was not found. Use the 'Executable Path' setting to configure the location of the executable`;
				} else {
					message = error.message ? error.message : `Failed to run executable using path: ${executable}. Reason is unknown.`;
				}
				vscode.window.showInformationMessage(message);
				this.executableNotFound = true;
				resolve();
			});

			let onDataEvent = (data:Buffer) => {
				decoder.write(data);
			};
			let onEndEvent = () => {
				decoder.end();
				let lines = decoder.getLines();
				if (lines && lines.length > 0) {
					diagnostics = this.linter.process(lines);
				}					
				this.diagnosticCollection.set(textDocument.uri, diagnostics);
				resolve();
			};
			
			if (childProcess.pid) {
				if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType) {
					childProcess.stdin.write(textDocument.getText());
					childProcess.stdin.end();
				}
				childProcess.stdout.on('data', onDataEvent);
				childProcess.stdout.on('end', onEndEvent);
				resolve();
			} else {
				resolve();
			}
		});
	}
}
