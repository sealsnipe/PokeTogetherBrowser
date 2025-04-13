const fs = require('fs');
const path = require('path');

// Set of allowed text file extensions
const allowedExtensions = new Set([
  '.js', '.html', '.css', '.md', '.json', '.txt', '.sh', '.bat', '.env', '.gitignore', '.yml', '.yaml', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.kts', '.sql', '.xml', '.toml'
]);

// Set of directories to ignore completely
const ignoredDirs = new Set(['.git', 'node_modules', '.vscode', '.next', 'test-results', 'glitchtip']);

let totalLines = 0;
let totalCharacters = 0;

function calculateStats(filePath) {
  try {
    // First check: Is the extension allowed?
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    const isAllowedExtension = allowedExtensions.has(ext);
    const isKnownExtensionless = ['license', 'readme', 'dockerfile', 'makefile'].includes(basename);

    if (!isAllowedExtension && ext !== '' && !isKnownExtensionless) {
        // console.log(`Skipping file due to extension: ${filePath}`);
        return null; // Skip file based on extension
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Improved line counting: Count newline characters + 1 if content exists.
    // Handles empty files (0 lines) and files with one line correctly.
    const lineBreaks = (fileContent.match(/(\r?\n)/g) || []).length;
    const lines = fileContent.length > 0 ? lineBreaks + 1 : 0; // Add 1 for the last line if not empty
    const characters = fileContent.length;

    // Basic binary check: Check for null bytes
    if (fileContent.includes('\u0000')) {
        // console.log(`Skipping binary file (null byte detected): ${filePath}`);
        return null; // Indicate skipped file
    }

    totalLines += lines;
    totalCharacters += characters;

    return { lines, characters };
  } catch (error) {
    // Ignore read errors (e.g., permission denied, or truly binary files that throw errors)
    // console.error(`Fehler beim Lesen/Verarbeiten der Datei ${filePath}: ${error.message}`);
    return null; // Indicate skipped/error file
  }
}

function traverseDirectory(directoryPath) {
  try {
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        // Skip ignored directories by name
        if (!ignoredDirs.has(entry.name)) {
          traverseDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        const stats = calculateStats(fullPath);
        // Only print stats if the file was successfully processed (not null)
        //if (stats) {
          // Ensure path uses forward slashes for consistency
        //  const normalizedPath = fullPath.replace(/\\\\/g, '/');
        //  console.log(`${normalizedPath}: Zeilen: ${stats.lines}, Zeichen: ${stats.characters}`);
        //}
      }
    });
  } catch (err) {
      // Ignore errors reading directories (e.g. permission errors)
      // console.error(`Fehler beim Lesen des Verzeichnisses ${directoryPath}: ${err.message}`);
  }
}

const projectDirectory = '.'; // Aktuelles Projektverzeichnis
console.log(`Analysiere Verzeichnis: ${path.resolve(projectDirectory)}`);
console.log(`Ignoriere Verzeichnisse: ${[...ignoredDirs].join(', ')}`);
console.log("---");
traverseDirectory(projectDirectory);
console.log("---");

const totalLinesK = (totalLines / 1000).toFixed(2);
const totalCharactersM = (totalCharacters / 1000000).toFixed(2);

console.log(`Gesamt: Zeilen: ${totalLinesK}k, Zeichen: ${totalCharactersM}M`);
console.log("Analyse abgeschlossen.");