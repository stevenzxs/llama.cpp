import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';

const dictionarySource = fs.readFileSync('src/lib/constants/locales/zh-CN.ts', 'utf8');
const dictionary = ts.transpile(dictionarySource, { module: ts.ModuleKind.CommonJS });
const exports = {};

new Function('exports', dictionary)(exports);
const known = new Set(Object.keys(exports.zhCN));
// One-time source migration. Never runs in the browser or the build pipeline.
const apply = process.argv.includes('--apply');
const texts = new Set();

function visit(node, fn) {
	if (!node || typeof node !== 'object') return;

	if (Array.isArray(node)) {
		for (const child of node) visit(child, fn);

		return;
	}

	fn(node);

	if (
		node.type === 'Attribute' ||
		node.type?.endsWith('Directive') ||
		node.type === 'MustacheTag' ||
		node.type === 'RawMustacheTag'
	)
		return;

	for (const [key, child] of Object.entries(node)) {
		if (!['parent', 'expression', 'context', 'index', 'key', 'value', 'attributes'].includes(key))
			visit(child, fn);
	}
	for (const attribute of node.attributes ?? []) fn(attribute);
}

function scan(directory) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			scan(file);

			continue;
		}

		if (!file.endsWith('.svelte') || /\.stories\.svelte$/.test(file)) continue;

		const source = fs.readFileSync(file, 'utf8');
		const ast = parse(source);
		const edits = [];

		visit(ast.html, (node) => {
			if (node.type === 'Text') {
				const text = node.data.trim();

				if (!known.has(text)) return;

				texts.add(text);
				const raw = source.slice(node.start, node.end);
				const start = node.start + raw.indexOf(raw.trim());

				edits.push({ end: start + raw.trim().length, start, text: `{t(${JSON.stringify(text)})}` });
			} else if (
				node.type === 'Attribute' &&
				['title', 'placeholder', 'aria-label', 'tooltip'].includes(node.name) &&
				node.value?.length === 1 &&
				node.value[0].type === 'Text'
			) {
				const text = node.value[0].data;

				if (!known.has(text)) return;

				texts.add(text);
				edits.push({
					end: node.end,
					start: node.start,
					text: `${node.name}={t(${JSON.stringify(text)})}`
				});
			}
		});
		// Attribute children are visited too; retain only the outer edit.
		const outer = edits.filter(
			(edit) =>
				!edits.some((other) => other !== edit && other.start <= edit.start && other.end >= edit.end)
		);

		if (!apply || outer.length === 0) continue;

		let result = source;

		for (const edit of outer.sort((a, b) => b.start - a.start)) {
			result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
		}

		if (!source.includes("import { t } from '$lib/stores/locale.svelte'")) {
			const script = /<script(?:\s[^>]*)?>/.exec(result);
			const statement = "\n\timport { t } from '$lib/stores/locale.svelte';";

			result = script
				? result.slice(0, script.index + script[0].length) +
					statement +
					result.slice(script.index + script[0].length)
				: `<script lang="ts">${statement}\n</script>\n\n${result}`;
		}

		fs.writeFileSync(file, result);
	}
}

scan('src/lib/components/app');
scan('src/routes');
console.log(JSON.stringify([...texts].sort(), null, 2));
