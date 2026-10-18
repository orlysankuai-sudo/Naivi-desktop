# Optional remote relay integration

These sources belong to Naivi Public Beta 4.0. They are an integration module, not a standalone authentication or mail service. The default desktop client uses the studio relay. Self-hosting requires replacing the official origin/API addresses in the desktop and portal, and testing your own account service.

Use Node.js 20+ and an existing Express 4 application. Install its dependencies in your host project; the desktop does not need Express. Mount JSON parsing for this route **before** any smaller global JSON parser:

```js
const { mountRemote } = require('./remote.js');
app.use('/api/naivi/remote', express.json({ limit: '2mb' }));
mountRemote(app, {
  auth: requireSignedInUser,
  dataDir: '/srv/naivi-private/remote',
  send: async (email, subject, summary) => {
    const result = await mailer.sendMail({ from: process.env.MAIL_FROM,
      to: email, subject, text: summary });
    return result.accepted.includes(email);
  }
});
app.use('/agent/assets', express.static('./portal'));
app.get('/agent/remote/:id', (req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY' });
  res.sendFile(require('node:path').resolve('./portal/remote.html'));
});
```

`requireSignedInUser` must validate the host's session/JWT, reject unauthenticated requests, and set `req.user.email` from the **verified account**, never from the request body. Completion summaries go only to that account. Use a plain-text mail body or escape HTML. Configure SMTP through environment variables or the host's secret store.

Deploy behind HTTPS. Keep the private data directory outside all static roots, owned by the service user. Do not log authorization headers or request bodies. Preserve the portal's Content Security Policy. Configure allowed origins and returned URLs in `remote.js` for your own host. Do not use permissive CORS.

This file-backed relay assumes **one server process and one writer**. Do not run multiple workers against the same directory. Use a transactional database/queue before scaling. Expiry is enforced on every access; expired files are cleaned when a new task is created. You can also schedule removal of expired records. Revoked records have prompts and outputs cleared.

The server stores encrypted commands/outputs, account email and capability hashes. The local app performs the final KEY, message expiry and replay checks. Plaintext completion summaries necessarily pass through SMTP. A compromised relay website could steal a KEY entered into it; encrypted payloads do not protect against a compromised browser or OS.

The test files under `tests/` exercise the relay, real portal WebCrypto code and desktop protocol with a mock mail sender. Run them from an environment with Express installed:

```text
node --test server/tests/*.test.cjs
```

They do not prove production inbox delivery or production TLS configuration. Complete a real signed-in task, verify the resulting local file, and verify the recipient's email before publishing your deployment.
