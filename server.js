// A tiny test app for trying Dokploy without host mode: Traefik routing,
// deploys that go live by themselves, and one app reaching another by its
// internal name. No dependencies.
//
//   PORT         the port to listen on (default 3000)
//   BACKEND_URL  optional: another app to check, e.g. http://trial-backend-abc123:3000
const http = require('http')
const os = require('os')

const VERSION = '1'
const PORT = Number(process.env.PORT) || 3000
const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/+$/, '')
const STARTED = new Date()

async function checkBackend() {
  if (!BACKEND_URL) return { state: 'off', text: 'BACKEND_URL is not set.' }
  try {
    const r = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) })
    const body = await r.json()
    return { state: 'ok', text: `Reached ${BACKEND_URL}: version ${body.version}, container ${body.host}.` }
  } catch (e) {
    return { state: 'fail', text: `Could not reach ${BACKEND_URL}: ${e.message}` }
  }
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, version: VERSION, host: os.hostname() }))
  }
  const b = await checkBackend()
  const colour = { ok: '#047857', fail: '#b91c1c', off: '#78716c' }[b.state]
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
  res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dokploy trial</title>
<style>
  body { font-family: system-ui, sans-serif; background: #faf7f0; color: #1c1917; margin: 0; padding: 3rem 1.25rem; }
  main { max-width: 36rem; margin: auto; background: #fff; border: 1px solid #e7e5e4; border-radius: 1rem; padding: 1.75rem; }
  h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; margin: 1.25rem 0 0; }
  dt { color: #78716c; } dd { margin: 0; font-weight: 600; word-break: break-all; }
</style></head>
<body><main>
  <h1>Dokploy trial app</h1>
  <p style="margin:0;color:#57534e">If you can read this, Cloudflare Tunnel → Traefik → this container works.</p>
  <dl>
    <dt>Version</dt><dd>${VERSION}</dd>
    <dt>Container</dt><dd>${esc(os.hostname())}</dd>
    <dt>Started</dt><dd>${STARTED.toISOString()}</dd>
    <dt>Domain asked for</dt><dd>${esc(req.headers.host || '')}</dd>
    <dt>Backend check</dt><dd style="color:${colour}">${esc(b.text)}</dd>
  </dl>
</main></body></html>`)
}).listen(PORT, '0.0.0.0', () => console.log(`Trial app version ${VERSION} on port ${PORT}`))
