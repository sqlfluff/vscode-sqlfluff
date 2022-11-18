import FileDiagnostic from "./fileDiagnostic";

export default interface Linter {
  languageId: Array<string>,
  process: (output: string[]) => FileDiagnostic[];
}
