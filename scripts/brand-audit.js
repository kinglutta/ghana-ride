/**
 * YENKO RIDE brand audit.
 *
 * Fails the build if legacy competitor branding sneaks back into source,
 * docs, config or UI copy. The terms are assembled at runtime so this file
 * does not itself contain the words it rejects.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const forbidden = ['ube' + 'r', 'lyf' + 't', 'taxi' + 'fy'];
const pattern = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');

const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
});

const files = output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('dist/') && !file.startsWith('.git/'));

const findings = [];

for (const file of files) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;

    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0)) continue; // Skip images, fonts and other binaries.

    bytes.toString('utf8').split(/\r?\n/).forEach((line, index) => {
        if (pattern.test(line)) {
            findings.push(`${file}:${index + 1}: ${line.trim().slice(0, 160)}`);
        }
    });
}

if (findings.length) {
    console.error('YENKO brand audit failed. Replace legacy competitor wording:');
    findings.slice(0, 50).forEach((finding) => console.error(`  ${finding}`));
    if (findings.length > 50) console.error(`  ...and ${findings.length - 50} more`);
    process.exit(1);
}

console.log(`YENKO brand audit passed — ${files.length} files checked, no legacy competitor branding found.`);
