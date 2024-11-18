import {FILE_TOKEN, FileClassName} from './const';

export const fileRenderer: markdownit.PluginSimple = (md) => {
    md.renderer.rules[FILE_TOKEN] = (tokens, idx, _opts, _env, self) => {
        const token = tokens[idx];
        const iconHtml = `<span class="${md.utils.escapeHtml(FileClassName.Icon)}"></span>`;
        return `<a${self.renderAttrs(token)}>${iconHtml}${md.utils.escapeHtml(token.content)}</a>`;
    };
};
