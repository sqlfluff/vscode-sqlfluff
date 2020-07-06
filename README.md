# vscode-sqlfluff

![.github/workflows/ci.yml](https://github.com/dorzey/vscode-sqlfluff/workflows/.github/workflows/ci.yml/badge.svg)

An extension to use the [sqlfluff](https://github.com/alanmcruickshank/sqlfluff) linter in vscode.

The extension expects sqlfluff to be installed and already added to the path. If it is installed but cannot be found, add the path to your preferences as seen below.

```json
{
 "sql.linter.executablePath": "PathToExecutable"
}
```

## Configuration

### Lint onType or onSave or not at all

By default the linter will lint on the fly but can be changed to linting as you save. Note that linting on save is most useful when auto-save is on. Use the setting below if to change the behavior with the values `onType`, `onSave`, and `off`.

```json
{
 "sql.linter.run": "onType"
}
```

## Acknowledgements

The extension is based off of the [ruby linter extension](https://github.com/hoovercj/vscode-ruby-linter).