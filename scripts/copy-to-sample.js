const fs = require('fs');
const path = require('path');

const projectDir = path.resolve('.');
const { name: libraryName } = require('../package.json');
const sampleRoot = path.resolve('sample');

for (const sampleEntry of fs.readdirSync(sampleRoot, { withFileTypes: true })) {
  if (!sampleEntry.isDirectory()) {
    continue;
  }

  const sample = sampleEntry.name;
  const targetDir = path.join(sampleRoot, sample, 'node_modules', libraryName);
  const targetRealDir = fs.existsSync(targetDir)
    ? fs.realpathSync(targetDir)
    : targetDir;

  if (targetRealDir === projectDir) {
    console.log(
      `Skipped '${libraryName}' copy to 'sample/${sample}' because it points to project root`,
    );
    continue;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync('dist', path.join(targetDir, 'dist'), {
    recursive: true,
    force: true,
  });
  fs.copyFileSync('package.json', path.join(targetDir, 'package.json'));

  console.log(`Copied '${libraryName}' to 'sample/${sample}/node_modules'`);
}
