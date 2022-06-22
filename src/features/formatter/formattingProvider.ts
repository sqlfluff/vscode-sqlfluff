"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";

import { Configuration } from "../Helpers/configuration";
import { LinterConfiguration } from "../utils/lintingProvider";
import Process from "./process";

export class DocumentFormattingEditProvider {
  public linterConfiguration: () => LinterConfiguration;

  constructor(linterConfiguration: () => LinterConfiguration) {
    this.linterConfiguration = linterConfiguration;
    vscode.workspace.onDidChangeConfiguration(linterConfiguration, this);
  }

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const linterConfiguration = this.linterConfiguration();
    const workingDirectory = Configuration.workingDirectory();
    const textEdits: vscode.TextEdit[] = [];

    if (linterConfiguration.formatterEnabled) {
      const command = linterConfiguration.executable;

      let args: string[] = ["fix", "--force", "-"];
      args = args.concat(linterConfiguration.extraArgs);

      const spawnOptions: cp.SpawnOptions = workingDirectory
        ? { cwd: workingDirectory }
        : undefined;

      const output = await new Process().run(command, args, spawnOptions, document);

      const lines = output.split(/\r?\n/);
      const lineCount = document.lineCount;
      const lastLineRange = document.lineAt(lineCount - 1).range;
      const endChar = lastLineRange.end.character;

      if (lines[0].startsWith("NO SAFETY:")) {
        lines.shift();
        lines.shift();
      }

      if (lines.length > 1 || lines[0] !== "") {
        textEdits.push(vscode.TextEdit.replace(
          new vscode.Range(0, 0, document.lineCount, endChar),
          lines.join("\n")
        ));
      }
    }

    return textEdits;
  }
}
