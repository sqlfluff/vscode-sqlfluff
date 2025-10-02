# Change Log

All notable changes to the "sqlfluff" extension will be documented in this file.

## [3.5.0] - 2025-10-02

- Ensure the `onType` linting respects ignored files. This is done by
  adding ignored files (determined when `onSave` is run) to an array and
  checking against that array. [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/178)

## [3.4.0] - 2024-09-27

- Ensure `sqlfluff.fix` uses the `sqlfluff` formatter when it is not
  the default formatter. Thanks to zellers' [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/176)

## [3.3.1] - 2024-09-27

- Update the dialects to add `trino`. Thanks to PaulRBerg's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/169)

## [3.3.0] - 2024-09-27

- Update the scope of the settings to 'resource' for more granular settings. [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/156)

## [3.2.1] - 2024-09-18

- Silence notification when file/path is in `.sqlfluffignore`. [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/155)

## [3.2.0] - 2024-08-20

- Update to rule permalinks. Thanks to alanmcruickshank's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/152)

## [3.1.5] - 2024-08-16

- Fix bug with ignoring diagnostics

## [3.1.4] - 2024-07-25

- Correctly parse the sqlfluff version number. [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/151)

## [3.1.3] - 2024-07-25

- Improved Handling for Problems in Closed/Deleted files. Thanks to jackfrey13's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/150)

## [3.1.2] - 2024-07-19

- Attempt to fix "File path not found" [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/147)
- Datacoves' dbt-core-interface improvements + new response. Thanks to BAntonellini's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/144)
- Prevent "Specified path does not exist" error for empty untitled files. Thanks to jackfrey13's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/149)

## [3.1.1] - 2024-07-10

- Show the rule name in the problems tab [Issue](https://github.com/sqlfluff/vscode-sqlfluff/issues/134)

## [3.1.0] - 2024-07-03

- Allow the extension to accept warnings from the underlying linter. Thanks to TheCleric's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/140)
- Add support for --stdin-filename for nested config. Thanks to keraion's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/136)
- Add support for ${userHome}. Thanks to keraion's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/135)

## [3.0.2] - 2024-04-01

- Update changelog

## [3.0.1] - 2024-04-01

- Add a status bar button that runs "Format document with sqlfluff"
- If dbt-core-interface is enabled in the extension
  - The "fix" command should use dbt-core-interface /format endpoint
  - The "format selection" action should also use dbt-core-interface /format endpoint

## [3.0.0] - 2024-03-13

- Update for sqlfluff version 3.0.0.
- Add Vertica dialect.
- Removed `--force` from `fix` as it is the default for >= 3.0.0.

## [2.4.4] - 2023-09-12

- Switch DBT Osmosis to DBT Core Interface. Thanks to BAntonellini's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/111)

## [2.4.3] - 2023-08-17

- Use uppercase drive letters on Windows. Thanks to mhahn-ts's [Pull Request](https://github.com/sqlfluff/vscode-sqlfluff/pull/111)

## [2.4.2] - 2023-08-17

- Show context menu items by default.
- Always allow for commands to show on enabled languages.

## [2.4.1] - 2023-07-27

- Fix bugs with `SQLFluff Format Selection`.

## [2.4.0] - 2023-07-26

- Fix bug with `SQLFluff Format Selection` now can be placed in the context menu.

## [2.3.9] - 2023-07-26

- Update the `sqlfluff.format.languages` to accept objects containing formatting settings for the languages to address this [Feature Request](https://github.com/sqlfluff/vscode-sqlfluff/issues/94)
- Format selection now can format while preserving the whitespace (based on first line)
- `SQLFluff Format Selection` now can be placed in the context menu.

## [2.3.8] - 2023-07-16

- Fix - Stop SQLFluff output channel from showing twice

## [2.3.7] - 2023-07-15

- Update the `sqlfluff.dialect` enum
- Update the `sqlfluff.codeActions.noqa` defaults to the sqlfluff 2.0 rule values

## [2.3.6] - 2023-07-15

- Add the `sqlfluff.format.languages` setting to allow for users to determine which languages the formatting activates for
- Add the `sqlfluff.linter.languages` setting to allow for users to determine which languages the linting activates for

## [2.3.5] - 2023-07-14

- Add the ability to `Format Selection`
- Add the command `sqlfluff.showOutputChannel` to reveal the SQLFluff Output Channel
- Display error for ignored parsing issues when attempting a format

## [2.3.4] - 2023-06-07

- Add the option `sqlfluff.shell`
- Add the command `sqlfluff.debug` to help users with debugging the extension when they run into issues.

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
