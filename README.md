# Naivi Desktop · Public Beta 4.0.1

**Naivi — A Cygnus Automation Project**
By **SanGuai Culture Studio / SanGuai Inc. HK**

An experimental desktop workspace for collaborating agents. Connect your own compatible models, work with local projects, and inspect actual handoffs and results. Agents are orchestration roles, not separately trained foundation models.

[Website and Windows download](https://cygnus.sankuai.asia/agent) · [Source](https://github.com/orlysankuai-sudo/Naivi-desktop)

## Install

Use the Windows installer for a per-user installation, or extract the **entire** portable Windows x64 ZIP and open `Naivi.exe`. Keep its DLLs and `resources` directory together. This beta is not code-signed. Replacing the application folder does not remove conversations stored in the application data directory.

Choose English, Hong Kong Traditional Chinese or Simplified Chinese, review the terms, then sign in or continue as a guest. Gmail sign-in is temporarily unavailable due to studio SMTP delivery limitations. Guests can use local chats, models and projects. Remote tasks and PHI Snap sharing require sign-in.

In **Settings → Models**, add your own endpoint, model ID and API key. Include `/v1` in the base URL when required by your provider. Naivi appends `/chat/completions` for OpenAI-compatible endpoints or `/messages` for Anthropic. A display name does not change the actual API model ID. Use **Test connection** to check compatibility.

For agent collaboration, select two to four different models. Assisted search requires exactly one selected model. Single-model role testing is available explicitly in advanced settings. The studio does not distribute API credentials.

## What's in 4.0.1

- Optional sign-in; local guest storage is separate from signed-in profiles.
- Unlimited-by-Naivi output by default, or a custom per-call token cap. Provider limits still apply. Anthropic requires `max_tokens`: Naivi uses model metadata or the supported capacity you enter, never an arbitrary hidden fallback. Partial output is retained and can be continued.
- Settings retain a draft across tabs. Reading size and fonts preview immediately; Save applies changes and closing discards the draft.
- Focused, comfortable and wide reading layouts; black/paper/system themes; five accents and local custom CSS.
- Collapsible sidebars, growing input, live-edge scrolling and notifications visible above settings.
- Right-click a recent conversation, or press Shift+F10, to share, rename, export or delete.
- Existing or empty project folders, direct file creation/editing, reviewed code proposals, CodeWiki snapshots and conflict-aware rollback. Open projects in VS Code or File Explorer.
- Encrypted, revocable 72-hour remote tasks for signed-in users, with completion emails.

## Web search and assisted search

Open **Settings → Search**, save your own Tavily API key and test the saved connection. Keys use the same OS-encrypted vault as model credentials and never return in bootstrap data. Naivi does not bundle the studio's search key. Search credits and model tokens are separate charges.

- **Assisted search**: select exactly one model below the composer. It prepares public queries, Tavily supplies sources, and the same model answers. Two model calls; no other agents, independent review, Niv, memory extraction or project edits.
- **Agent collaboration**: choose Off, Auto or On in search settings. Selected agents share the same search evidence before drafting and review. Auto lets the planner decide whether current outside facts are needed.
- Choose 1–4 queries and 1–10 credits per answer. Basic search and optional extraction are bounded by this request budget; also set your Tavily account's spending limits. Failed requests may still be counted conservatively by the local budget.
- Public queries are planned from the current request, without project files or stored memories. Do not put secrets in requests intended for public search. Web excerpts are untrusted data and cannot grant tool permissions.
- Source cards label page excerpts versus search snippets, include read timestamps and preserve supplied publication dates. Retrieved excerpts are clipped to fit context, and citations still require checking. Missing pages, empty searches and unavailable services are never described as verified evidence.

**Settings → Usage** shows provider-reported input/output/cache counts for retained local history. Missing reports are labeled as incomplete; no guessed token totals are presented as exact. Cached input is a subset of input. Search credits are shown separately per answer. Providers and invoices remain authoritative.

Math supports common LaTeX inline and display notation through KaTeX. Code blocks are highlighted, copyable and foldable. Fenced `svg` blocks preview inside a scriptless sandbox after sanitization; external resources, foreign objects and active SVG content are removed. Plain HTML is not executable. Unsupported TeX remains visible with an error indication.

## Agents and workflows

Phiel frames and synthesizes tasks. Velo handles code proposals and writing; literary requests receive a distilled craft reference, not copied stories or factual authority. Avis activates for images through a vision-capable provider. Niv selects relevant preferences and briefs Phiel after the main draft. Aeri remains planned.

Minimal uses a draft, one review and synthesis without Niv. Standard adds scope and optional personalization. Complex adds more selected-model reviews. Model agreement does not prove correctness. Records show explicit work summaries and results, not private chain-of-thought. This beta does not autonomously browse the web.

## Remote tasks

1. Sign in and select models and, optionally, a project folder.
2. Open **Settings → Account & help → Remote tasks**.
3. Read the local authorization. A project task permits automatic project edits and explicit terminal commands. Save the separate KEY when it is shown; it is not placed in the URL.
4. Keep Naivi running and the computer awake. Visit the link from another device and enter the KEY to view outputs and submit prompts.
5. Prefix a command with `/terminal ` to run it explicitly. Windows uses PowerShell with your account permissions, **not a sandbox**. The selected project is the working directory, but commands can access other locations allowed to your account. Commands time out after two minutes; termination cannot undo external side effects.
6. Each completed prompt or command emails a summary to the signed-in address. The portal reports whether the mail service accepted it; inbox delivery depends on the recipient provider.
7. Revoke tasks from the desktop. Links expire after 72 hours. Queued commands must start within 10 minutes. Commands are not automatically re-executed after a crash.

The 256-bit KEY is generated locally and stored in the OS-encrypted vault. The relay receives a hash of a derived access capability, not the KEY. Prompts and outputs use AES-256-GCM with task-bound authenticated data. The local app checks every command and records used identifiers. A separate device capability polls and reports results. Email summaries are plaintext to the studio mail service, not end-to-end encrypted. See [SECURITY.md](SECURITY.md).

## Develop

Use Node.js 24.3 or newer and npm. Electron supplies SQLite for the desktop app.

```text
npm ci
npm test
npm run vendor
npm start
npm run package
npm run installer
```

The executable is built in `dist/4.0.1/Naivi-win32-x64/`. Tests, reports and developer scripts are excluded from the app archive. `src/core` contains providers, routing, orchestration, data, projects and remote encryption. `src/renderer` contains the interface and locale copy. `server/` contains optional relay integration and portal sources.

Never commit application profiles, `.env`, API keys, signing keys or production data. Live model tests require your own credentials; ordinary tests do not make paid model calls.

## License

Source available under **PolyForm Noncommercial License 1.0.0**. Copyright 2026 SanGuai Culture Studio / SanGuai Inc. HK. Commercial use requires a separate written license from the studio. This is **not MIT** or unrestricted open-source licensing. Third-party dependencies and fonts retain their own licenses. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
