import * as assert from "assert";

import Configuration from "../../src/features/helper/configuration";
import Variables from "../../src/features/helper/types/variables";
import Utilities from "../../src/features/helper/utilities";

suite("Utilities Function Test Suite", () => {
  const variables = Configuration.variables();
  const variablesToCheck = ["userHome", "workspaceFolder", "workspaceFolderBasename", "execPath"];
  variablesToCheck.forEach((variable) => {
    test(`${variable} resolves in interpolation`, function () {
      const interpolatedString = Utilities.interpolateString(`\${${variable}}`, variables);
      const expectedValue = variables[variable as keyof Variables];
      assert.strictEqual(interpolatedString, expectedValue);
    });
  });
});
