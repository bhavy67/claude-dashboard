import fs from 'fs';
import path from 'path';
import os from 'os';

// ── Types ──────────────────────────────────────────────────────────

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

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

export interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
  text?: string;
  thinking?: string;
  signature?: string;
  name?: string;
  id?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  role: string;
  content: string;
  timestamp: string;
  model?: string;
  usage?: TokenUsage;
  thinking?: string;
  toolCalls?: { name: string; input: Record<string, unknown>; id: string }[];
  toolResults?: { toolUseId: string; content: string }[];
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

// ── Constants ──────────────────────────────────────────────────────

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');

// ── Model Pricing (per million tokens) ─────────────────────────────
// Based on LiteLLM model_prices_and_context_window.json (ccusage source)

interface ModelPricing {
  input: number;
  output: number;
  cacheRead: number;   // per MTok (10% of input)
  cacheWrite: number;  // per MTok (125% of input)
}

// Helper to build pricing entry: cache read = 10% input, cache write = 125% input
function p(input: number, output: number): ModelPricing {
  return {
    input,
    output,
    cacheRead: input * 0.1,
    cacheWrite: input * 1.25,
  };
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── Anthropic Claude (direct / non-bedrock pricing) ──
  'claude-opus-5':              p(15, 75),
  'claude-sonnet-5':            p(3, 15),
  'claude-haiku-4-5':           p(1, 5),
  'claude-fable-5':             p(15, 75),
  'claude-opus-4-5':            p(15, 75),
  'claude-opus-4-1':            p(15, 75),
  'claude-opus-4':              p(15, 75),
  'claude-sonnet-4-5':          p(3, 15),
  'claude-sonnet-4':            p(3, 15),
  'claude-haiku-3-5':           p(0.80, 4),
  'claude-3-5-sonnet':          p(3, 15),
  'claude-3-5-haiku':           p(0.80, 4),
  'claude-3-opus':              p(15, 75),
  'claude-3-sonnet':            p(3, 15),
  'claude-3-haiku':             p(0.25, 1.25),
  'claude-2':                   p(8, 24),
  'claude-2.1':                 p(8, 24),
  'claude-instant':             p(0.80, 2.40),

  // ── DeepSeek ──
  'deepseek-chat':              p(0.27, 1.10),
  'deepseek-v3':                p(0.27, 1.10),
  'deepseek-v3-0324':           p(0.27, 1.10),
  'deepseek-reasoner':          p(0.55, 2.19),
  'deepseek-r1':                p(0.55, 2.19),
  'deepseek-r1-0528':           p(0.55, 2.19),
  'deepseek-v4-pro':            p(0.435, 0.87),
  'deepseek-v4-flash':          p(0.14, 0.28),
  'deepseek-v4':                p(0.435, 0.87),

  // ── OpenAI ──
  'gpt-5':                      p(1.25, 10),
  'gpt-5-mini':                 p(0.15, 0.60),
  'gpt-5-nano':                 p(0.03, 0.12),
  'gpt-4o':                     p(2.50, 10),
  'gpt-4o-mini':                p(0.15, 0.60),
  'gpt-4.5':                    p(75, 150),
  'gpt-4.1':                    p(2, 8),
  'gpt-4.1-mini':               p(0.40, 1.60),
  'gpt-4.1-nano':               p(0.10, 0.40),
  'gpt-4':                      p(30, 60),
  'gpt-4-turbo':                p(10, 30),
  'gpt-4-32k':                  p(60, 120),
  'gpt-3.5-turbo':              p(0.50, 1.50),
  'gpt-3.5-turbo-0125':         p(0.50, 1.50),
  'gpt-3.5-turbo-1106':         p(1, 2),
  'gpt-3.5-turbo-16k':          p(3, 4),
  'gpt-3.5-turbo-instruct':     p(1.50, 2),
  'o1':                         p(15, 60),
  'o1-mini':                    p(3, 12),
  'o1-pro':                     p(150, 600),
  'o3':                         p(10, 40),
  'o3-mini':                    p(1.10, 4.40),
  'o4-mini':                    p(1.10, 4.40),
  'gpt-4o-realtime':            p(5, 20),

  // ── Google Gemini ──
  'gemini-2.5-pro':             p(1.25, 10),
  'gemini-2.5-flash':           p(0.15, 0.60),
  'gemini-2.5-flash-lite':      p(0.10, 0.40),
  'gemini-2.0-flash':           p(0.10, 0.40),
  'gemini-2.0-flash-lite':      p(0.075, 0.30),
  'gemini-1.5-pro':             p(1.25, 5),
  'gemini-1.5-flash':           p(0.075, 0.30),
  'gemini-1.5-flash-8b':        p(0.0375, 0.15),
  'gemini-1.0-pro':             p(0.50, 1.50),
  'gemini-pro':                 p(0.50, 1.50),
  'gemini-flash':               p(0.075, 0.30),

  // ── Grok / xAI ──
  'grok-4':                     p(2, 8),
  'grok-4-mini':                p(0.15, 0.60),
  'grok-3':                     p(3, 15),
  'grok-3-mini':                p(0.30, 0.50),
  'grok-2':                     p(2, 10),
  'grok-beta':                  p(5, 15),

  // ── Mistral ──
  'mistral-large':              p(2, 6),
  'mistral-medium':             p(2.70, 8.10),
  'mistral-small':              p(0.20, 0.60),
  'mistral-tiny':               p(0.15, 0.45),
  'mistral-embed':              p(0.10, 0),
  'codestral':                  p(0.20, 0.60),
  'codestral-mamba':            p(0.20, 0.60),
  'pixtral-large':              p(2, 6),
  'ministral-3b':               p(0.04, 0.04),
  'ministral-8b':               p(0.10, 0.10),

  // ── Meta Llama (via various providers, approximate) ──
  'llama-4-maverick':           p(0.20, 0.60),
  'llama-4-scout':              p(0.10, 0.30),
  'llama-3.3-70b':              p(0.59, 0.79),
  'llama-3.2-90b':              p(0.90, 0.90),
  'llama-3.1-405b':             p(2, 4),
  'llama-3.1-70b':              p(0.59, 0.79),
  'llama-3.1-8b':               p(0.06, 0.06),
  'llama-3-70b':                p(0.59, 0.79),
  'llama-3-8b':                 p(0.06, 0.06),
  'llama-2-70b':                p(0.90, 0.90),
  'llama-2-13b':                p(0.15, 0.15),
  'llama-2-7b':                 p(0.06, 0.06),
  'codellama-70b':              p(0.90, 0.90),
  'codellama-34b':              p(0.15, 0.15),
  'codellama-13b':              p(0.10, 0.10),
  'codellama-7b':               p(0.06, 0.06),

  // ── Qwen ──
  'qwen-max':                   p(2.40, 9.60),
  'qwen-plus':                  p(0.80, 2),
  'qwen-turbo':                 p(0.30, 0.60),
  'qwen-coder-plus':            p(0.80, 2),
  'qwen2.5-72b':                p(0.90, 0.90),
  'qwen2.5-32b':                p(0.35, 0.35),
  'qwen2.5-14b':                p(0.20, 0.20),
  'qwen2.5-7b':                 p(0.10, 0.10),
  'qwen2.5-coder-32b':          p(0.35, 0.35),
  'qwen2.5-coder-14b':          p(0.20, 0.20),
  'qwen2.5-coder-7b':           p(0.10, 0.10),
  'qvq-72b':                    p(0.90, 0.90),
  'qwen3-235b':                 p(0.90, 0.90),
  'qwen3-32b':                  p(0.35, 0.35),
  'qwen3-14b':                  p(0.20, 0.20),
  'qwen3-8b':                   p(0.10, 0.10),
};

// Normalize model name: strip provider prefixes, version suffixes, etc.
function normalizeModelName(model: string): string {
  let name = model.toLowerCase().trim();

  // Strip provider prefixes (us., eu., apac., bedrock/, vertex_ai/, etc.)
  name = name.replace(/^(us\.|eu\.|apac\.|jp\.|au\.|global\.)/, '');
  name = name.replace(/^(bedrock\/|vertex_ai\/|azure\/|databricks\/|aws\/|gcp\/)/, '');
  // Strip /aws /gcp /azure suffixes
  name = name.replace(/\/(aws|gcp|azure|bedrock)$/, '');

  // Remove known version suffixes like -v1:0, :0, etc.
  name = name.replace(/-v\d+:\d+$/, '');
  name = name.replace(/:\d+$/, '');

  // Remove date suffixes like -20251001, -20250514
  name = name.replace(/-\d{8}$/, '');

  // Remove @provider suffixes
  name = name.replace(/@.+$/, '');

  return name;
}

function findPricing(model: string): ModelPricing | null {
  const normalized = normalizeModelName(model);

  // Exact match on normalized name
  if (MODEL_PRICING[normalized]) return MODEL_PRICING[normalized];

  // Try exact match on original
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Prefix match on normalized name (e.g. claude-haiku-4-5 matches claude-haiku-4-5-20251001)
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (normalized.startsWith(key) || key.startsWith(normalized)) {
      return pricing;
    }
  }

  // Prefix match on original
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing;
  }

  // Check for local/ollama models — free
  const localPatterns = [
    'ollama', 'local', 'codellama', 'llama', 'mistral', 'gemma',
    'qwen', 'phi', 'yi', 'deepseek-r1:1.5b', 'deepseek-r1:7b',
    'deepseek-r1:8b', 'deepseek-r1:14b', 'deepseek-r1:32b',
    'deepseek-r1:70b', 'tinyllama', 'stablelm', 'falcon',
    'mpt', 'dolly', 'vicuna', 'alpaca', 'zephyr', 'openchat',
    'neural-chat', 'starling', 'wizard', 'solar', 'command-r',
  ];
  for (const pattern of localPatterns) {
    if (normalized.includes(pattern)) {
      return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    }
  }

  return null;
}

function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheCreateTokens: number,
): number | null {
  const pricing = findPricing(model);
  if (!pricing) return null;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cacheRead;
  const cacheWriteCost = (cacheCreateTokens / 1_000_000) * pricing.cacheWrite;
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

// ── In-memory store ────────────────────────────────────────────────

let sessions: Map<string, SessionDetail> = new Map();
let projects: Map<string, ProjectSummary> = new Map();
let sessionList: SessionSummary[] = [];

export function getSessions() { return sessions; }
export function getSessionList() { return sessionList; }
export function getProjects() { return projects; }

// ── Main parse function ────────────────────────────────────────────

export function parseAllData(): void {
  sessions = new Map();
  projects = new Map();
  sessionList = [];

  if (!fs.existsSync(PROJECTS_DIR)) return;

  const projectDirs = fs.readdirSync(PROJECTS_DIR);

  for (const dirName of projectDirs) {
    const projectPath = path.join(PROJECTS_DIR, dirName);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    const decodedPath = decodeProjectName(dirName);

    // Find all .jsonl files (session transcripts)
    const files = fs.readdirSync(projectPath)
      .filter((f: string) => f.endsWith('.jsonl'));

    for (const file of files) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = path.join(projectPath, file);
      try {
        const detail = parseSessionFile(filePath, sessionId, decodedPath);
        sessions.set(sessionId, detail);

        const summary: SessionSummary = {
          id: detail.id,
          title: detail.title,
          project: detail.project,
          startedAt: detail.startedAt,
          lastActiveAt: detail.lastActiveAt,
          messageCount: detail.messageCount,
          turnCount: detail.turnCount,
          totalInputTokens: detail.totalInputTokens,
          totalOutputTokens: detail.totalOutputTokens,
          totalCacheReadTokens: detail.totalCacheReadTokens,
          totalCacheCreateTokens: detail.totalCacheCreateTokens,
          models: detail.models,
          version: detail.version,
          isActive: detail.isActive,
          estimatedCost: detail.estimatedCost,
        };
        sessionList.push(summary);
      } catch {
        // Skip malformed files
      }
    }
  }

  // Sort by last active, newest first
  sessionList.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));

  // Build project summaries
  buildProjectSummaries();

  // Merge active session info
  mergeActiveSessions();
}

// ── Session parsing ────────────────────────────────────────────────

function parseSessionFile(filePath: string, sessionId: string, project: string): SessionDetail {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n');
  const events: Record<string, unknown>[] = lines.map((l: string) => JSON.parse(l));

  const messages: Message[] = [];
  let title = '';
  let startedAt = '';
  let lastActiveAt = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreateTokens = 0;
  const models = new Set<string>();
  let version = '';
  let turnCount = 0;

  // Track per-model tokens for cost calculation
  const modelTokens = new Map<string, {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreate: number;
  }>();

  // Track seen UUIDs to avoid double-counting tokens from split assistant messages
  const seenAssistantUuids = new Set<string>();

  for (const event of events) {
    const type = event.type as string;
    const timestamp = event.timestamp as string || '';

    if (timestamp && (!startedAt || timestamp < startedAt)) {
      startedAt = timestamp;
    }
    if (timestamp && (!lastActiveAt || timestamp > lastActiveAt)) {
      lastActiveAt = timestamp;
    }

    if (type === 'ai-title') {
      title = event.aiTitle as string || '';
    }

    if (type === 'assistant') {
      const msg = event.message as Record<string, unknown> | undefined;
      if (!msg) continue;

      const uuid = event.uuid as string;
      const isNew = !seenAssistantUuids.has(uuid);
      if (uuid) seenAssistantUuids.add(uuid);

      const model = msg.model as string || '';
      if (model) models.add(model);

      if (isNew && msg.usage) {
        const usage = msg.usage as Record<string, unknown>;
        const input = (usage.input_tokens as number) || 0;
        const output = (usage.output_tokens as number) || 0;
        const cacheRead = (usage.cache_read_input_tokens as number) || 0;
        const cacheCreate = (usage.cache_creation_input_tokens as number) || 0;

        totalInputTokens += input;
        totalOutputTokens += output;
        totalCacheReadTokens += cacheRead;
        totalCacheCreateTokens += cacheCreate;

        // Track per-model tokens
        if (model) {
          const existing = modelTokens.get(model) || { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
          existing.input += input;
          existing.output += output;
          existing.cacheRead += cacheRead;
          existing.cacheCreate += cacheCreate;
          modelTokens.set(model, existing);
        }
      }

      const content = msg.content as ContentBlock[] | undefined;
      if (!content) continue;

      // Build message from content blocks
      let textContent = '';
      let thinking = '';
      const toolCalls: Message['toolCalls'] = [];

      for (const block of content) {
        if (block.type === 'text' && block.text) {
          textContent += block.text;
        } else if (block.type === 'thinking' && block.thinking) {
          thinking += block.thinking;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            name: block.name || 'unknown',
            input: block.input || {},
            id: block.id || '',
          });
        }
      }

      messages.push({
        id: uuid || '',
        type: 'assistant',
        role: 'assistant',
        content: textContent,
        timestamp,
        model,
        usage: isNew ? {
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          cache_read_input_tokens: totalCacheReadTokens,
          cache_creation_input_tokens: totalCacheCreateTokens,
        } : undefined,
        thinking: thinking || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        isMeta: false,
      });
    }

    if (type === 'user') {
      const msg = event.message as Record<string, unknown> | undefined;
      if (!msg) continue;

      const isMeta = event.isMeta as boolean || false;
      const origin = event.origin as Record<string, string> | undefined;
      const isHuman = origin?.kind === 'human';

      let content = '';
      const rawContent = msg.content;
      if (typeof rawContent === 'string') {
        content = rawContent;
      } else if (Array.isArray(rawContent)) {
        for (const block of rawContent as ContentBlock[]) {
          if (block.type === 'text' && block.text) {
            content += block.text;
          } else if (block.type === 'tool_result') {
            // Tool results - show a summary
            const resultContent = block.content;
            if (typeof resultContent === 'string') {
              content += `[Tool Result] ${resultContent.slice(0, 200)}`;
            } else if (Array.isArray(resultContent)) {
              const texts = resultContent
                .filter((c: ContentBlock) => c.type === 'text' && c.text)
                .map((c: ContentBlock) => c.text)
                .join('\n');
              content += `[Tool Result] ${texts.slice(0, 200)}`;
            }
          }
        }
      }

      // Skip meta messages (system-generated wrappers) unless they have content
      if (isMeta && !content.trim()) continue;

      messages.push({
        id: event.uuid as string || '',
        type: 'user',
        role: isHuman ? 'user' : 'tool',
        content,
        timestamp,
        isMeta,
      });
    }

    if (type === 'system' && event.subtype === 'turn_duration') {
      turnCount++;
      messages.push({
        id: event.uuid as string || '',
        type: 'system',
        role: 'system',
        content: '',
        timestamp,
        durationMs: event.durationMs as number,
        isMeta: false,
      });
    }

    if (event.version) {
      version = event.version as string;
    }
  }

  // Fallback title: first non-meta user message
  if (!title) {
    const firstUserMsg = messages.find(m => m.type === 'user' && m.role === 'user');
    if (firstUserMsg) {
      title = firstUserMsg.content.slice(0, 100).replace(/\n/g, ' ');
    }
  }
  if (!title) title = sessionId.slice(0, 8) + '...';

  // Compute estimated cost from per-model token usage
  let estimatedCost: number | null = null;
  let hasUnknownModel = false;
  for (const [model, tokens] of modelTokens) {
    const cost = computeCost(model, tokens.input, tokens.output, tokens.cacheRead, tokens.cacheCreate);
    if (cost === null) {
      hasUnknownModel = true;
    } else {
      estimatedCost = (estimatedCost || 0) + cost;
    }
  }
  // If any model has unknown pricing, mark the whole session as unknown
  if (hasUnknownModel && modelTokens.size > 0) {
    // If we have some known costs, keep them; if all unknown, null
    // We keep partial costs — only null if ALL models are unknown
    if (estimatedCost === null) estimatedCost = null;
  }

  // Parse subagents
  const subagentDir = path.join(path.dirname(filePath), sessionId, 'subagents');
  const subagents = parseSubagents(subagentDir);

  return {
    id: sessionId,
    title,
    project,
    startedAt,
    lastActiveAt,
    messageCount: messages.length,
    turnCount,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreateTokens,
    models: Array.from(models),
    version,
    isActive: false,
    estimatedCost,
    messages,
    subagents,
  };
}

// ── Subagent parsing ───────────────────────────────────────────────

function parseSubagents(subagentDir: string): SubagentInfo[] {
  if (!fs.existsSync(subagentDir)) return [];

  const subagents: SubagentInfo[] = [];
  const files = fs.readdirSync(subagentDir);

  for (const file of files) {
    if (file.endsWith('.meta.json')) {
      const agentId = file.replace('.meta.json', '');
      const metaPath = path.join(subagentDir, file);
      const transcriptPath = path.join(subagentDir, `${agentId}.jsonl`);

      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const messages: Message[] = [];

        if (fs.existsSync(transcriptPath)) {
          const raw = fs.readFileSync(transcriptPath, 'utf-8');
          const lines = raw.trim().split('\n');
          for (const line of lines) {
            const event = JSON.parse(line);
            if (event.type === 'user') {
              const msg = event.message as Record<string, unknown> | undefined;
              const content = typeof msg?.content === 'string' ? msg.content : '';
              messages.push({
                id: event.uuid || '',
                type: 'user',
                role: 'user',
                content,
                timestamp: event.timestamp || '',
                isMeta: event.isMeta || false,
              });
            } else if (event.type === 'assistant') {
              const msg = event.message as Record<string, unknown> | undefined;
              const content = msg?.content as ContentBlock[] | undefined;
              let textContent = '';
              if (content) {
                for (const block of content) {
                  if (block.type === 'text' && block.text) textContent += block.text;
                }
              }
              messages.push({
                id: event.uuid || '',
                type: 'assistant',
                role: 'assistant',
                content: textContent,
                timestamp: event.timestamp || '',
                model: msg?.model as string,
                isMeta: false,
              });
            }
          }
        }

        subagents.push({
          id: agentId,
          agentType: meta.agentType || 'unknown',
          description: meta.description || '',
          toolUseId: meta.toolUseId || '',
          spawnDepth: meta.spawnDepth || 0,
          messages,
        });
      } catch {
        // Skip malformed subagent files
      }
    }
  }

  return subagents;
}

// ── Project summaries ──────────────────────────────────────────────

function buildProjectSummaries(): void {
  projects = new Map();

  for (const session of sessionList) {
    const existing = projects.get(session.project);
    if (existing) {
      existing.sessionCount++;
      existing.totalTokens += session.totalInputTokens + session.totalOutputTokens;
      if (session.estimatedCost !== null && existing.totalCost !== null) {
        existing.totalCost = (existing.totalCost || 0) + session.estimatedCost;
      } else if (session.estimatedCost === null) {
        existing.totalCost = null; // unknown if any session is unknown
      }
      if (session.lastActiveAt > existing.lastActive) {
        existing.lastActive = session.lastActiveAt;
      }
    } else {
      projects.set(session.project, {
        name: path.basename(session.project) || session.project,
        path: session.project,
        sessionCount: 1,
        totalTokens: session.totalInputTokens + session.totalOutputTokens,
        totalCost: session.estimatedCost,
        lastActive: session.lastActiveAt,
      });
    }
  }
}

// ── Active sessions ────────────────────────────────────────────────

function mergeActiveSessions(): void {
  if (!fs.existsSync(SESSIONS_DIR)) return;

  const sessionFiles = fs.readdirSync(SESSIONS_DIR);
  for (const file of sessionFiles) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8'));
      const sessionId = data.sessionId;
      const session = sessions.get(sessionId);
      if (session) {
        session.isActive = true;
      }
      // Also update the summary
      const summary = sessionList.find(s => s.id === sessionId);
      if (summary) {
        summary.isActive = true;
      }
    } catch {
      // Skip
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function decodeProjectName(dirName: string): string {
  const inner = dirName.substring(1); // strip leading '-'

  const windowsMatch = inner.match(/^([A-Za-z]):-(.+)$/);
  if (windowsMatch) {
    const drive = windowsMatch[1];
    const rest = windowsMatch[2];
    // Try naive Windows decode
    const naiveWin = `${drive}:\\${rest.replace(/-/g, '\\')}`;
    if (fs.existsSync(naiveWin)) return naiveWin;

    // Try segment-by-segment for Windows
    const parts = rest.split('-');
    let bestPath = `${drive}:`;
    for (let i = 0; i < parts.length; i++) {
      const tryPath = bestPath + '\\' + parts.slice(0, i + 1).join('\\');
      if (fs.existsSync(tryPath)) {
        bestPath = tryPath;
      } else if (bestPath) {
        const remainder = parts.slice(i).join('-');
        const fullPath = bestPath + '\\' + remainder;
        if (fs.existsSync(fullPath)) return fullPath;
      }
    }
    return naiveWin; // fallback
  }

  // Unix path
  const naive = '/' + inner.replace(/-/g, '/');
  if (fs.existsSync(naive)) return naive;

  // Try to find the real path by checking if parent segments exist
  const parts = inner.split('-');
  let bestPath = '';
  for (let i = 0; i < parts.length; i++) {
    const tryPath = '/' + parts.slice(0, i + 1).join('/');
    if (fs.existsSync(tryPath)) {
      bestPath = tryPath;
    } else if (bestPath) {
      const remainder = parts.slice(i).join('-');
      const fullPath = bestPath + '/' + remainder;
      if (fs.existsSync(fullPath)) return fullPath;
    }
  }
  return naive; // fallback
}

// ── Stats helpers ──────────────────────────────────────────────────

export function getTokenSeries(range: string): TokenSeries[] {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 365;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const dailyMap = new Map<string, { input: number; output: number }>();

  for (const session of sessionList) {
    const date = session.startedAt.slice(0, 10);
    if (new Date(date) < cutoff) continue;

    const existing = dailyMap.get(date) || { input: 0, output: 0 };
    existing.input += session.totalInputTokens;
    existing.output += session.totalOutputTokens;
    dailyMap.set(date, existing);
  }

  const series: TokenSeries[] = [];
  for (const [date, tokens] of dailyMap) {
    series.push({
      date,
      input: tokens.input,
      output: tokens.output,
      total: tokens.input + tokens.output,
    });
  }

  series.sort((a, b) => a.date.localeCompare(b.date));
  return series;
}

export function getModelStats(): ModelStats[] {
  const modelMap = new Map<string, { count: number; totalTokens: number }>();

  for (const session of sessionList) {
    for (const model of session.models) {
      const existing = modelMap.get(model) || { count: 0, totalTokens: 0 };
      existing.count++;
      existing.totalTokens += session.totalInputTokens + session.totalOutputTokens;
      modelMap.set(model, existing);
    }
  }

  return Array.from(modelMap.entries())
    .map(([model, stats]) => ({ model, ...stats }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export function getDailyStats(): DailyStats[] {
  const dailyMap = new Map<string, { sessions: number; tokens: number; cost: number | null; models: Set<string> }>();

  for (const session of sessionList) {
    const date = session.startedAt.slice(0, 10);
    const existing = dailyMap.get(date) || { sessions: 0, tokens: 0, cost: 0, models: new Set<string>() };
    existing.sessions++;
    existing.tokens += session.totalInputTokens + session.totalOutputTokens;
    if (existing.cost !== null && session.estimatedCost !== null) {
      existing.cost += session.estimatedCost;
    } else if (session.estimatedCost === null) {
      existing.cost = null;
    }
    for (const model of session.models) {
      existing.models.add(model);
    }
    dailyMap.set(date, existing);
  }

  return Array.from(dailyMap.entries())
    .map(([date, stats]) => ({
      date,
      sessions: stats.sessions,
      tokens: stats.tokens,
      cost: stats.cost,
      models: Array.from(stats.models),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getOverview(): OverviewStats {
  const totalSessions = sessionList.length;
  const totalTokens = sessionList.reduce((sum, s) => sum + s.totalInputTokens + s.totalOutputTokens, 0);
  const totalProjects = projects.size;
  const activeSessions = sessionList.filter(s => s.isActive).length;

  // Compute total cost
  let totalCost: number | null = null;
  let hasUnknownCost = false;
  for (const session of sessionList) {
    if (session.estimatedCost === null) {
      hasUnknownCost = true;
    } else {
      totalCost = (totalCost || 0) + session.estimatedCost;
    }
  }
  // If any session has unknown cost, mark total as unknown
  if (hasUnknownCost && totalCost === null) totalCost = null;

  const modelMap = new Map<string, { count: number; totalTokens: number }>();
  for (const session of sessionList) {
    for (const model of session.models) {
      const existing = modelMap.get(model) || { count: 0, totalTokens: 0 };
      existing.count++;
      existing.totalTokens += session.totalInputTokens + session.totalOutputTokens;
      modelMap.set(model, existing);
    }
  }

  const topModels = Array.from(modelMap.entries())
    .map(([model, stats]) => ({ model, ...stats }))
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 5);

  const recentActivity = sessionList.slice(0, 10);

  return {
    totalSessions,
    totalTokens,
    totalProjects,
    activeSessions,
    totalCost,
    topModels,
    recentActivity,
  };
}
