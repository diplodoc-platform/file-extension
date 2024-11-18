import type {FileOptions} from './plugin';

import {directiveParser, registerInlineDirective} from '@diplodoc/directive';

import {fileRenderer} from './renderer';
import {ENV_FLAG_NAME, FILE_TOKEN, FileClassName, LinkHtmlAttr} from './const';

const ALLOWED_ATTRS: readonly string[] = [
    LinkHtmlAttr.ReferrerPolicy,
    LinkHtmlAttr.Rel,
    LinkHtmlAttr.Target,
    LinkHtmlAttr.Type,
    LinkHtmlAttr.HrefLang,
];

export const fileDirective: markdownit.PluginWithOptions<FileOptions> = (md, opts = {}) => {
    const {fileExtraAttrs} = opts;

    fileRenderer(md);

    md.use(directiveParser());

    registerInlineDirective(md, 'file', (state, params) => {
        if (!params.content || !params.dests) {
            return false;
        }

        const filename = params.content.raw;
        const filelink = params.dests.link || '';

        const token = state.push(FILE_TOKEN, '', 0);
        token.block = false;
        token.markup = ':file';
        token.content = params.content.raw;

        token.attrSet('class', FileClassName.Link);
        token.attrSet(LinkHtmlAttr.Href, filelink);
        token.attrSet(LinkHtmlAttr.Download, filename);

        if (params.attrs) {
            for (const attrName of ALLOWED_ATTRS) {
                if (params.attrs[attrName]) {
                    token.attrSet(attrName, params.attrs[attrName]);
                }
            }
        }

        if (Array.isArray(fileExtraAttrs)) {
            for (const [name, value] of fileExtraAttrs) {
                token.attrSet(name, value);
            }
        }

        state.env ??= {};
        state.env[ENV_FLAG_NAME] = true;

        return true;
    });
};
