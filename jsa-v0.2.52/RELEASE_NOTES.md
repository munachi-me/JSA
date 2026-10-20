# RELEASE_NOTES.md — JSA v0.2.52

| | |
| --- | --- |
| **Version** | `0.2.52` |
| **Stage** | Phase 6 |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Corrects the `test:core` script so the smoke suite runs through Vitest with the project configuration.

## Bug fixes

- `test:core` changed to `vitest run src/tests/core-smoke.test.js`.

## Scope relative to the previous release

- No new source modules were added; this release changed existing modules.
- Application code: 3,461 → 3,461 lines (+0).

Compared against [v0.2.51](../jsa-v0.2.51/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

Datasets persisted in IndexedDB are keyed to the browser origin. Running a different version folder on a different dev-server port is a different origin, so previously saved work will not appear there. Workspace data is not migrated between versions by the repository.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Not executed** in this documentation pass. |
| Production build | **Not executed** in this documentation pass. |
| Browser behaviour | **Not verified** — no browser session was driven during documentation. |
| Coverage | **Not measured.** No coverage figure is claimed. |

"Executed and passed" above means the command was run against this exact folder in the documentation environment and exited successfully. It does not mean every feature was exercised, and it does not constitute a browser or security verification.

## Historical provenance

This release note was reconstructed from:

- A direct source diff against the adjacent version folders.

Some details of this release could not be corroborated by a milestone document or a version-specific commit subject. Where a claim could not be verified it has been left out rather than inferred.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
