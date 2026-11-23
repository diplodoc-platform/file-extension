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

export const filePlugin: markdownit.PluginWithOptions<FileOptions> = (md, opts) => {
    fileRenderer(md);

    md.inline.ruler.push(RULE_NAME, (state, silent) => {
        if (state.src.substring(state.pos, state.pos + PREFIX_LENGTH) !== PREFIX) {
            return false;
        }

        // the rest of line after '{% file '
        const searchStr = state.src.slice(state.pos + PREFIX_LENGTH, state.posMax);
        // loking for pattern 'src="..." name="..." etc="value" %}'
        const matchResult = searchStr.match(/^((?:\s*\w+=(?:"[^"]+"|'[^']+')\s)+)\s*%}/);
        if (!matchResult) {
            return false;
        }

        const paramsGroupLength = matchResult[0].length; // '(src="..." name="...")'.length
        const paramsStr = matchResult[1]; // 'src="..." name="..."'

        const attrsObj: Record<string, string> = {};
        let nameStart = 0;

        for (const match of paramsStr.matchAll(/(\w+)=(?:"([^"]+)"|'([^']+)')/g)) {
            const [, key, doubleQuoted, singleQuoted] = match;
            if (KNOWN_ATTRS.includes(key)) {
                attrsObj[key] = doubleQuoted ?? singleQuoted;
            }

            if (key === FileSpecialAttr.Name) {
                // The key, equals sign and opening quote precede the value.
                nameStart = state.pos + PREFIX_LENGTH + match.index + key.length + 2;
            }
        }

        const hasAllRequiredAttrs = REQUIRED_ATTRS.every((attr) => attr in attrsObj);
        if (!hasAllRequiredAttrs) {
            return false;
        }

        const end = state.pos + PREFIX_LENGTH + paramsGroupLength;

        if (!silent) {
            const token = state.push(FILE_TOKEN, '', 0);
            token.block = false;
            token.markup = PREFIX;
            token.content = attrsObj[FileSpecialAttr.Name];
            token.meta = {
                fileMarkup: {
                    beforeName: state.src.slice(state.pos, nameStart),
                    afterName: state.src.slice(nameStart + token.content.length, end),
                },
            };
            token.attrs = Object.entries(attrsObj);
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
