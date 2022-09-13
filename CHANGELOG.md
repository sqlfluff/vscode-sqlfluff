# Change Log

All notable changes to the "sqlfluff" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2022-09-12

- Add a hover provider to view the documentation from the SQLFluff site.
- [#60](https://github.com/sqlfluff/vscode-sqlfluff/pull/60) New JSON escaping normalization.

## [0.0.9] - 2022-09-08

- Add the quick fix option to view the SQLFluff documention on the SQLFluff website.
- Fix the diagnostics so the quick fix can be triggered by any location on the problem word.

## [0.0.8] - 2022-09-08

- This release rewrites some of the extension code, but should leave the functionality the same.
- There is now an output channel (SQLFluff) that contains additional information about the commands and can help with debugging.
- The `executablePath` and `config` settings can now make use of configuration variables.
- (https://github.com/sqlfluff/vscode-sqlfluff/pull/59) Fix issues with spawned procs, stdin use, env, and output.
- Takes inspiration from (https://github.com/sqlfluff/vscode-sqlfluff/pull/56) Fix issues with spawned procs, stdin use, env, and output.

## [0.0.7] - 2022-08-30

- [#57](https://github.com/sqlfluff/vscode-sqlfluff/pull/57) Fix automated tests and JSON parsing errors.

## [0.0.6] - 2022-07-29

- [#50](https://github.com/sqlfluff/vscode-sqlfluff/pull/50) refactors the extension and adds several new settings.
- [#33](https://github.com/sqlfluff/vscode-sqlfluff/pull/33) adds basic set of automated tests

## [0.0.5] - 2021-06-16

### Added

- [#9](https://github.com/sqlfluff/vscode-sqlfluff/pull/9) adds VS Code "format" capability to run "fix" in SQLFLuff
- [#31](https://github.com/sqlfluff/vscode-sqlfluff/pull/31) updates CLI args and adds ignoreParsing option

### Changed

- [#10](https://github.com/sqlfluff/vscode-sqlfluff/pull/10) updates README and adds TESTING.md
- [#16](https://github.com/sqlfluff/vscode-sqlfluff/pull/17) updates README
- [#28](https://github.com/sqlfluff/vscode-sqlfluff/pull/28) dependabot bump
- [#30](https://github.com/sqlfluff/vscode-sqlfluff/pull/30) dependabot bump

### Removed

- [#26](https://github.com/sqlfluff/vscode-sqlfluff/pull/26) remove obsolete "--no-safety" flag

## [0.0.4] - 2020-11-16

### Changed

- [#8](https://github.com/sqlfluff/vscode-sqlfluff/pull/8) fixes line number mismatch

## [0.0.3] - 2020-07-25

### Changed

- Bumps lodash from 4.17.15 to 4.17.19

## [0.0.2] - 2020-07-06

### Added

- [#2](https://github.com/dorzey/vscode-sqlfluff/pull/2) support for jinja-sql

### Changed

- [#1](https://github.com/dorzey/vscode-sqlfluff/pull/1) linter.run default switched to onType

## [0.0.1] - 2020-07-06

### Initial release
