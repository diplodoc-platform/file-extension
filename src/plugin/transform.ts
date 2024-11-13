import MarkdownIt from 'markdown-it';

import {type FileOptions, filePlugin} from './plugin';
import {ENV_FLAG_NAME} from './const';
import {hidden} from './utils';

export type PluginOptions = FileOptions & {
    output?: string;
};

export type RuntimeObj = {style: string};

export type TransformOptions = {
    runtime?: string | {style: string};
    bundle?: boolean;
    extraAttrs?: FileOptions['fileExtraAttrs'];
    /** @internal */
    onBundle?: (env: {bundled: Set<string>}, output: string, runtime: RuntimeObj) => void;
};

const registerTransform = (
    md: MarkdownIt,
    {
        extraAttrs,
        bundle,
        onBundle,
        runtime,
        output,
    }: Pick<TransformOptions, 'extraAttrs' | 'onBundle'> & {
        bundle: boolean;
        runtime: {style: string};
        output: string;
    },
) => {
    filePlugin(md, {fileExtraAttrs: extraAttrs});

    md.core.ruler.push('yfm_file_after', ({env}) => {
        if (env?.[ENV_FLAG_NAME]) {
            env.meta ||= {};
            env.meta.style ||= [];
            env.meta.style.push(runtime.style);

            if (bundle && onBundle) {
                hidden(env, 'bundled', new Set<string>());
                onBundle(env, output, runtime);
            }
        }
    });
};

export const transform = (opts: TransformOptions = {}) => {
    const {bundle = true} = opts;

    if (bundle && typeof opts.runtime === 'string') {
        throw new TypeError('Option `runtime` should be record when `bundle` is enabled.');
    }

    const runtime: RuntimeObj =
        typeof opts?.runtime === 'object'
            ? opts.runtime
            : {style: opts?.runtime ?? '_assets/file-extension.css'};

    const plugin: MarkdownIt.PluginWithOptions<PluginOptions> = (
        md,
        {output = '.', fileExtraAttrs} = {},
    ) => {
        registerTransform(md, {
            bundle,
            runtime,
            output,
            onBundle: opts.onBundle,
            extraAttrs: fileExtraAttrs ?? opts.extraAttrs,
        });
    };

    Object.assign(plugin, {
        collect(input: string, {destRoot = '.'}: InputOptions) {
            const md = new MarkdownIt().use((md: MarkdownIt) => {
                registerTransform(md, {
                    bundle,
                    runtime,
                    output: destRoot,
                    onBundle: opts.onBundle,
                    extraAttrs: opts.extraAttrs,
                });
            });

            md.parse(input, {});
        },
    });

    return plugin;
};

type InputOptions = {
    destRoot: string;
};
