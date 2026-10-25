# Dokploy trial app

A tiny Node app (no dependencies) for trying Dokploy without host mode:
Cloudflare Tunnel → Traefik (port 80) → the container.

The page shows the version, the container name (it changes on each deploy),
when it started, the domain asked for, and a check of another app.

## Settings

- Build: Nixpacks (or any Node 20+), start command `npm start`
- Container port: `3000` (or set `PORT`)
- `BACKEND_URL` (optional): another app on the Dokploy network, for example
  `http://trial-backend-abc123:3000`. The page shows whether it answers.

`/health` answers with JSON: `{ ok, version, host }`.

To check that a deploy goes live by itself, change `VERSION` in
`server.js`, push, and watch the page.
