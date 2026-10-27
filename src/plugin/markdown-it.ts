import type MarkdownItConstructor from 'markdown-it' with {'resolution-mode': 'import'};

/** Follow the parser installed by the consumer instead of private type paths. */
export type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;
export type StateCore = InstanceType<MarkdownIt['core']['State']>;
export type PluginWithOptions<T> = (md: MarkdownIt, options?: T) => void;
