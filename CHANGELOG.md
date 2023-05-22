# Change Log

All notable changes to the "sqlfluff" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.3.3] - 2023-05-22

- Add the options `sqlfluff.env.customDotEnvFiles` and `sqlfluff.env.useDotEnvFile` to address this [Feature Request](https://github.com/sqlfluff/vscode-sqlfluff/issues/101)
- Deprecate `sqlfluff.environmentVariables` in favor of `sqlfluff.env.environmentVariables`

## [2.3.2] - 2023-05-15

- Fix typo in the word "executable"

## [2.3.1] - 2023-05-09

- Update description for workingDirectory setting. Thanks to qbatten's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/99)

## [2.3.0] - 2023-05-03

- Add `fileWorkspaceFolder` variable thanks to pdecat's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/97)

## [2.2.9] - 2023-04-29

- Update README [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/96)

## [2.2.8] - 2023-04-14

- Add snowflake-sql support. Thanks to rubensa's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/93)

## [2.2.7] - 2023-04-05

- Update URL for sqlfluff rules documentation on hover.
- Update README to note rules documentation only works with SQLFluff v2.0.0 or greater

## [2.2.6] - 2023-03-28

- Update URL for sqlfluff rules documentation. Thanks to yaegassy's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/89)
- Add duckdb to the dialect options. Thanks to rene-haskia's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/91)

## [2.2.5] - 2023-03-23

- Fix [Issue #88](https://github.com/sqlfluff/vscode-sqlfluff/issues/88)
- Change the linting to match files exactly when possible
- Do not attempt to lint diff files

## [2.2.4] - 2023-02-28

- Add snowflake-sql support. Thanks to fdrijver's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/77)

## [2.2.3] - 2023-01-24

- Allow for variables in the working directory setting.

## [2.2.2] - 2022-12-19

- Allow for variables in the configuration setting.

## [2.2.1] - 2022-12-02

- Do not show error if ignored file does not lint.

## [2.2.0] - 2022-11-23

- Add postgres as a language option. Thanks to frederikaalund's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/77)

## [2.1.1] - Pre-Release - 2022-11-18

- Fix linting not clearing diagnostics when there are no linting problems.

## [2.1.0] - Pre-Release - 2022-11-18

- Improve the `lintEntireProject` to lint the entire workspace at once.

## [2.0.1] - 2022-11-17

- Add a `sqlfluff.environmentVariables` configuration setting to allow users to set their own environment variables.
- Improve the `lintEntireProject` setup to limit the amount of files that are linted at any one time to 5 files.

## [2.0.0] - 2022-11-17

- Allow the extension to work while not in a workspace.
- Improve the `View Documentation` hover to more often show when any part of the word is hovered over.

## [0.1.9] - 2022-11-08

- Re-order the quick fix options.
- Implement `sqlfluff.codeActions` options to disable code actions.

## [0.1.8] - 2022-11-04

- Implement quick fix options to add the `--noqa` or `--noqa: <rule>` to the linter.

## [0.1.7] - 2022-10-24

- Add `linter.lintEntireProject` configuration option that defaults to `false`.

## [0.1.6] - 2022-10-22

- Add `linter.delay` configuration option.
- SQLFluff now lints all files when VSCode is loaded or a config is changed.
- Add `SQLFluff Lint` and `SQLFluff Fix` commands.

## [0.1.5] - 2022-10-22

- Add `linter.severity` configuration option.

## [0.1.4] - 2022-10-11

- Add `format.arguments` and `linter.arguments` configuration options..

## [0.1.3] - 2022-10-02

- Add [Datacoves.com](https://datacoves.com/) to the new **Sponsors** section.

## [0.1.2] - 2022-09-21

- Add `suppressNotifications` setting to hide notification messages.
- Solve issue [#54](https://github.com/sqlfluff/vscode-sqlfluff/issues/54) thanks to XiChu2333's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/55)

## [0.1.1] - 2022-09-12

- Add quickfix option to exclude the rule from the workspace settings instead of the global settings.

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
