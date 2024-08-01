export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  preRelease: string | null;
  build: string | null;
}
