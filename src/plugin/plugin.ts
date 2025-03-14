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

        // find pairs of key="foo" or key='bar'
        const params = paramsStr.match(/\w+=(?:"[^"]+"|'[^']+')/g);
        if (!params) {
            return false;
        }

        const attrsObj: Record<string, string> = {};
        params.forEach((param) => {
            const indexKey = param.indexOf('=');
            const key = param.slice(0, indexKey);
            const value = param.slice(indexKey + 2, -1);
            if (KNOWN_ATTRS.includes(key) && value) {
                attrsObj[key] = value;
            }
        });

        const hasAllRequiredAttrs = REQUIRED_ATTRS.every((attr) => attr in attrsObj);
        if (!hasAllRequiredAttrs) {
            return false;
        }

        if (!silent) {
            const token = state.push(FILE_TOKEN, '', 0);
            token.block = false;
            token.markup = PREFIX;
            token.content = attrsObj[FileSpecialAttr.Name];
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

        state.pos = state.pos + PREFIX_LENGTH + paramsGroupLength;

        state.env ??= {};
        state.env[ENV_FLAG_NAME] = true;

        return true;
    });
};
