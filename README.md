# Commit Diff Viewer

A full-stack app that shows the diff for any commit, in any public GitHub
repository, at:

```
http://localhost:1234/repositories/:owner/:repository/commit/:commitSHA
```

Example: `http://localhost:1234/repositories/octocat/Hello-World/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`

- **Backend:** Node.js + Express, proxies/normalizes the GitHub REST API.
- **Frontend:** React (Vite) + React Router, renders the commit metadata and a
  GitHub-style inline diff.
- Both are served from a **single port (1234)** in production, so the URL
  above works exactly as specified.

See [`SOLUTION.md`](./SOLUTION.md) for architectural notes, trade-offs, and
what's missing.

## Prerequisites

- Node.js 18+ (uses the built-in global `fetch`)
- npm 9+ (uses npm workspaces)

## Setup & run (production-style, single port)

```bash
npm install
npm run build     # builds the React app and copies it into server/public
npm start          # starts Express on http://localhost:1234
```

Then open, e.g.:
`http://localhost:1234/repositories/octocat/Hello-World/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`

## Optional: GitHub token

Unauthenticated requests to the GitHub API are limited to 60/hour, and will
occasionally hit `429`s during testing. To raise that limit, create a
[personal access token](https://github.com/settings/tokens) (no scopes
needed for public repos) and set it before starting the server:

```bash
export GITHUB_TOKEN=ghp_yourtoken
npm start
```

## Development mode (hot reload)

Run the client and server separately, on two ports. The Vite dev server
proxies `/api/*` to Express so there are no CORS issues.

```bash
# terminal 1
npm run dev:server   # http://localhost:1234 (API only)

# terminal 2
npm run dev:client   # http://localhost:5173 (React app, hot reload)
```

In dev mode, browse the app at `http://localhost:5173/repositories/...`.

## Tests

```bash
npm test
```

Runs the backend's Jest/Supertest suite (route behavior, GitHub error-code
mapping, edge cases like binary files). See `server/tests/commit.test.js`.

## Project structure

```
commit-diff-viewer/
├── client/            # React app (Vite)
│   └── src/
│       ├── api/        # fetch wrapper for the backend API
│       ├── components/ # CommitHeader, DiffFile, DiffLine
│       ├── pages/       # CommitPage (the routed page)
│       └── utils/      # parsePatch: unified-diff -> renderable hunks
├── server/            # Express app
│   ├── src/
│   │   ├── routes/commit.js
│   │   ├── services/github.js   # GitHub API client + response normalization
│   │   └── app.js / index.js
│   └── tests/
└── SOLUTION.md         # approach, trade-offs, what I'd add with more time
```


