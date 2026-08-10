const BASE = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Types ──────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  title: string;
  project: string;
  startedAt: string;
  lastActiveAt: string;
  messageCount: number;
  turnCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreateTokens: number;
  models: string[];
  version: string;
  isActive: boolean;
  estimatedCost: number | null;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  role: string;
  content: string;
  timestamp: string;
  model?: string;
  thinking?: string;
  toolCalls?: { name: string; input: Record<string, unknown>; id: string }[];
  durationMs?: number;
  isMeta: boolean;
}

export interface SubagentInfo {
  id: string;
  agentType: string;
  description: string;
  toolUseId: string;
  spawnDepth: number;
  messages: Message[];
}

export interface SessionDetail extends SessionSummary {
  messages: Message[];
  subagents: SubagentInfo[];
}

export interface ProjectSummary {
  name: string;
  path: string;
  sessionCount: number;
  totalTokens: number;
  totalCost: number | null;
  lastActive: string;
}

export interface OverviewStats {
  totalSessions: number;
  totalTokens: number;
  totalProjects: number;
  activeSessions: number;
  totalCost: number | null;
  topModels: { model: string; count: number; totalTokens: number }[];
  recentActivity: SessionSummary[];
}

export interface TokenSeries {
  date: string;
  input: number;
  output: number;
  total: number;
}

export interface ModelStats {
  model: string;
  count: number;
  totalTokens: number;
}

export interface DailyStats {
  date: string;
  sessions: number;
  tokens: number;
  cost: number | null;
  models: string[];
}

// ── API functions ──────────────────────────────────────

export function fetchOverview(): Promise<OverviewStats> {
  return fetchJSON<OverviewStats>(`${BASE}/overview`);
}

export function fetchSessions(params?: {
  project?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: SessionSummary[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.project) searchParams.set('project', params.project);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  const qs = searchParams.toString();
  return fetchJSON(`${BASE}/sessions${qs ? `?${qs}` : ''}`);
}

export function fetchSession(id: string): Promise<SessionDetail> {
  return fetchJSON<SessionDetail>(`${BASE}/sessions/${id}`);
}

export function fetchProjects(): Promise<ProjectSummary[]> {
  return fetchJSON<ProjectSummary[]>(`${BASE}/projects`);
}

export function fetchTokenSeries(range = '30d'): Promise<{ series: TokenSeries[] }> {
  return fetchJSON(`${BASE}/stats/tokens?range=${range}`);
}

export function fetchModelStats(): Promise<{ models: ModelStats[] }> {
  return fetchJSON(`${BASE}/stats/models`);
}

export function fetchDailyStats(): Promise<{ days: DailyStats[] }> {
  return fetchJSON(`${BASE}/stats/daily`);
}
