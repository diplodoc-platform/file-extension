import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.spec.ts', 'test/**/*.test.ts'],
        exclude: ['node_modules', 'build'],
        environment: 'node',
        globals: false,
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: false,
        },
    },
});
