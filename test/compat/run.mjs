import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceRoot = resolve(process.env.FILE_PACKAGE_EVIDENCE_DIR || tmpdir());
mkdirSync(evidenceRoot, {recursive: true});
const evidence = mkdtempSync(join(evidenceRoot, 'file-package-'));
const tmp = mkdtempSync(join(tmpdir(), 'file-fixture-'));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run with npm run test:package');
const report = {node: process.version, evidence, fixtures: [], result: 'failed'};

function run(command, args, cwd, label, allowFailure = false) {
    const result = spawnSync(command, args, {cwd, encoding: 'utf8'});
    writeFileSync(join(evidence, `${label}.stdout.log`), result.stdout || '');
    writeFileSync(join(evidence, `${label}.stderr.log`), result.stderr || '');
    if (result.error || (!allowFailure && result.status !== 0)) {
        throw result.error || new Error(`${label} failed: ${result.status}`);
    }
    return result;
}
function files(dir, base = dir) {
    return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? files(path, base) : [relative(base, path)];
    });
}
const hash = (bytes) => createHash('sha512').update(bytes).digest('base64');

try {
    run(process.execPath, [npm, 'run', 'build'], root, 'build');
    const pack = JSON.parse(
        run(process.execPath, [npm, 'pack', '--json', '--pack-destination', evidence], root, 'pack')
            .stdout,
    )[0];
    const archive = join(evidence, pack.filename);
    if (pack.integrity !== `sha512-${hash(readFileSync(archive))}`)
        throw new Error('Archive integrity mismatch');
    for (const version of ['13.0.2', '15.0.3']) {
        const dir = join(tmp, version);
        mkdirSync(dir);
        copyFileSync(archive, join(dir, pack.filename));
        for (const name of [
            'native.mts',
            'native.cts',
            'reexport.cts',
            'reexport.mts',
            'runtime.cjs',
        ])
            copyFileSync(join(root, 'test/compat', `${name}.template`), join(dir, name));
        if (version === '13.0.2') {
            for (const name of ['mixed.mts', 'mixed.cts'])
                copyFileSync(join(root, 'test/compat', `${name}.template`), join(dir, name));
        }
        const dependencies = {
            '@diplodoc/file-extension': `file:./${pack.filename}`,
            '@types/node': '24.10.0',
            'markdown-it': version,
            typescript: '6.0.3',
        };
        if (version === '13.0.2') {
            dependencies['@types/markdown-it'] = '13.0.9';
            dependencies['markdown-it-15'] = 'npm:markdown-it@15.0.3';
        }
        const manifest = {
            private: true,
            type: 'module',
            ...(version === '13.0.2' ? {overrides: {'markdown-it': {'linkify-it': '5.0.2'}}} : {}),
            dependencies,
        };
        writeFileSync(join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
        run(process.execPath, [npm, 'install'], dir, `${version}-install`);
        run(process.execPath, [npm, 'ci'], dir, `${version}-ci`);
        const lock = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8'));
        if (lock.packages['node_modules/@diplodoc/file-extension'].integrity !== pack.integrity)
            throw new Error('Lock integrity mismatch');
        const extracted = join(dir, 'extracted');
        mkdirSync(extracted);
        run('tar', ['-xzf', archive, '-C', extracted], dir, `${version}-extract`);
        const packed = join(extracted, 'package'),
            installed = join(dir, 'node_modules/@diplodoc/file-extension');
        const a = files(packed).sort(),
            b = files(installed).sort();
        if (
            JSON.stringify(a) !== JSON.stringify(b) ||
            a.some(
                (name) =>
                    hash(readFileSync(join(packed, name))) !==
                    hash(readFileSync(join(installed, name))),
            )
        )
            throw new Error('Installed bytes mismatch');
        const config = {
            compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                strict: true,
                skipLibCheck: false,
                noEmit: true,
                types: ['node'],
            },
            include: [
                'native.mts',
                'native.cts',
                'reexport.cts',
                'reexport.mts',
                'node_modules/@diplodoc/file-extension/build/**/*.d.ts',
            ],
        };
        if (version === '13.0.2') config.include.push('mixed.mts', 'mixed.cts');
        writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(config, null, 2));
        const tsc = join(dir, 'node_modules/typescript/bin/tsc');
        run(process.execPath, [tsc, '-p', 'tsconfig.json'], dir, `${version}-all-dts`);
        run(
            process.execPath,
            [
                tsc,
                '--ignoreConfig',
                '--strict',
                '--skipLibCheck',
                'false',
                '--module',
                'NodeNext',
                '--moduleResolution',
                'NodeNext',
                '--target',
                'ES2022',
                '--declaration',
                '--emitDeclarationOnly',
                '--outDir',
                'declarations',
                'reexport.cts',
                'reexport.mts',
            ],
            dir,
            `${version}-reexport`,
        );
        for (const ext of ['cts', 'mts']) {
            const reexport = readFileSync(join(dir, `declarations/reexport.d.${ext}`), 'utf8');
            if (!reexport.includes('@diplodoc/file-extension') || reexport.includes('/build/'))
                throw new Error('Nonportable reexport');
            copyFileSync(
                join(dir, `declarations/reexport.d.${ext}`),
                join(evidence, `${version}-reexport.d.${ext}`),
            );
        }
        run(process.execPath, ['runtime.cjs'], dir, `${version}-runtime`);
        run(
            process.execPath,
            [
                '--input-type=module',
                '-e',
                "import * as runtime from '@diplodoc/file-extension/runtime'; if (Object.keys(runtime.default).length || Object.keys(runtime).some((key) => key !== 'default' && key !== 'module.exports')) throw Error('unexpected CJS runtime namespace');",
            ],
            dir,
            `${version}-runtime-esm`,
        );
        copyFileSync(join(dir, 'package.json'), join(evidence, `${version}-package.json`));
        copyFileSync(
            join(dir, 'package-lock.json'),
            join(evidence, `${version}-package-lock.json`),
        );
        report.fixtures.push({version, files: a.length, allDts: true, runtime: true});
    }
    report.integrity = pack.integrity;
    report.archive = pack.filename;
    report.sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
    report.result = 'passed';
} finally {
    writeFileSync(join(evidence, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    rmSync(tmp, {recursive: true, force: true});
    process.stdout.write(`Package evidence: ${evidence}\n`);
}
