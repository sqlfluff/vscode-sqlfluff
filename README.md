# vscode-sqlfluff

![.github/workflows/ci.yml](https://github.com/dorzey/vscode-sqlfluff/workflows/.github/workflows/ci.yml/badge.svg)

An extension to use the [SQLFluff](https://github.com/alanmcruickshank/sqlfluff) linter in vscode.

![linter in action](./media/linter_in_action.gif)

You can run [Format Document](https://code.visualstudio.com/docs/editor/codebasics#_formatting) to fix the linting violations. You cannot run Format Selection.
## Configuration

The extension expects sqlfluff to be installed and already added to the path. If it is installed but cannot be found, add the path to your preferences as seen below.

![plugin configuration](./media/config.gif)

By default the linter will lint on the fly but can be changed to linting as you save. Note that linting on save is most useful when auto-save is on. 

The linter will work on files with the [language mode](https://code.visualstudio.com/docs/languages/overview#_changing-the-language-for-the-selected-file) set to `sql` or `jinja-sql`. The screen capture below shows you how to switch it.

![switch language mode](./media/language_mode.gif)

### Format file

By default you will be able use SQLFluff fix your file by formatting. Same as calling `sqlfluff fix --force --no-safey <path>`

```json
{
 "sql.format.enable": true
}
```

## Acknowledgements

The extension is based off of the [ruby linter extension](https://github.com/hoovercj/vscode-ruby-linter).