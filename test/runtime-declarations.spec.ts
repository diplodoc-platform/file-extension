import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('runtime declaration guard', () => {
    it.each(['\n', '\r\n'])(
        'replaces exactly one stylesheet import with an empty module (%j)',
        (eol) => {
            const dir = mkdtempSync(join(tmpdir(), 'file-declaration-'));
            try {
                mkdirSync(join(dir, 'scripts'));
                mkdirSync(join(dir, 'build/runtime'), {recursive: true});
                copyFileSync(
                    resolve('scripts/fix-runtime-declarations.mjs'),
                    join(dir, 'scripts/fix-runtime-declarations.mjs'),
                );
                const file = join(dir, 'build/runtime/index.d.ts');
                writeFileSync(file, `import './styles/file.scss';${eol}`);
                const result = spawnSync(process.execPath, [
                    join(dir, 'scripts/fix-runtime-declarations.mjs'),
                ]);
                expect(result.status).toBe(0);
                expect(readFileSync(file, 'utf8')).toBe('export {};\n');
            } finally {
                rmSync(dir, {recursive: true, force: true});
            }
        },
    );
    it.each(['export {};\n', "import './styles/file.scss';\nimport './styles/file.scss';\n"])(
        'fails closed for unexpected declaration contents',
        (input) => {
            const dir = mkdtempSync(join(tmpdir(), 'file-declaration-'));
            try {
                mkdirSync(join(dir, 'scripts'));
                mkdirSync(join(dir, 'build/runtime'), {recursive: true});
                copyFileSync(
                    resolve('scripts/fix-runtime-declarations.mjs'),
                    join(dir, 'scripts/fix-runtime-declarations.mjs'),
                );
                const file = join(dir, 'build/runtime/index.d.ts');
                writeFileSync(file, input);
                const result = spawnSync(process.execPath, [
                    join(dir, 'scripts/fix-runtime-declarations.mjs'),
                ]);
                expect(result.status).not.toBe(0);
                expect(readFileSync(file, 'utf8')).toBe(input);
            } finally {
                rmSync(dir, {recursive: true, force: true});
            }
        },
    );
});
