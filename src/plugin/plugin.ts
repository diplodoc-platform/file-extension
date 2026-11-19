import type {FilePlugin} from './markdown-it';

import {
    ENV_FLAG_NAME,
    FILE_TOKEN,
    FILE_TO_LINK_ATTRS_MAP,
    FileClassName,
    FileSpecialAttr,
    KNOWN_ATTRS,
    PREFIX,
    PREFIX_LENGTH,
    REQUIRED_ATTRS,
    RULE_NAME,
} from './const';
import {fileRenderer} from './renderer';

export type FileOptions = {
    fileExtraAttrs?: [string, string][];
};

function parseAttributes(source: string, start: number) {
    const attrs: Record<string, string> = {};
    const attribute = /\s*(\w+)=(?:"([^"]+)"|'([^']+)')\s/y;
    attribute.lastIndex = start;

    let nameStart = 0;
    let end = start;
    for (let match = attribute.exec(source); match; match = attribute.exec(source)) {
        const [raw, key, doubleQuoted, singleQuoted] = match;
        end = match.index + raw.length;

        if (KNOWN_ATTRS.includes(key)) {
            attrs[key] = doubleQuoted ?? singleQuoted;
        }

        if (key === FileSpecialAttr.Name) {
            // Skip the equals sign and opening quote.
            nameStart = match.index + raw.indexOf('=') + 2;
        }
    }

    const closing = /^\s*%}/.exec(source.slice(end));
    if (!closing || !REQUIRED_ATTRS.every((key) => key in attrs)) {
        return;
    }

    return {attrs, nameStart, end: end + closing[0].length};
}

export const filePlugin: FilePlugin<FileOptions> = (md, opts) => {
    fileRenderer(md);

    md.inline.ruler.push(RULE_NAME, (state, silent) => {
        if (state.src.substring(state.pos, state.pos + PREFIX_LENGTH) !== PREFIX) {
            return false;
        }

        const parsed = parseAttributes(state.src.slice(0, state.posMax), state.pos + PREFIX_LENGTH);
        if (!parsed) {
            return false;
        }

        const {attrs, nameStart, end} = parsed;

        if (!silent) {
            const token = state.push(FILE_TOKEN, '', 0);
            token.block = false;
            token.markup = PREFIX;
            token.content = attrs[FileSpecialAttr.Name];
            token.meta = {
                fileMarkup: {
                    beforeName: state.src.slice(state.pos, nameStart),
                    afterName: state.src.slice(nameStart + token.content.length, end),
                },
            };
            token.attrs = Object.entries(attrs);
            token.attrSet('class', FileClassName.Link);

            for (const attr of token.attrs) {
                if (attr[0] in FILE_TO_LINK_ATTRS_MAP) {
                    attr[0] = FILE_TO_LINK_ATTRS_MAP[attr[0] as FileSpecialAttr];
                }
            }

            if (Array.isArray(opts?.fileExtraAttrs)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                token.attrs.push(...opts!.fileExtraAttrs);
            }
        }

        state.pos = end;

        state.env ??= {};
        state.env[ENV_FLAG_NAME] = true;

        return true;
    });
};
