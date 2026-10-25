# Plans

Plans track efforts that span several PRs: the goal, the decisions made,
the steps, and where things stand. Unlike [specs](../specs/README.md),
which describe how Piskel behaves and live as long as the feature does,
plans are temporary. Once a plan is complete, fold whatever is still useful
into the specs or [architecture.md](../architecture.md), then delete the
plan.

## Writing a plan

One file per effort (`<topic>.md`), with these sections:

- **Goal**: what done looks like.
- **Decisions**: choices made and why, including rejected alternatives.
- **Steps**: ordered, each with a status (✅ done, ⏳ in progress, not
  started).
- **Status**: where things stand now and what the next step is.
- **Open questions**.

Update the status as part of the PRs that make progress.

## Current plans

| Plan | Status |
| --- | --- |
| [modernization.md](modernization.md) | Draft: harness written; goal, decisions and conventions TODO |
