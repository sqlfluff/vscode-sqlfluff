import * as vscode from "vscode";

import { ParsedVersion } from "../providers/types/parsedVersion";
import Variables from "./types/variables";

export default class Utilities {
  static extensionName = "sqlfluff";
  static outputChannel = vscode.window.createOutputChannel("SQLFluff");

  static appendHyphenatedLine(newLines = true) {
    if (newLines) {
      Utilities.outputChannel.appendLine("\n------------------------------------------------------------\n");
    } else {
      Utilities.outputChannel.appendLine("------------------------------------------------------------");
    }
  }

  static interpolateString(command: string, variables: Variables): string {
    const regex = /\$\{([^}]+)\}/g;

    const match = command.match(regex);
    while (match?.length) {
      const placeholder = match.pop();
      const path = placeholder?.replace("${", "").replace("}", "");
      if (path && placeholder) {
        const variable: any = variables[path as keyof Variables];
        if (variable) {
          command = command.replace(placeholder, variable);
        }
      }
    }

    return command;
  }

  static normalizePath(path: string, allowEscapes = false): string {
    if (path === undefined) {
      return path;
    }

    // Capitalize drive letter
    path = path.replace(/^[A-Za-z]:/, (match) => match.toUpperCase());

    if (allowEscapes) {
      return path.replace(/\\{2,}/g, "/");
    }

    return path.replace(/\\+/g, "/");
  }

  static async sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  static parseVersion(versionString: string): ParsedVersion {
    const parsedVersion: ParsedVersion = {
      major: 0,
      minor: 0,
      patch: 0,
      preRelease: null,
      build: null,
    };

    // Regular expression to match the version number within the input string
    const versionRegex = /version (\d+\.\d+\.\d+)(-(?<preRelease>[0-9A-Za-z-.]+))?(\+(?<build>[0-9A-Za-z-.]+))?/;

    // Match the version string with the regex
    const match = versionString.match(versionRegex);

    // If there's a match, extract the version number
    if (match) {
      const version = match[1];
      const semverRegex =
        /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[0-9A-Za-z-.]+))?(\+(?<build>[0-9A-Za-z-.]+))?$/;
      const semverMatch = version.match(semverRegex);

      // If there's a match for the semver regex, assign the components to the parsedVersion object
      if (semverMatch && semverMatch.groups) {
        parsedVersion.major = Utilities.toNumber(semverMatch.groups.major, 0);
        parsedVersion.minor = Utilities.toNumber(semverMatch.groups.minor, 0);
        parsedVersion.patch = Utilities.toNumber(semverMatch.groups.patch, 0);
        parsedVersion.preRelease = semverMatch.groups.preRelease || null;
        parsedVersion.build = semverMatch.groups.build || null;
      }
    }

    return parsedVersion;
  }

  static isNumber = (value: any, cast = true) =>
    typeof value === "number" || (cast ? !isNaN(Number(value)) : !isNaN(value));

  static toNumber = (value: any, fallback = 0) => (Utilities.isNumber(value) ? Number(value) : fallback);

  /**
   * Get the diagnostic code without the description
   * @param diagnostic - VSCode Diagnostic
   * @returns Diagnostic code without description
   */
  static getDiagnosticCode = (diagnostic: vscode.Diagnostic) =>
    Utilities.extractBeforeColon(diagnostic.code?.toString() ?? "");

  private static extractBeforeColon(input: string): string {
    const match = input.match(/^(.*?):/);
    return match ? match[1] : "";
  }
}
