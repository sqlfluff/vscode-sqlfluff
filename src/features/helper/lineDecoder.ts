import { StringDecoder } from "string_decoder";

export class LineDecoder {
  private stringDecoder: StringDecoder;
  private remaining: string;
  private lines: string[];

  constructor(encoding: BufferEncoding = "utf8") {
    this.stringDecoder = new StringDecoder(encoding);
    this.remaining = "";
    this.lines = [];
  }

  public write(buffer: Buffer): string[] {
    const result: string[] = [];
    const value = this.remaining ? this.remaining + this.stringDecoder.write(buffer) : this.stringDecoder.write(buffer);

    if (value.length < 1) {
      this.lines = this.lines.concat(value);
      return result;
    }

    let start = 0;
    let characterCode: number = value.charCodeAt(start);
    while (start < value.length && (characterCode === 10 || characterCode === 13)) {
      start++;
    }

    let idx = start;
    while (idx < value.length) {
      characterCode = value.charCodeAt(idx);
      if (characterCode === 10 || characterCode === 13) {
        result.push(value.substring(start, idx));
        idx++;
        characterCode = value.charCodeAt(idx);
        while (idx < value.length && (characterCode === 10 || characterCode === 13)) {
          idx++;
        }
        start = idx;
      } else {
        idx++;
      }
    }

    this.remaining = start < value.length ? value.substring(start) : "";
    this.lines = this.lines.concat(result);

    return result;
  }

  public end(): string {
    if (this.remaining && this.remaining.length > 0) {
      this.lines = this.lines.concat(this.remaining);
    }

    return this.remaining;
  }

  public getLines(): string[] {
    return this.lines;
  }
}
