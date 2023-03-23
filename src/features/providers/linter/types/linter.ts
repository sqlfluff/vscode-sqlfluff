import FileDiagnostic from "./fileDiagnostic";

export default interface Linter {
  languageId: Array<string>,
  process: (lines: string[], filePath: string) => FileDiagnostic[];
}
