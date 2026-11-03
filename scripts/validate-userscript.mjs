import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../windy-enhanced.user.js', import.meta.url), 'utf8');
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

const header = script.match(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m)?.[0];
assert.ok(header, 'Cabeçalho UserScript não encontrado.');

function metadata(name) {
    return header.match(new RegExp(`^// @${name}\\s+(.+)$`, 'm'))?.[1].trim();
}

const version = metadata('version');
assert.match(version ?? '', /^\d+\.\d+\.\d+$/, '@version deve usar SemVer (x.y.z).');
assert.equal(packageJson.version, version, 'package.json e @version devem coincidir.');
assert.ok(changelog.includes(`## [${version}]`), `CHANGELOG.md não contém a versão ${version}.`);

for (const field of ['name', 'description', 'match', 'license', 'homepageURL', 'supportURL', 'downloadURL', 'updateURL']) {
    assert.ok(metadata(field), `Metadado obrigatório ausente: @${field}.`);
}

for (const field of ['homepageURL', 'supportURL', 'downloadURL', 'updateURL']) {
    const url = new URL(metadata(field));
    assert.equal(url.protocol, 'https:', `@${field} deve usar HTTPS.`);
}

assert.ok(!script.includes('\uFFFD'), 'O userscript contém caracteres de substituição Unicode.');
console.log(`Windy Enhanced v${version}: metadados e documentação validados.`);
