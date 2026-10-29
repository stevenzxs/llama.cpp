import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import * as prettier from 'prettier';

const tracked = execFileSync('git', ['diff', '--name-only', '--', 'src', 'tests', 'scripts'], {
	encoding: 'utf8'
});
const added = execFileSync(
	'git',
	['ls-files', '--others', '--exclude-standard', '--', 'src', 'tests', 'scripts'],
	{
		encoding: 'utf8'
	}
);
const files = [...new Set((tracked + '\n' + added).trim().split(/\r?\n/))]
	.map((file) => file.replace(/^tools\/ui\//, ''))
	.filter((file) => /\.(svelte|ts|mjs)$/.test(file));
const eslint = new ESLint({ fix: true });
const results = await eslint.lintFiles(files);

await ESLint.outputFixes(results);
const formatter = await eslint.loadFormatter('stylish');

console.log(formatter.format(results));
for (const file of files) {
	const config = await prettier.resolveConfig(file);
	const source = await fs.readFile(file, 'utf8');

	await fs.writeFile(file, await prettier.format(source, { ...config, filepath: file }));
}
console.log(`Formatted and checked ${files.length} changed UI files.`);

if (results.some((result) => result.errorCount > 0)) process.exitCode = 1;
