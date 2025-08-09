# SpiderFoot Integration Guide

This app ships with a packaged SpiderFoot engine and a thin Node proxy. It supports starting scans, polling progress, browsing results, and aborting/deleting scans.

## Quick facts
- Wrapper: `server/spiderfoot/spiderfoot_wrapper.py`
- DB file: `/var/www/anatscrawler/spiderfoot.db` (created if missing)
- Modules dir (detected):
  - `/var/www/anatscrawler/modules` (symlink to `server/spiderfoot/modules/`)
  - Fallbacks include `server/spiderfoot/modules`
- Python venv: `/var/www/anatscrawler/app/maigret-venv`
- PYTHONPATH: set at runtime to include `server/spiderfoot` and the venv `site-packages` directory
- BeautifulSoup4: installed during deploy (latest)

## Deployment requirements
Already handled by CI workflow (`.github/workflows/deploy.yml`):
- Create and activate `maigret-venv`
- `pip install --upgrade pip networkx beautifulsoup4`
- Runtime sets `PYTHONPATH` to include `server/spiderfoot` and autodetected `maigret-venv/lib/pythonX.Y/site-packages`

## Directory structure (prod)

```text
/var/www/anatscrawler/
├── app/                      # Deployed app root
│   ├── server/               # Contains wrapper + SpiderFoot core
│   ├── modules -> server/spiderfoot/modules/
│   └── maigret-venv/         # Python venv
├── spiderfoot.db             # SpiderFoot SQLite DB
└── spiderfoot_scanmeta.json  # Scan metadata (enabled modules)
```

## API endpoints (Node proxy)
Base: `/api/spiderfoot`
- POST `/scan/start` { target, name } → `{ scanId, success }`
- GET  `/scanlist` → `{ scans: [...] }` (array rows enhanced with correlation counts)
- GET  `/scan/:scanId/status` → normalized object `{ name, target, created, started, ended, status [, modules] }`
- GET  `/scan/:scanId/summary` → array of `[type, descr, last_seen, total, unique]`
- GET  `/scan/:scanId/browse`
- GET  `/scan/:scanId/graph`
- GET  `/scan/:scanId/events`
- GET  `/scan/:scanId/logs` → structured log objects `{ generated, component, type, message, rowId }`
- POST `/scan/:scanId/abort` → sets `ABORT-REQUESTED` then forces `ABORTED` if needed
- POST `/scan/:scanId/delete`

Debug endpoints (added for troubleshooting):
- GET `/scan/:scanId/eventcount` → `{ scan_id, count }`
- GET `/scan/:scanId/lastlog` → `{ scan_id, latest_log_ts }`

## Frontend behavior
- Scans list auto-refresh (configurable) while any scan is running; statuses normalized to `running/finished/error/aborted/abort-requested`.
- Scan Details page auto-refresh with a manual "Refresh now" button. Header shows a short list of enabled modules for visibility.
- Logs tab renders live, structured entries.

### Cross-function dependencies (end-to-end data flow)
- **Storage dependency**: The wrapper always adds `sfp__stor_db`. Without it, no results persist. Frontend depends on persisted results for all tabs.
- **Status normalization**: `server/routes/spiderfoot.ts` normalizes `[name, target, created, started, ended, status]` into an object for `/status`. Frontend tolerates both shapes but expects the object.
- **Correlation counts**: The scans list augments rows by calling `/scan/:scanId/correlationsummary`. This means the list depends on per-scan queries; caching is enabled in `server/spiderfoot.service.js`.
- **Modules metadata**: `spiderfoot_scanmeta.json` stores enabled modules per scan; `/status` attaches `modules` if present so the UI can show them.
- **Graph**: `/graph` returns data but the UI has a TODO for visualization. Downstream features that rely on graph visualization are currently blocked.

## Baseline modules
If many modules require API keys, the wrapper enables a safe baseline so scans always do useful work:
- `sfp_dnsresolve`, `sfp_whois`, `sfp_subdomain`, `sfp_ipaddr`, `sfp_httpheaders`, `sfp_sslcert`, `sfp_spider`, plus `sfp__stor_db`.
- API-key modules are filtered unless explicitly permitted in the baseline allowlist.

### Notes on module flags
- Modules marked with `apikey` are skipped by default unless allowlisted in the wrapper. Add your keys and relax the filter as needed.
- Some bundled community modules contain minimal "stub" methods (e.g., `notifyListeners`). These do not break scans but may limit advanced behavior. Consider pruning or hardening as you productionize.

## Abort semantics
- Abort sets status `ABORT-REQUESTED` and waits briefly. If no transition, the wrapper forces `ABORTED` to avoid stuck state.

## Common issues and checks
1) No data/empty results
- Check event count and last log time via debug endpoints.
- Verify `spiderfoot.db` mtime updates while a scan is running.
- Confirm Modules list appears in the details header (from `spiderfoot_scanmeta.json`).

2) Import/path errors
- Ensure `maigret-venv` exists and contains site-packages.
- Confirm the symlink `/var/www/anatscrawler/modules` points to `app/server/spiderfoot/modules`.

3) Permissions
- DB write errors will stop scans from persisting. Fix ownership: `sudo chown -R ituu:ituu /var/www/anatscrawler`.

## Manual wrapper usage (on server)

```bash
cd /var/www/anatscrawler/app
python3 server/spiderfoot/spiderfoot_wrapper.py list_scans
python3 server/spiderfoot/spiderfoot_wrapper.py start_scan example.com "Example Scan"
python3 server/spiderfoot/spiderfoot_wrapper.py scan_info <SCAN_ID>
python3 server/spiderfoot/spiderfoot_wrapper.py scan_event_count <SCAN_ID>
python3 server/spiderfoot/spiderfoot_wrapper.py scan_logs <SCAN_ID>
```

## Notes
- The wrapper prints verbose stderr logs for diagnosis; Node captures them into PM2 logs.
- The DB schema is SpiderFoot-native; we only normalize responses at the proxy layer.

## Gaps and risks (current)
- Graph tab in the UI is not implemented yet (visualization placeholder).
- Per-row correlation counts in the scans list trigger additional calls for each scan; caching mitigates but consider batching.
- A minor bug exists in `server/routes/spiderfoot.ts` under `/scan/:scanId/eventcount` (a stray, incomplete call). It should be simplified to `res.json(await spiderfoot.scanEventCount(id))`.
- Several third-party modules ship with stubbed methods; prefer enabling vetted modules first.
- Data shape variance: endpoints return arrays in some cases (SpiderFoot-native). The router partially normalizes; keep this consistent to avoid frontend conditionals.

## Staged improvements plan (including MISP)

Stage 0 — Baseline hardening (now)
- Ensure `maigret-venv` and `PYTHONPATH` discovery are correct on prod (already handled by deploy.yml).
- Confirm `/var/www/anatscrawler/modules` symlink exists and points to `app/server/spiderfoot/modules`.
- Fix the `/scan/:scanId/eventcount` route implementation (see bug above).
- Normalize all API responses to objects where possible (status, correlations) to remove frontend fallbacks.

Stage 1 — UI completeness
- Implement Graph tab rendering or hide the tab until implemented.
- Show enabled modules (first N with overflow) consistently on list and details.
- Add "Abort" and "Delete" buttons in details view wired to `/abort` and `/delete` endpoints.

Stage 2 — Performance and robustness
- Increase cache TTL for scan list if needed; add ETag/Last-Modified for logs.
- Add backoff and retries in the Node proxy for wrapper calls.
- Add a health endpoint that calls `list_modules` and returns an OK when wrapper is reachable.

Stage 3 — MISP read-only enrichment (recommended starting point)
- Scope: Query your MISP for related events/attributes given the SpiderFoot results.
- Config (env on server):
  - `MISP_URL` (e.g., `https://misp.local`)
  - `MISP_API_KEY`
  - `MISP_VERIFY_TLS` (default true)
  - `MISP_TIMEOUT_MS` (default 10000)
- Service: add `server/misp.service.ts` (or `.js`) to call MISP REST (event/attributes search) for IOC types: domain, hostname, IP, email, hash.
- Endpoints:
  - `GET /api/misp/ping` → basic connectivity
  - `POST /api/misp/search` body `{ value, type? }` → attributes/events
  - `GET /api/spiderfoot/scan/:scanId/enrich/misp` → derives unique IOCs from `/browse` or `/events`, queries MISP in parallel, returns matches keyed by IOC.
- UI:
  - Show MISP hit badges in Browse (e.g., count of matching events, highest threat level).
  - Summary card: total MISP hits, by risk/tag.
- Caching: cache per-IOC hits (Redis if available) to avoid repeated calls.

Stage 4 — MISP bidirectional (optional)
- Allow publishing selected SpiderFoot results to a new or existing MISP Event (admin-only, audited):
  - Endpoint: `POST /api/misp/publish` with `{ scanId, attributeMap, eventId? }`.
  - Map SpiderFoot event types to MISP attribute types (domain/ip/email/hash/hostname/url).
  - "Dry-run" flag to preview the publish payload.

Stage 5 — Cross-scan correlations
- Store MISP `event_id` hits alongside SpiderFoot scan IDs.
- Extend `/scanlist` to include a count of MISP-linked correlations per scan.
- New endpoint: `/api/spiderfoot/correlate/misp?eventId=...` → list scans and entities connected to a given MISP event.

Stage 6 — Operations and security
- Add rate-limiting for MISP queries and circuit breaker on failures.
- Secrets in environment only; no keys in repo.
- Optional: anonymize/store-hash-only for PII categories.

## MISP quick-start (summary)
1) Set environment on server: `MISP_URL`, `MISP_API_KEY`, `MISP_VERIFY_TLS`, `MISP_TIMEOUT_MS`.
2) Add `server/misp.service.ts` and routes `server/routes/misp.ts`.
3) Wire enrichment endpoint `/api/spiderfoot/scan/:scanId/enrich/misp`.
4) Update UI Browse and Summary to display MISP hits.
5) Validate on a local scan (e.g., target domain) and confirm query volume, timeouts, and TLS.
