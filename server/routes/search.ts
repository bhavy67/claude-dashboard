import { Router } from 'express';
import { searchSessions } from '../parser.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q as string) || '';
  res.json({ results: searchSessions(q), query: q });
});

export { router as searchRouter };
