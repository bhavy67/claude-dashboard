import { Router } from 'express';
import { getTokenSeries, getModelStats, getDailyStats, getHourlyStats, getToolStats, getCacheStats, getSessionLengthTrends } from '../parser.js';

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

router.get('/hourly', (_req, res) => {
  res.json(getHourlyStats());
});

router.get('/tools', (_req, res) => {
  res.json({ tools: getToolStats() });
});

router.get('/cache', (_req, res) => {
  res.json(getCacheStats());
});

router.get('/session-length', (_req, res) => {
  res.json({ weeks: getSessionLengthTrends() });
});

export { router as statsRouter };
