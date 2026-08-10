import { Router } from 'express';
import { getSessionList, getSessions } from '../parser.js';

const router = Router();

router.get('/', (req, res) => {
  const { project, search, limit = '20', offset = '0' } = req.query;
  let sessions = getSessionList();

  if (project && typeof project === 'string') {
    sessions = sessions.filter(s => s.project.includes(project));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    sessions = sessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.project.toLowerCase().includes(q) ||
      s.models.some(m => m.toLowerCase().includes(q))
    );
  }

  const total = sessions.length;
  const start = parseInt(offset as string, 10);
  const end = start + parseInt(limit as string, 10);
  const page = sessions.slice(start, end);

  res.json({ sessions: page, total });
});

router.get('/:id', (req, res) => {
  const session = getSessions().get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

export { router as sessionsRouter };
