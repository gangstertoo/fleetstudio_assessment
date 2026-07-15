import { Router } from 'express';
import { fetchCommit } from '../services/github.js';

export const commitRouter = Router();

// GET /api/repositories/:owner/:repo/commit/:sha
commitRouter.get('/repositories/:owner/:repo/commit/:sha', async (req, res, next) => {
  const { owner, repo, sha } = req.params;

  if (!owner || !repo || !sha) {
    return res.status(400).json({ error: 'owner, repo and sha are all required' });
  }

  try {
    const commit = await fetchCommit(owner, repo, sha);
    res.json(commit);
  } catch (err) {
    next(err);
  }
});
