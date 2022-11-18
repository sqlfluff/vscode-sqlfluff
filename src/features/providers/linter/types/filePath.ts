import Violation from "./violation";

export default interface FilePath {
  filepath: string;
  violations: Array<Violation>;
}
