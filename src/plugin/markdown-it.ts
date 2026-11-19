import type {
    DirectiveBlockState,
    DirectiveInlineState,
    DirectiveParserHost,
} from '@diplodoc/directive';

/** The token operations used by File; reading attributes accepts native 15 numbers. */
export type FileToken = {
    type: string;
    content: string;
    markup: string;
    block: boolean;
    get attrs(): [string, string | number][] | null;
    set attrs(value: [string, string][] | null);
    children: readonly {type: string}[] | null;
    attrSet(name: string, value: string): void;
};

export type FileInlineState<T extends FileToken> = DirectiveInlineState & {
    env: Record<string, unknown>;
    push(type: string, tag: string, nesting: -1 | 0 | 1): T;
};

export type FileCoreState<T extends FileToken> = {
    tokens: T[];
    env: Record<string, unknown>;
};

export type FileRenderer<T extends FileToken> = {renderAttrs(token: T): string};
export type FileHost<
    T extends FileToken,
    C extends FileCoreState<T>,
    B extends DirectiveBlockState,
    I extends FileInlineState<T>,
    R extends FileRenderer<T>,
> = DirectiveParserHost<B, I> & {
    use(plugin: (md: FileHost<T, C, B, I, R>) => void): unknown;
    core: {
        ruler: {
            before(name: string, ruleName: string, rule: (state: C) => void): void;
            push(name: string, rule: (state: C) => void): void;
        };
    };
    renderer: {
        rules: {
            [name: string]:
                | ((tokens: T[], index: number, options: never, env: never, self: R) => string)
                | undefined;
        };
    };
    utils: {escapeHtml(value: string): string};
};

export type FilePlugin<TOptions> = <
    T extends FileToken,
    C extends FileCoreState<T>,
    B extends DirectiveBlockState,
    I extends FileInlineState<T>,
    R extends FileRenderer<T>,
>(
    md: FileHost<T, C, B, I, R>,
    options?: TOptions,
) => void;
