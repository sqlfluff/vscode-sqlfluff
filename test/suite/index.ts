import * as glob from "glob";
import * as Mocha from "mocha";
import * as path from "path";

export const run = (): Promise<void> => {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    try {
      const testFiles = glob.globSync("**/**.test.js", { cwd: testsRoot });
      // Add files to the test suite
      testFiles.forEach((file) => {
        return mocha.addFile(path.resolve(testsRoot, file));
      });

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    } catch (error) {
      reject();
    }
  });
};
