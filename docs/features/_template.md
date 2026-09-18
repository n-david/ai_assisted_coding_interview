# NNN — Feature name

Use this optional record when work will span sessions or its decisions need to be kept in the repository. Keep only the sections that help someone resume the work.

## Status

Planning / Implementing / Verifying / Complete

Choose one status. Add a blocker here if needed; incomplete verification prevents completion.

## Goal and scope

Describe the user problem, intended outcome, included behavior, and scope boundaries.

## Requirements and acceptance criteria

- [ ] Describe an observable outcome.
- [ ] Describe relevant edge and failure behavior.

## Questions and decisions

### Open questions

Record questions requiring user input. Resolve them before dependent planning or implementation.

### Decisions

Record the user's answers and agreed design choices, with brief reasoning where useful.

## Design

- API contract: methods, paths, request/response fields, validation, and errors.
- Data model and persistence changes, if applicable.
- Backend/frontend responsibilities and affected files.

Omit or mark sections that do not apply, with a brief explanation.

## Implementation plan and progress

Replace the placeholders with concrete steps. Check each item only after completing it.

- [ ] Implement the agreed behavior.
- [ ] Add unit tests for happy, edge, and failure cases.
- [ ] Add integration tests where needed.
- [ ] Run relevant tests and static checks.
- [ ] Perform the manual smoke test.
- [ ] Update usage documentation.
- [ ] Confirm all acceptance criteria and verification results.

## Verification

### Automated tests

List planned cases before implementation, then record actual commands and results.

| Case or check | Command/test | Result |
| --- | --- | --- |
| Happy path | To be specified | Not run |
| Edge cases | To be specified | Not run |
| Failure cases | To be specified | Not run |
| Relevant static checks | To be specified | Not run |

### Manual smoke test

Record the environment, server URLs, test data, and date of verification. Use actual requests/browser interactions, not only code inspection.

| Steps | Expected result | Observed result |
| --- | --- | --- |
| Main feature flow | To be specified | Not run |
| Relevant edge/error flow | To be specified | Not run |

Record blockers and any user-run verification separately, including who performed it.

## Progress and handoff

- Completed work:
- Remaining work and blockers:
- Next concrete step:
- Known limitations or follow-up work:
