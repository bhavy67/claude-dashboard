import { Router } from 'express';
import { getOverview } from '../parser.js';

const router = Router();

router.get('/overview', (_req, res) => {
  const overview = getOverview();
  res.json(overview);
});

export { router as overviewRouter };
