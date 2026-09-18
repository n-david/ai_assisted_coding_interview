# Coding agent instructions

These instructions apply throughout this repository. Start sessions in this repository root so they are discovered.

## Project context and orientation

- This is a backend-focused interview practice project: Python/FastAPI REST APIs, Pydantic schemas, SQLAlchemy, SQLite, and a Next.js/React frontend.
- Prefer straightforward implementations that the user can understand and explain in an interview. Keep changes focused on the requested behavior.
- Read the [root README](README.md) for setup and the relevant [backend](backend-python/README.md) or [frontend](frontend/README.md) guide before changing that area.
- Check the working tree before editing and preserve unrelated user changes.
- If the current feature has a document under `docs/features/`, read its decisions, unchecked steps, verification, and handoff notes. Check recorded progress against the code before resuming.

## Clarify before planning or implementation

- Before planning, designing, or implementing, identify unresolved questions. Read existing code and documentation to establish facts first.
- Ask the user about anything that remains unclear and wait for answers before proceeding with dependent work. Do not invent requirements or silently choose product behavior.
- Batch related questions. Capture answers and important decisions in the plan; also update the feature document if one exists.
- If new ambiguity appears during implementation, pause the affected work and clarify it. Do not treat an unanswered question as approval.

## Planning and feature records

- Use Plan mode for every feature beyond a quick, localized bug fix, and for substantial refactors or changes to API contracts or database schemas.
- A quick fix restores clear, established behavior without new requirements or design decisions. It still needs appropriate verification and a regression test when applicable.
- If Plan mode is not active and requires user action, explain why it is required and ask the user to enable it. Do not claim to be in Plan mode when it is not active. If the tool has no Plan mode, agree on a planning alternative with the user before implementing.
- Respect Plan mode's editing restrictions: present the spec and plan there before changing application code. Plan mode does not create a repository file by itself.
- A feature document is optional for work that can be finished in one session. When work is likely to span sessions, has substantial design decisions to preserve, or the user asks to save the plan, write the agreed plan to `docs/features/NNN-short-feature-name.md` once edits are permitted. Start at `001`, use the next available number, and adapt [the template](docs/features/_template.md) to the work.
- State the goal, scope, acceptance criteria, API/data changes, test cases, and manual smoke-test steps before implementation. Keep unresolved questions explicit.
- When the user requests staged implementation, define a small number of checkpoints with observable exit criteria. Complete and verify only the current checkpoint, report changed files, check results, and remaining risks, then wait for the user's direction before starting the next checkpoint.
- When a feature document exists, update its checklist and verification as work proceeds. Leave blocked, failed, or unverified items unchecked. If unfinished work may continue in a fresh session, create or update the document with completed work, open questions, blockers, and the next concrete step before handing it off.
- Documentation-only work does not require a feature record or application tests; verify its accuracy, links, and examples instead.

## Automated tests

- Add meaningful unit tests for every feature. Cover the happy path, relevant edge cases, and failure cases. No fixed line or branch coverage percentage is required.
- Test observable behavior rather than duplicating implementation details. Add regression coverage for bugs when applicable.
- Add API/database integration tests when unit tests alone cannot verify routing, validation, HTTP responses, persistence, or transaction behavior.
- Automated tests must use an isolated test database. Never use the development `dummy.db` as a test fixture. Account for the startup reset before importing the app; overriding only request dependencies may not isolate startup database operations.
- Inspect the existing test setup. If the affected area lacks a test runner or fixtures, include establishing them in the feature plan; clarify unresolved tooling choices with the user. Do not silently skip tests.
- Run relevant tests and static checks. Backend tests use `poetry run pytest` from `backend-python`; frontend type checks use `npm run typecheck` from `frontend`. Use the actual configured test and lint tools for the affected area.
- Record commands, results, and any limitations. A missing test runner, failing check, or unexecuted test is not a passing result.

## Manual smoke testing

- Before calling a feature complete, exercise the changed behavior in the running application. Passing unit tests, compilation, or type checks does not replace this check.
- The user normally runs these services already:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:8080`
  - Interactive API docs: `http://localhost:8080/docs`
- Check availability first. The backend root may return 404; use `/docs` or `/openapi.json` to check it. If a service is unavailable or the agent cannot reach it, explain the result and coordinate with the user.
- Reuse existing servers. Do not stop or restart the user's servers without checking with them. If starting a separate test server is needed, coordinate ports and data isolation first.
- For UI changes, use a browser to perform the actual user flow and inspect the relevant requests and visible results. Browser-driving tools are acceptable. For backend-only changes, send real HTTP requests using the API docs or an HTTP client.
- Verify the happy path and relevant edge/error behavior. Use identifiable test data and avoid disrupting existing development data.
- Read the [database lifecycle notes](backend-python/README.md#database): starting or reloading the backend currently resets its tables. Account for automatic reloads when editing backend code.
- Record steps, expected results, observed results, and the environment used. If smoke testing is blocked, leave verification incomplete and request the access or user-run steps needed; do not claim the feature is complete.

## Documentation and completion

- READMEs describe current setup, architecture, and usage. Update the relevant guide when these change, and link to the authoritative section instead of repeating it elsewhere.
- When used, feature documents preserve requirements, design decisions, implementation progress, and verification evidence. Update them when requirements or implementation change.
- Add concise entries for completed features and meaningful fixes to [CHANGELOG.md](CHANGELOG.md) under a dated `YYYY-MM-DD` heading. Link to the feature document where useful; do not duplicate the full spec.
- Before declaring a feature complete, confirm acceptance criteria, automated tests, applicable static checks, manual smoke testing, documentation, and changelog updates. Explicitly report any incomplete items.
- Final updates should summarize what changed, what was verified, and any remaining limitations.
- Keep generated development database changes out of commits unless the user explicitly requests them.
