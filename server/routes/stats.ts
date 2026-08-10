import { Router } from 'express';
import { getTokenSeries, getModelStats, getDailyStats } from '../parser.js';

const router = Router();

router.get('/tokens', (req, res) => {
  const range = (req.query.range as string) || '30d';
  const series = getTokenSeries(range);
  res.json({ series });
});

router.get('/models', (_req, res) => {
  const models = getModelStats();
  res.json({ models });
});

router.get('/daily', (_req, res) => {
  const days = getDailyStats();
  res.json({ days });
});

export { router as statsRouter };
