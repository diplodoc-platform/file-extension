# Transform 5 companion prerelease

This branch prepares `@diplodoc/file-extension@0.2.7-transform5.0` for the `transform5`
npm dist-tag. It is a Transform 5 compatibility candidate, not a stable patch.
Current Transform 4 rejects a companion type re-export, and the new declaration
syntax is not accepted by TypeScript 5.2. Stable compatibility has not been
established, so these changes must remain separate from master and latest.

Publication is triggered by a push to the exact
`codex/transform-5-compat-prerelease` branch after root review and explicit
publication authorization. Do not push this branch as a preview: the push starts
the publish workflow. The workflow uses Node 24.15.0 and checks repository,
branch, package, version, lockfile and dist-tag before publishing. Normal install,
typecheck, lint, tests, build and any existing installed-package gate must pass.
An existing version or a registry failure stops publication. The existing
`NPM_TOKEN` secret is supplied only to the publishing step; it is never read or
printed by the checks.

The workflow publishes with provenance and explicit `--tag transform5`.
It creates no Git tags, GitHub releases or master commits, and does not write the
`latest` dist-tag. Do not use the generic release workflow's stable action or its
branch-name-based prerelease action for this train.

Publish and verify `@diplodoc/utils@2.3.7-transform5.0` first. Then finish the
tabs lockfile against that real registry version and run a clean install and its
checks before publishing file and tabs. Tabs must declare an exact production
dependency on the utils RC because its runtime and public declarations use it.
No fabricated registry integrity or local-file dependency may enter the lockfile.

The proposed exact versions were confirmed absent before preparation. Recheck
version availability and resulting dist-tags at publication time. The parent
source PRs remain draft review references; this prerelease train does not imply
stable release, master merge or broader consumer acceptance.
