# Test catalogue

`catalogue/` is a small, fixed catalogue that the server tests (`test/server.test.mjs`), the landscape tests
(`test/model.test.mjs`) and the browser tests (`e2e/`) run against. It never changes when the live catalogue
does, so a merged catalogue pull request can't break the tests.

It was built from trimmed copies of real generated files, so the shapes match what the flows produce. Each
repository covers a different case:

| Repository | Covers |
| --- | --- |
| `das-commitments` | Every kind of data: a database with foreign keys (8 tables), 6 events and 6 commands, 2 OpenAPI specs, dependencies resolved through APIM, local dev config, metadata, topics, Dependabot and API security reports |
| `das-courses-api` | An API with a database, specs and Dependabot alerts, but no event catalogue (its Events tab is disabled) |
| `das-learning` | Events and dependencies, but no Dependabot data (its security endpoint returns 404) |
| `das-payments-v2-common` | A database scan that found no tables: scanned, but no Data schema tab |
| `das-admin-roatp-web` | A web repository with user journeys |
| `das-not-yet-scanned` | In the manifest with nothing generated yet |

When a flow's output format changes, update the matching files here by hand (or copy a trimmed real file),
and adjust the tests that read them.
