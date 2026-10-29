import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {transform} from '../src/plugin';

describe('file directive attribute compatibility', () => {
    it('retains scalar attributes, metadata and token values', () => {
        const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'enabled'}));
        const env: Record<string, unknown> = {};
        const tokens = md.parse(':file[doc](doc.txt){rel=external target=_blank}', env);
        const file = tokens[1].children?.[0];
        expect(file?.attrs).toEqual([
            ['class', 'yfm-file'],
            ['href', 'doc.txt'],
            ['download', 'doc'],
            ['rel', 'external'],
            ['target', '_blank'],
        ]);
        expect(md.renderer.render(tokens, md.options, env)).toContain(
            'rel="external" target="_blank"',
        );
        expect(env).toEqual({'has-yfm-file': true, meta: {style: ['_assets/file-extension.css']}});
    });
    it('coerces duplicate allowed values to their existing comma-separated rendering', () => {
        const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'only'}));
        const tokens = md.parse(':file[doc](doc.txt){rel=external rel=help}', {});
        expect(tokens[1].children?.[0].attrGet('rel')).toBe('external,help');
        expect(md.renderer.render(tokens, md.options, {})).toContain('rel="external,help"');
    });
    it('escapes duplicate attribute values containing HTML characters', () => {
        const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'only'}));
        expect(md.render(':file[doc](doc.txt){rel="x&y" rel=z}')).toContain('rel="x&amp;y,z"');
    });
    it('keeps directive syntax disabled by default', () => {
        const md = new MarkdownIt().use(transform({bundle: false}));
        expect(md.render(':file[doc](doc.txt){rel=external}')).not.toContain('yfm-file');
    });
});

it('preserves URL and email linkification in the development graph', () => {
    const html = new MarkdownIt({linkify: true}).render(
        'Visit https://example.com/a?q=1 and hello@example.com.',
    );
    expect(html).toBe(
        '<p>Visit <a href="https://example.com/a?q=1">https://example.com/a?q=1</a> and <a href="mailto:hello@example.com">hello@example.com</a>.</p>\n',
    );
});
