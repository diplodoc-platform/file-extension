# AGENTS.md

This file contains instructions for AI agents working with the `@diplodoc/file-extension` project.

## Common Rules and Standards

**Important**: This package follows common rules and standards defined in the Diplodoc metapackage. When working in metapackage mode, refer to:

- **`.agents/style-and-testing.md`** in the metapackage root for:
  - Code style guidelines
  - **Language requirements** (commit messages, comments, docs MUST be in English)
  - Commit message format (Conventional Commits)
  - Pre-commit hooks rules (**CRITICAL**: Never commit with `--no-verify`)
  - Testing standards
  - Documentation requirements
- **`.agents/core.md`** for core concepts
- **`.agents/monorepo.md`** for workspace and dependency management
- **`.agents/dev-infrastructure.md`** for build and CI/CD

**Note**: In standalone mode (when this package is used independently), these rules still apply. If you need to reference the full documentation, check the [Diplodoc metapackage repository](https://github.com/diplodoc-platform/diplodoc).

## Project Description

`@diplodoc/file-extension` is a Diplodoc platform extension that provides file links in documentation. It includes both a MarkdownIt transform plugin and a runtime component for styling and behavior.

**Key Features**:

- MarkdownIt transform plugin for processing file directives in YFM
- Runtime component for file link styling
- SCSS styles for file appearance
- Support for file markup syntax (`{% file src="..." name="..." %}`)
- Support for directive syntax (`:file[name](url)`)
- File metadata collection (for asset bundling)

**Primary Use Case**: Enables documentation authors to create downloadable file links that can be styled and bundled as assets during documentation generation.

## Project Structure

### Main Directories

- `src/` — source code
  - `plugin/` — MarkdownIt transform plugin
    - Core plugin implementation and transformation logic
    - Directive syntax support
    - File markup parsing and rendering
    - Asset bundling integration
  - `runtime/` — browser runtime component
    - Runtime entry point
    - Styles (SCSS) for file links
- `tests/` — test suite (separate package)
  - Unit tests for plugin functionality
  - Snapshot tests for HTML output
- `build/` — compiled output (generated)
  - `plugin/` — compiled plugin code
  - `runtime/` — compiled runtime code
- `esbuild/` — build configuration
  - esbuild configuration for bundling

### Configuration Files

- `package.json` — package metadata and dependencies
- `tsconfig.json` — TypeScript configuration (development)
- `tsconfig.publish.json` — TypeScript configuration (for publishing)
- `CHANGELOG.md` — change log (managed by release-please)
- `CONTRIBUTING.md` — contribution guidelines

## Tech Stack

This package follows the standard Diplodoc platform tech stack. See `.agents/dev-infrastructure.md` and `.agents/style-and-testing.md` in the metapackage root for detailed information.

**Package-specific details**:

- **Language**: TypeScript
- **Build**: esbuild for bundling, tsc for type declarations
- **Testing**: Vitest (to be migrated from Jest)
- **Styling**: SCSS (compiled to CSS)
- **Dependencies**:
  - `@diplodoc/directive` — directive parsing utilities
- **Dev Dependencies**:
  - `@diplodoc/lint` — linting infrastructure
  - `@diplodoc/tsconfig` — TypeScript configuration
  - `esbuild` — fast bundler
  - `esbuild-sass-plugin` — SCSS compilation
  - `markdown-it` — Markdown parser (peer dependency)

## Usage Modes

This package can be used in two different contexts:

### 1. As Part of Metapackage (Workspace Mode)

When `@diplodoc/file-extension` is part of the Diplodoc metapackage:

- Located at `extensions/file/` in the metapackage
- Linked via npm workspaces
- Dependencies are shared from metapackage root `node_modules`
- Can be developed alongside other packages
- Changes are immediately available to other packages via workspace linking

**Development in Metapackage**:

```bash
# From metapackage root
cd extensions/file

# Install dependencies (from root)
npm install

# Build package
npm run build

# Run unit tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### 2. Standalone Mode

When `@diplodoc/file-extension` is used as a standalone npm package:

- Installed via `npm install @diplodoc/file-extension`
- All dependencies must be installed locally
- Can be used in any Node.js project

**Usage in Standalone Mode**:

```bash
# Install
npm install @diplodoc/file-extension

# Use in code
import {transform} from '@diplodoc/file-extension';
import '@diplodoc/file-extension/runtime';
```

## Build System

This package uses **esbuild** for bundling JavaScript and TypeScript, and **TypeScript compiler (tsc)** for generating type declarations.

### Build Process

1. **`build:js`** — Bundles plugin and runtime code using esbuild
   - Outputs to `build/plugin/` and `build/runtime/`
   - Compiles TypeScript and SCSS
   - Creates ESM and CJS bundles

2. **`build:declarations`** — Generates TypeScript declaration files
   - Uses `tsc` with `tsconfig.publish.json`
   - Outputs `.d.ts` files to `build/`

3. **`build`** — Runs both build steps in parallel

### Build Outputs

- `build/plugin/` — Compiled plugin code (ESM and CJS)
- `build/runtime/` — Compiled runtime code and styles (CSS)

## Extension Integration

This extension integrates with `@diplodoc/transform` as a plugin:

```typescript
import {transform} from '@diplodoc/file-extension';
import transformYfm from '@diplodoc/transform';

const {result} = transformYfm(markup, {
  plugins: [transform({bundle: false})],
});
```

The extension provides:

- Plugin transform function for MarkdownIt
- Runtime styles via `@diplodoc/file-extension/runtime`
- TypeScript types for options

## Testing

The package has unit tests at the package root (metapackage-aligned):

- **Location**: `test/` directory
- **Framework**: Vitest
- **Test files**: `*.spec.ts`
- **Snapshots**: `test/__snapshots__/`
- **No dependency on `@diplodoc/transform`**: tests use MarkdownIt and the file plugin only.

**Test Commands**:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

**Test Structure**:

- Tests for file markup parsing
- Tests for directive syntax
- Tests for HTML rendering
- Tests for metadata collection
- Snapshot tests for HTML output

## Linting and Code Quality

Linting is configured via `@diplodoc/lint`:

- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Stylelint for SCSS
- Git hooks via Husky
- Pre-commit checks via lint-staged

Configuration files are automatically managed by `@diplodoc/lint`:

- `.eslintrc.js`
- `.prettierrc.js`
- `.stylelintrc.js`
- `.editorconfig`
- `.lintstagedrc.js`
- `.husky/pre-commit`
- `.husky/commit-msg`

**Lint Commands**:

```bash
# Update lint configurations
npm run lint

# Fix linting issues
npm run lint:fix

# Pre-commit hook (runs automatically)
npm run pre-commit
```

## Important Notes

1. **Metapackage vs Standalone**: This package can be used both as part of the metapackage (workspace mode) and as a standalone npm package. All scripts must work in both contexts.

2. **Tests Directory**: Tests are in `test/` at package root. Run `npm test` from the package directory.

3. **Build Outputs**: The package builds to `build/` directory. This directory should be excluded from version control and TypeScript type checking.

4. **package.json Maintenance**: Periodically check that `package.json` fields (description, repository URL, bugs URL, etc.) are accurate and up-to-date. Verify that dependency versions are current and compatible with the project standards.

## CI/CD

The package includes GitHub Actions workflows:

- **quality.yaml**: Runs tests and linting
- **release.yaml**: Publishes package to npm when a release is created
- **tests.yaml**: Runs unit tests

### Release Process

The package uses **release-please** for automated versioning and publishing:

1. **Release-please workflow** (if configured):
   - Runs on push to `master`
   - Analyzes conventional commits to determine version bumps
   - Creates release PRs with updated version and CHANGELOG.md

2. **Publish workflow** (`.github/workflows/release.yaml`):
   - Triggers automatically when a release is created
   - Runs tests and build
   - Publishes to npm with provenance

**Version Bump Rules**:

- `feat`: Minor version bump
- `fix`: Patch version bump
- Breaking changes (e.g., `feat!: breaking change`): Major version bump
- `chore`, `docs`, `refactor`: No version bump (unless breaking)

## GitHub Integration

- **Issue templates**: Bug reports and feature requests (`.github/ISSUE_TEMPLATE/`)
- **Pull request template**: Standardized PR format (`.github/pull_request_template.md`)
- **CODEOWNERS**: Code ownership configuration (`CODEOWNERS`)

## Documentation Files

- **README.md**: Package documentation with usage examples
- **CHANGELOG.md**: Change log (managed by release-please)
- **CONTRIBUTING.md**: Contribution guidelines and development workflow
- **AGENTS.md**: This file - guide for AI coding agents
- **LICENSE**: MIT license

## Additional Resources

- Metapackage `.agents/` - Platform-wide agent documentation
- `@diplodoc/lint` documentation - Linting and formatting setup
- `@diplodoc/tsconfig` - TypeScript configuration reference
- `@diplodoc/directive` - Directive parsing utilities documentation
