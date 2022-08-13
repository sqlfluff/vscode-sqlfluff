# vscode-sqlfluff

![.github/workflows/ci.yml](https://github.com/dorzey/vscode-sqlfluff/workflows/.github/workflows/ci.yml/badge.svg)

A linter and auto-formatter for [SQLFluff](https://github.com/alanmcruickshank/sqlfluff), a popular linting tool for SQL and dbt.

![linter in action](./media/linter_in_action.gif)

You can run [Format Document](https://code.visualstudio.com/docs/editor/codebasics#_formatting) to fix the linting violations. You cannot run Format Selection. Please note that not all linting violations are automatically fixable.

## Configuration

The extension expects sqlfluff to be installed and already added to the path. If it is installed but cannot be found, add the path to your preferences as seen below. Find the path by typing `which sqlfluff` into your terminal.

Edit your VS Code `settings.json` file manually or through the user interface.

If you want to manually update the `settings.json` file, open the VS Code command palette and type in `settings.json`. Select `Preferences: Open Settings`. Then, you can add any of the following configuration options to `settings.json`.

```json
  "sqlfluff.config": "",
  "sqlfluff.dialect": "mysql",
  "sqlfluff.excludeRules": ["L009"],
  "sqlfluff.executablePath": "sqlfluff",
  "sqlfluff.format.enabled": true,
  "sqlfluff.format.workingDirectory": "",
  "sqlfluff.ignoreLocalConfig": false,
  "sqlfluff.ignoreParsing": false,
  "sqlfluff.linter.run": "onType",
  "sqlfluff.rules": [],
```

## DBT Configuration

DBT setup requires these settings to lint and format the document.

```json
  "sqlfluff.linter.run": "onSave",
```

### Format file

By default you will be able use SQLFluff fix your file by formatting. Same as calling `sqlfluff fix --force <path>`

![plugin configuration](./media/format_config.gif)

## Credits / Links

- [dorzey](https://github.com/sqlfluff/vscode-sqlfluff)
- [VSCode's Extensions Samples](https://github.com/microsoft/vscode-extension-samples/tree/main/test-provider-sample)
- [VSCode's Testing Documentation](https://code.visualstudio.com/api/extension-guides/testing)

## License

The MIT License (MIT). Please see the [license file](LICENSE.md) for more information.
