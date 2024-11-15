import MarkdownIt from 'markdown-it';
import transform from '@diplodoc/transform';

import {type TransformOptions, transform as fileTransformer} from '../../src/plugin';

function html(markup: string, opts?: TransformOptions) {
    return transform(markup, {
        // override the default markdown-it-attrs delimiters,
        // to make it easier to check html for non-valid file markup
        leftDelimiter: '[',
        rightDelimiter: ']',
        plugins: [fileTransformer({bundle: false, ...opts})],
    }).result.html;
}

function meta(markup: string, opts?: TransformOptions) {
    return transform(markup, {
        leftDelimiter: '[',
        rightDelimiter: ']',
        plugins: [fileTransformer({bundle: false, ...opts})],
    }).result.meta;
}

function tokens(markup: string, opts?: TransformOptions) {
    const md = new MarkdownIt().use(fileTransformer({bundle: false, ...opts}));
    return md.parse(markup, {});
}

describe('File extension - plugin', () => {
    it('should render file', () => {
        expect(html('{% file src="../file" name="file.txt" %}')).toMatchSnapshot();
    });

    it('should ignore file markup without params', () => {
        expect(html('{% file %}')).toBe('<p>{% file %}</p>\n');
    });

    it('should not render file without all required attrs', () => {
        expect(html('{% file src="../file" %}')).toBe('<p>{% file src="../file" %}</p>\n');
        expect(html('{% file name="file.txt" %}')).toBe('<p>{% file name="file.txt" %}</p>\n');
    });

    it('should render file with text before', () => {
        expect(html('download it {% file src="../file" name="file.txt" %}')).toMatchSnapshot();
    });

    it('should render file with text after', () => {
        expect(
            html('{% file src="../file" name="file.txt" %} don\'t download it'),
        ).toMatchSnapshot();
    });

    it('should render file between text', () => {
        expect(html('text1 {% file src="../file" name="file.txt" %} 2text')).toMatchSnapshot();
    });

    it('should map all specific file attrs to link html attrs', () => {
        expect(html('{% file src="../file2" name="file2.txt" lang="en" %}')).toMatchSnapshot();
    });

    it('should pass allowed link html attrs', () => {
        expect(
            html(
                '{% file src="../file1" name="file1.txt" referrerpolicy="origin" rel="help" target="_top" type="text/css" %}',
            ),
        ).toMatchSnapshot();
    });

    it('should ignore unknown attrs', () => {
        expect(
            html('{% file src="../file" name="file.txt" foo="1" bar="2" baz="3" %}'),
        ).toMatchSnapshot();
    });

    it('should add extra attrs', () => {
        expect(
            html('{% file src="../file" name="file.txt" %}', {
                extraAttrs: [['data-yfm-file', 'yes']],
            }),
        ).toMatchSnapshot();
    });

    it('should parse attrs with single quotes', () => {
        expect(html("{% file src='index.txt' name='index.html' %}")).toMatchSnapshot();
    });

    it('should render with file markup in attributes', () => {
        expect(
            html('{% file src="in%}dex.txt" name="{% file src=\'a\' name=\'b\' %}" %}'),
        ).toMatchSnapshot();
    });

    it('should render file with different order of attrs', () => {
        expect(
            html('{% file type="text/html" name="page.html" src="../index.html" %}'),
        ).toMatchSnapshot();
    });

    it('should ignore additional special characters', () => {
        expect(html('{% {% file src="index.txt" name="index.html" %} %}')).toMatchSnapshot();
    });

    it('should ignore additional file markup', () => {
        expect(html('{% file {% file src="index.txt" name="index.html" %} %}')).toMatchSnapshot();
    });

    it('should allow quoutes in attribute value', () => {
        expect(html('{% file src="ind\'ex.txt" name=\'ind"ex.html\' %}')).toMatchSnapshot();
    });

    it('should render file with extra spaces around attrs', () => {
        expect(
            html('{% file  src="index.txt"   name="index.html"   type="text/html"  %}'),
        ).toMatchSnapshot();
    });

    it('should not render file without spaces around attrs', () => {
        expect(html('{% file src="index.txt"name="index.html"type="text/html" %}')).toBe(
            `<p>{% file src="index.txt"name="index.html"type="text/html" %}</p>\n`,
        );
    });

    it('should not render file with no spaces near borders', () => {
        expect(html("{%file src='index.txt' name='index.html'%}")).toBe(
            `<p>{%file src='index.txt' name='index.html'%}</p>\n`,
        );
    });

    it('should not add meta if file not parsed', () => {
        expect(meta('parapraph')).toBeUndefined();
    });

    it('should add default style assets to meta', () => {
        expect(meta('{% file src="../file" name="file.txt" %}')).toStrictEqual({
            style: ['_assets/file-extension.css'],
        });
    });

    it('should override style assets name', () => {
        expect(
            meta('{% file src="../file" name="file.txt" %}', {runtime: 'file-ext'}),
        ).toStrictEqual({style: ['file-ext']});
    });

    it('should override style assets name 2', () => {
        expect(
            meta('{% file src="../file" name="file.txt" %}', {runtime: {style: 'yfm-file'}}),
        ).toStrictEqual({style: ['yfm-file']});
    });

    it('should not call onBundle', () => {
        const onBundle = jest.fn(() => {});
        html('text', {bundle: true, onBundle});
        expect(onBundle).not.toHaveBeenCalled();
    });

    it('should call onBundle', () => {
        const onBundle = jest.fn(() => {});
        html('{% file src="../file" name="file.txt" %}', {bundle: true, onBundle});
        expect(onBundle).toHaveBeenCalled();
    });

    it('should generate yfm-file token', () => {
        expect(tokens('{% file src="../file" name="file.txt" %}')).toMatchSnapshot();
    });

    it('should add extra attrs by passing them to plugin options', () => {
        const md = new MarkdownIt();
        const filePlugin = fileTransformer({bundle: false});
        filePlugin(md, {
            fileExtraAttrs: [
                ['data-yfm', '1'],
                ['data-file', '2'],
            ],
        });
        expect(md.render('{% file src="../file" name="file.txt" %}')).toMatchSnapshot();
    });
});
