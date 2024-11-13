import {type RuntimeObj, type TransformOptions, transform as baseTransform} from './transform';

export * from './index';

const onBundle: TransformOptions['onBundle'] = (env, output, runtime) => {
    copyRuntime({runtime, output}, env.bundled);
};

export const transform: typeof baseTransform = (opts) => {
    return baseTransform({onBundle, ...opts});
};

function copyRuntime({runtime, output}: {runtime: RuntimeObj; output: string}, cache: Set<string>) {
    const PATH_TO_RUNTIME = '../runtime';
    const {join, resolve} = require('node:path');
    const runtimeFiles = {
        // 'index.js': runtime.script,
        'index.css': runtime.style,
    };
    for (const [originFile, outputFile] of Object.entries(runtimeFiles)) {
        const file = join(PATH_TO_RUNTIME, originFile);
        if (!cache.has(file)) {
            cache.add(file);
            copy(resolve(__dirname, file), join(output, outputFile));
        }
    }
}

export function copy(from: string, to: string) {
    const {mkdirSync, copyFileSync} = require('node:fs');
    const {dirname} = require('node:path');

    mkdirSync(dirname(to), {recursive: true});
    copyFileSync(from, to);
}
