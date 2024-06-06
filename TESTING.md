## Guide to Testers

1. Clone or download the repo and set as working directory.
2. Ensure node and typescript are installed.
3. Build the `vsix` file:
   ```bash
   cd vscode-sqlfluff
   npm install
   npx vsce package
   ```
4. Load into VS Code:
   1. Open VS Code and Navigate to the Extensions Panel
   2. From the Exensions elipse ("...") menu, select "Install from VSIX..."
   3. Navigate to the `vscode-sqlfluff` folder and select the generated `.vsix` file.
