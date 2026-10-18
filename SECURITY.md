# Security boundaries

Report vulnerabilities privately using the studio support channel on the official website. Do not post credentials, task KEYs or private data in public issues.

- The renderer is sandboxed with no Node integration. Desktop operations use sender-validated IPC. Model markup is escaped or allowlisted and cannot invoke desktop tools.
- Provider keys and task secrets use Electron safeStorage. Saved API keys never return to the renderer. An unlocked Windows account is not a security boundary.
- Normal edits and rollback validate paths, reject sensitive paths and symlinks, compare snapshots and ask for confirmation. Remote project edits require prior task authorization.
- Remote terminal execution is deliberately powerful: it is **not filesystem-contained or isolated**. Grant it only on a trusted computer. A compromised OS, gateway or relay website can undermine these protections.
- Remote messages are authenticated, encrypted, bound to a task ID and locally checked for expiry and replay. Wrong access capabilities are rate-limited. Revocation aborts the active local task and denies new relay access.
- Deploy the relay behind HTTPS. It stores encrypted outputs, capability hashes and recipient emails. Completion summaries pass through SMTP in plaintext. Limits: five active tasks per account, 100 commands per task and 20 retained outputs.
- A crash does not trigger automatic command replay. Check actual side effects before submitting a replacement command. Terminal process termination cannot roll back external effects.
- Imported material and model outputs are untrusted. They cannot change task permissions, select another project or change the recipient. Only an explicit user prompt beginning `/terminal ` enters the terminal path.
- API and transport limits still apply with application token limits disabled. Truncation is incomplete output, never a completed answer.

Before publishing, exclude profiles and logs, scan archives for credentials, test wrong-key/expiry/replay cases and verify download hashes. Keep TLS verification enabled.
