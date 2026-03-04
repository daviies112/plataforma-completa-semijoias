const fs = require('fs');

const log = fs.readFileSync('tsc_output_v8.txt', 'utf16le');
const lines = log.split('\n');

const files = {};
let currentFile = null;

for (const line of lines) {
  const match = line.match(/^([a-zA-Z0-9_./-]+)\(/);
  if (match) {
    const file = match[1];
    files[file] = (files[file] || 0) + 1;
  }
}

const sorted = Object.entries(files).sort((a, b) => b[1] - a[1]);
for (const [file, count] of sorted) {
  console.log(`${count}\t${file}`);
}
