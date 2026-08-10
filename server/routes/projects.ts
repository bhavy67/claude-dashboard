import { Router } from 'express';
import { getProjects } from '../parser.js';

const router = Router();

router.get('/', (_req, res) => {
  const projects = Array.from(getProjects().values());
  projects.sort((a, b) => b.lastActive.localeCompare(a.lastActive));
  res.json(projects);
});

export { router as projectsRouter };
