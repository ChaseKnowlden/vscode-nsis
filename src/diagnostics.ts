import * as vscode from 'vscode';
import { compile } from 'makensis';
import { findErrors, findWarnings, getMakensisPath, getPreprocessMode, getSpawnEnv, isStrictMode } from './util';

async function updateDiagnostics(document: vscode.TextDocument | null, collection: vscode.DiagnosticCollection): Promise<void> {
  if (document && document.languageId === 'nsis') {
    let pathToMakensis: string;

    try {
      pathToMakensis = await getMakensisPath();
    } catch (error) {
      console.error(error);

      return;
    }

    const preprocessMode = await getPreprocessMode();

    const options = {
      verbose: 2,
      pathToMakensis,
      preprocessMode,
      strict: await isStrictMode()
    };

    let output;

    try {
      output = await compile(document.fileName, options, await getSpawnEnv());
    } catch (error) {
      console.error(error);
    }

    const diagnostics = [];

    const warnings = await findWarnings(output.stdout);
    if (warnings) diagnostics.push(...warnings);

    const error = findErrors(output.stderr);
    if (error) diagnostics.push(error);

    collection.set(document.uri, diagnostics);
  } else {
    collection.clear();
  }
}

export {
  updateDiagnostics
};
