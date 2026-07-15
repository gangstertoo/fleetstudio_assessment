import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPublicDir = path.join(__dirname, '..', 'public');
const clientDistDir = path.join(__dirname, '..', '..', 'client', 'dist');
const clientDistIndexPath = path.join(clientDistDir, 'index.html');

const app = createApp();

// Node's global `fetch` is backed by undici, which bypasses nock's http-module
// interception. Mocking `global.fetch` directly is simpler and deterministic.
function mockFetchOnce(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('GET /api/repositories/:owner/:repo/commit/:sha', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('returns a normalized commit payload on success', async () => {
    const owner = 'golemfactory';
    const repo = 'clay';
    const sha = 'a1bf367b3af680b1182cc52bb77ba095764a11f';

    const githubPayload = {
      sha,
      html_url: `https://github.com/${owner}/${repo}/commit/${sha}`,
      commit: {
        message: 'Fix: handle edge case in task computation',
        author: { name: 'Jane Dev', email: 'jane@example.com', date: '2023-01-01T00:00:00Z' },
        committer: { name: 'Jane Dev', email: 'jane@example.com', date: '2023-01-01T00:00:00Z' },
      },
      author: { login: 'janedev', avatar_url: 'https://avatars.example.com/janedev.png', html_url: 'https://github.com/janedev' },
      committer: { login: 'janedev', avatar_url: 'https://avatars.example.com/janedev.png' },
      parents: [{ sha: 'parentsha123', html_url: 'https://github.com/golemfactory/clay/commit/parentsha123' }],
      stats: { additions: 10, deletions: 2, total: 12 },
      files: [
        {
          filename: 'src/task.py',
          status: 'modified',
          additions: 10,
          deletions: 2,
          changes: 12,
          patch: '@@ -1,3 +1,4 @@\n+added line\n context\n-removed line',
          blob_url: `https://github.com/${owner}/${repo}/blob/${sha}/src/task.py`,
        },
      ],
    };

    mockFetchOnce(200, githubPayload);

    const res = await request(app).get(`/api/repositories/${owner}/${repo}/commit/${sha}`);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      expect.any(Object)
    );
    expect(res.status).toBe(200);
    expect(res.body.sha).toBe(sha);
    expect(res.body.message).toBe('Fix: handle edge case in task computation');
    expect(res.body.author.login).toBe('janedev');
    expect(res.body.stats).toEqual({ additions: 10, deletions: 2, total: 12 });
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].filename).toBe('src/task.py');
    expect(res.body.files[0].patch).toContain('added line');
  });

  it('returns 404 when GitHub cannot find the commit', async () => {
    mockFetchOnce(404, { message: 'No commit found for SHA: deadbeef' });

    const res = await request(app).get('/api/repositories/owner/repo/commit/deadbeef');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No commit found/i);
  });

  it('maps GitHub rate limiting (403) to a 429 response', async () => {
    mockFetchOnce(403, { message: 'API rate limit exceeded' });

    const res = await request(app).get('/api/repositories/owner/repo/commit/somesha');

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/rate limit/i);
  });

  it('handles files with no patch (e.g. binary files) without crashing', async () => {
    const owner = 'o';
    const repo = 'r';
    const sha = 'binarysha';

    mockFetchOnce(200, {
      sha,
      html_url: '',
      commit: { message: 'add logo', author: {}, committer: {} },
      author: null,
      committer: null,
      parents: [],
      stats: { additions: 0, deletions: 0, total: 0 },
      files: [{ filename: 'logo.png', status: 'added', additions: 0, deletions: 0, changes: 0 }],
    });

    const res = await request(app).get(`/api/repositories/${owner}/${repo}/commit/${sha}`);

    expect(res.status).toBe(200);
    expect(res.body.files[0].patch).toBeNull();
  });

  it('serves the built client from client/dist when server/public is absent', async () => {
    fs.rmSync(serverPublicDir, { recursive: true, force: true });
    fs.mkdirSync(clientDistDir, { recursive: true });
    fs.writeFileSync(clientDistIndexPath, '<!doctype html><html><body>fallback shell</body></html>');

    const res = await request(createApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('fallback shell');

    fs.rmSync(clientDistDir, { recursive: true, force: true });
  });
});
