# Staff server configuration (Node.js 20+)

The original site is static. Internal rates **cannot** be protected by front-end passwords or a hidden HTML page. This server keeps master rates outside the static web root and requires environment-provided credentials. It provides role-based authorization, effective-date checks, server-side quote calculation, a change approval queue, and append-only audit records. It does **not** create reservations.

Create scrypt hash with a fresh salt:

```bash
node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'your-unique-strong-password'
```

Set `STAFF_USERNAME`, `STAFF_PASSWORD_HASH`, `SESSION_SECRET` (random 32+ characters), `STAFF_ROLE` (`admin` or `attendant`) and `NODE_ENV=production` only behind an HTTPS reverse proxy. Run `node server/server.js`. Do not place these values in client scripts, commits, or public file archives. The sample private/internal-rates.json has **zero** price records. Keep any imported source rates and affiliate contracts in a protected server-only location. Password storage/secret management and external identity provider integration should be independently security-reviewed before public deployment. In-memory sessions reset at restart and are intended for a single-instance preview, not distributed production.

Admin change proposals go to `private/pending-review.json` and the audit log; they never automatically publish. Final approval workflow and reviewer identity still require integration. Route pricing and account-specific contracts must be sourced and approved first.
