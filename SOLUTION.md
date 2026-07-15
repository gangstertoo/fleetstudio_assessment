# Solution notes

## Approach & architectural decisions

**Monorepo, two npm workspaces, one runtime process.** `client/` (Vite +
React) and `server/` (Express) are separate workspaces so each has its own
dependency tree and can be developed independently, but `npm run build`
compiles the client and copies the static bundle into `server/public`, so in
production there's a single Node process serving both the API and the page
on port 1234 — matching the URL shape required by the brief
(`http://localhost:1234/repositories/:owner/:repo/commit/:sha`) without a
reverse proxy.

**Backend is a thin, normalizing proxy over the GitHub REST API.**
`GET /repos/:owner/:repo/commits/:sha` on GitHub's API already returns
everything the page needs in one call: commit message, author/committer,
parents, aggregate stats, and a per-file `patch` (unified diff) plus
add/delete/change counts. Rather than reimplementing diffing, the server
calls that single endpoint and reshapes the response into a smaller,
UI-specific contract (see `server/src/services/github.js`). This keeps the
backend nearly stateless and avoids a second GitHub call for the "compare"
endpoint, which would only be needed for multi-commit ranges.

**REST over GraphQL.** GraphQL would save bytes on nested fields, but the
commit+diff data needed here is a single flat REST resource, and REST needs
no query building/schema and works with an unauthenticated request (60
req/hour) out of the box, which is friendlier for local grading than
requiring a GraphQL PAT. I built against REST; the `github.js` service is
the one place that would change if this were swapped to GraphQL.

**Error mapping.** GitHub's `404` (unknown commit/repo) and `403` (rate
limit exceeded) are translated into `404` and `429` respectively from our
own API, with GitHub's message passed through, so the frontend can show a
useful message instead of a generic failure.

**Diff rendering is done client-side from the raw unified-diff `patch`
string**, not pre-rendered on the server. `client/src/utils/parsePatch.js`
parses `@@ -a,b +c,d @@` hunk headers and classifies each line as
`add`/`remove`/`context`, tracking old/new line numbers so the UI can show
GitHub-style dual gutters. Keeping this on the client keeps the API payload
small (just the raw patch) and keeps the diff-rendering logic colocated with
the diff-rendering component, which is where I expect changes (e.g. syntax
highlighting) to happen next.

**Styling** is hand-written CSS (no Tailwind/UI kit) with an editor/ledger
visual language — monospace headings for structural/code-adjacent elements
(SHA, file paths, hunk headers), a dark surface, and green/red used only for
additions/deletions so the accent colors carry real meaning rather than
being decorative.

## Known limitations & trade-offs

- **I could not open the linked Figma file or the hosted API-doc page**
  (both require an authenticated session/organization access I don't have
  as an automated reviewer of this brief). I built the UI to the written
  spec and to standard GitHub commit-page conventions instead, and designed
  the API response shape around what the GitHub commits endpoint naturally
  provides. If the real Figma/API-doc differ in field names, layout details,
  or an additional required field, `server/src/services/github.js`
  (response shape) and `client/src/components/*` (layout) are the two
  places to reconcile against them.
- **Unauthenticated GitHub API rate limit (60 req/hour) applies unless
  `GITHUB_TOKEN` is set.** For a take-home/local-review context I didn't
  wire up an OAuth flow; a `.env`-based personal access token is the
  pragmatic trade-off (documented in the README).
- **No caching layer.** Every page load re-fetches from GitHub. For a
  single-commit-at-a-time read-only viewer this is simple and correct, but
  repeatedly viewing the same commit re-spends rate-limit budget. An
  in-memory or Redis cache keyed by `owner/repo/sha` (commits are immutable,
  so cache entries never need invalidating) would be a natural addition.
- **Large diffs and binary files:** GitHub omits `patch` for binary files
  and for diffs above its internal size threshold. The UI detects a missing
  `patch` and shows an explanatory placeholder rather than crashing, but it
  does not fall back to fetching the raw blob/diff separately (e.g. via the
  `.diff` media type or `git show`), which is what I'd add for full parity
  with GitHub's own binary-file/large-diff handling.
- **Renames/moves** are shown as `old → new` in the filename but reuse the
  same "modified" diff rendering as any other file; GitHub additionally
  supports a "pure rename, no content change" collapsed state, which I
  didn't special-case.
- **Only the single commit page is implemented**, per the brief ("You do
  not need to implement any other pages"). There's no repo browser, commit
  list, or search — navigating to `/` redirects to one example commit as a
  demo entry point.
- **Test coverage is backend-only.** `server/tests/commit.test.js` covers
  the route's success path, 404, 403→429 mapping, and the no-patch
  (binary-file) case, using a mocked `global.fetch` (nock does not intercept
  Node's native `fetch`/undici, so I mocked at the fetch layer directly
  instead). I did not add frontend component tests given time constraints
  — see "what I'd add" below.

## What I'd add with more time

1. **Frontend tests** (Vitest + React Testing Library) for `parsePatch`
   (hunk/line classification, edge cases like a diff with no trailing
   newline) and for `CommitPage`'s loading/error/success states.
2. **A response cache** (in-memory LRU, or Redis if this were deployed) keyed
   by commit SHA, since commit contents are immutable — this would also let
   the app tolerate short GitHub outages/rate-limit spikes gracefully.
3. **Syntax highlighting** inside diff lines (e.g. via `shiki` or
   `highlight.js`), scoped per-file by extension, which is the most visible
   gap versus GitHub's own diff view.
4. **A raw-diff fallback** for files GitHub returns without a `patch`
   (binary/oversized), using the `Accept: application/vnd.github.v3.diff`
   media type or the file's `blob_url`, so large diffs aren't just a dead
   end.
5. **Pagination/"load more" for very large commits** — GitHub's commit
   endpoint paginates `files` past 300 changed files; the current
   implementation only reads the first page.
6. **Reconciling pixel-level details against the actual Figma file** (exact
   spacing, iconography, color tokens) once I have access to it — the
   current visual design is a faithful interpretation of the written brief,
   not a pixel-for-pixel match.
