# Claude Dashboard

A dashboard for Claude Code session analytics and conversation browsing — token usage, cost tracking, model distribution, activity heatmaps, and session history, all in one local app.

## Usage

Install globally, then run it anytime:

```bash
npm install --location=global claude-usage-stats
claude-usage-stats
```

Or run it once without installing:

```bash
npx claude-usage-stats
```

Either way, this starts a local server and opens the dashboard in your browser automatically.

## Features

- **Dashboard** — total sessions, tokens, estimated cost, active projects, and models at a glance
- **Cost forecast** — projected monthly spend based on your current usage rate
- **Activity heatmap** — 52-week GitHub-style grid of your session activity
- **Analytics** — hourly usage patterns, tool call frequency, cache efficiency, session length trends
- **Token usage charts** — input/output token consumption over 7 days, 30 days, or all time
- **Model distribution** — see which Claude models you use and how often
- **Project breakdown** — usage and cost ranked by project
- **Session browser** — search and filter all your Claude Code sessions
- **Global search** — full-text search across all conversation content
- **Bookmarks** — pin sessions for quick access
- **Budget alerts** — set a monthly spend limit with live progress tracking
- **CSV export** — download your session data
- **Dark / light mode** — toggle from the sidebar

## How it works

Claude Dashboard reads your local Claude Code session data (`~/.claude/projects/`) and serves it through a lightweight local server — nothing leaves your machine.

## License

MIT © [Bhavy Ladani](mailto:bhavy.ladani6701@gmail.com)
