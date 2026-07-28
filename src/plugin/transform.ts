import type StateCore from 'markdown-it/lib/rules_core/state_core';

import MarkdownIt from 'markdown-it';

import {type FileOptions, filePlugin} from './plugin';
import {ENV_FLAG_NAME, FILE_TOKEN} from './const';
import {hidden} from './utils';
import {fileDirective} from './directive';

export type PluginOptions = FileOptions & {
    output?: string;
};

export type RuntimeObj = {style: string};

export type TransformOptions = {
    runtime?: string | {style: string};
    bundle?: boolean;
    extraAttrs?: FileOptions['fileExtraAttrs'];
    /**
     * Enables directive syntax of yfm-file.
     *
     * - 'disabled' – directive syntax is disabled.
     * - 'enabled' – directive syntax is enabled; old (curly bracket) syntax is also enabled.
     * - 'only' – enabled only directive syntax; old (curly bracket) syntax is disabled.
     *
     * @default 'disabled'
     */
    directiveSyntax?: 'disabled' | 'enabled' | 'only';
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
        directiveSyntax,
    }: Pick<TransformOptions, 'extraAttrs' | 'onBundle'> & {
        bundle: boolean;
        runtime: {style: string};
        output: string;
        directiveSyntax: NonNullable<TransformOptions['directiveSyntax']>;
    },
) => {
    if (directiveSyntax === 'disabled' || directiveSyntax === 'enabled') {
        filePlugin(md, {fileExtraAttrs: extraAttrs});
    }
    if (directiveSyntax === 'enabled' || directiveSyntax === 'only') {
        fileDirective(md, {fileExtraAttrs: extraAttrs});
    }

    const yfmFileGuard = (state: StateCore) => {
        const tokens = state.tokens;

        for (let i = 0; i < tokens.length - 3; i++) {
            const listClose = tokens[i];
            const inlineToken = tokens[i + 2];
            const {children} = inlineToken;

            if (
                (listClose.type === 'bullet_list_close' ||
                    listClose.type === 'ordered_list_close' ||
                    listClose.type === 'table_close') &&
                tokens[i + 1].type === 'paragraph_open' &&
                inlineToken.type === 'inline' &&
                children !== null &&
                children.length === 1 &&
                children[0].type === FILE_TOKEN
            ) {
                inlineToken.content = '';
            }
        }
    };

    try {
        md.core.ruler.before('curly_attributes', 'yfm_file_guard', yfmFileGuard);
    } catch {
        md.core.ruler.push('yfm_file_guard', yfmFileGuard);
    }

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
    const {bundle = true, directiveSyntax = 'disabled'} = opts;

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
            directiveSyntax,
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
                    directiveSyntax,
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
