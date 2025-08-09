# Architecture, Gaps, Mock Data, and Staged Plan (incl. MISP)

## High-level architecture

- **Frontend**: React (TypeScript), Wouter routing. Key OSINT UI pages:
  - `client/src/pages/ScanListPage.tsx`: lists scans (SpiderFoot)
  - `client/src/pages/ScanDetailsPage.tsx`: details for a scan
  - Dashboard and history pages with charts (some using mock data)
- **Backend**: Express routes; SpiderFoot proxy in `server/routes/spiderfoot.ts` delegating to `server/spiderfoot.service.js` which executes `server/spiderfoot/spiderfoot_wrapper.py`.
- **SpiderFoot**: Packaged under `server/spiderfoot/` with a custom wrapper for starting scans, listing data, and normalizing responses.
- **Data**: SpiderFoot SQLite DB `spiderfoot.db` (path auto-detected with fallbacks), plus `spiderfoot_scanmeta.json` for enabled modules per scan.

## End-to-end scan flow

1. Frontend starts a scan via `POST /api/spiderfoot/scan/start` with `{ target, name }`.
2. Backend calls Python wrapper `start_scan`, which:
   - Loads modules, applies an allowlist, always adds `sfp__stor_db`.
   - Creates DB schema if missing, registers scan ID, starts a child process to run the scan.
   - Persists metadata (enabled modules) to `spiderfoot_scanmeta.json`.
3. Frontend polls:
   - `/status`, `/summary`, `/browse`, `/graph`, `/logs`, `/correlationsummary`.
4. Scans list uses `/scanlist`, which augments rows with correlation counts by per-scan calls.

## Cross-function dependencies

- Storage: UI depends on `sfp__stor_db` for persisted results (wrapper enforces it).
- Status shape: Router normalizes arrays to objects for `/status`; keep consistent to reduce UI fallback code.
- Correlation counts: List view kicks additional per-scan calls; caching exists in `server/spiderfoot.service.js`.
- Modules metadata: Read from `spiderfoot_scanmeta.json` in `/status` for UI display.
- Graph: Backend provides data but UI tab is a placeholder; any features relying on graph remain blocked.

## Mock data inventory (frontend)

- `client/src/pages/HistoryPage.tsx`: analytics charts (`activityTrendData`, `moduleUsageData`, `accountChangesData`) are mock arrays.
- Other dashboards likely show static counters/summaries; replace as real endpoints emerge.

Planned replacement:
- Provide real aggregates from backend (Mongo or SpiderFoot-derived) for charts, or hide analytics sections until wired.

## Known issues and risks

- Graph visualization not implemented.
- Router bug fixed: `/scan/:scanId/eventcount` now correctly returns `scanEventCount` result.
- Response shape variance across endpoints causes UI conditionals; standardize to objects in router.
- Community modules with stubbed methods may limit behavior; prefer vetted/baseline modules.

## Staged plan (actionable)

Stage 0: Stabilize existing SpiderFoot pipeline
- Ensure venv/PYTHONPATH resolution on prod (handled by CI, verify post-deploy).
- Verify modules symlink at `/var/www/anatscrawler/modules`.
- Normalize router responses to objects (status, correlations) across endpoints.

Stage 1: UI completeness and UX
- Implement Graph rendering, or hide the Graph tab until done.
- Add Abort/Delete buttons in details page; wire to `/abort` and `/delete` endpoints.
- Display enabled modules consistently (list + details).

Stage 2: Performance/robustness
- Batch correlation counts in `/scanlist` (new backend endpoint) to avoid N calls; maintain cache TTL.
- Add retries and timeouts in `spiderfoot.service.js` around wrapper calls.
- Expose `/api/spiderfoot/health` that runs `list_modules` and reports OK.

Stage 3: MISP read-only enrichment (start here)
- Config (env): `MISP_URL`, `MISP_API_KEY`, `MISP_VERIFY_TLS` (true), `MISP_TIMEOUT_MS` (10000).
- Service: add `server/misp.service.ts` (or `.js`) to call MISP REST for attributes/events.
- Endpoint: `GET /api/spiderfoot/scan/:scanId/enrich/misp` — extract unique IOCs from `/browse` or `/events` (domain/ip/email/hash/hostname/url), query MISP in parallel, return matches keyed by IOC with event IDs, tags, threat level.
- UI: show MISP hit badges in Browse; add summary of hits by risk/tag on Summary tab.
- Caching: in-memory or Redis per IOC.

Stage 4: MISP publish (optional)
- Endpoint `POST /api/misp/publish` with `{ scanId, attributeMap, eventId? }` to publish selected results as attributes.
- Map SpiderFoot event types to MISP attribute types; add dry-run validation endpoint.

Stage 5: Correlate scans via MISP
- Store MISP event matches alongside scans; endpoint to list scans connected to a given event.
- Extend `/scanlist` with counts of MISP-linked correlations.

Stage 6: Ops/Security
- Rate limits and circuit breaker for MISP.
- Secrets only in env; no repo keys. Consider attribute redaction for PII.

## Immediate to-dos

- [ ] Add `server/misp.service.ts` and `server/routes/misp.ts` with `ping`, `search`, `scan enrichment`.
- [ ] Update details page to surface MISP hits.
- [ ] Decide on Graph visualization path or hide tab temporarily.
- [ ] Standardize router responses to objects and add ETag to log endpoints.

## References

- SpiderFoot wrapper: `server/spiderfoot/spiderfoot_wrapper.py`
- Node proxy: `server/spiderfoot.service.js`
- Routes: `server/routes/spiderfoot.ts`
- UI (list): `client/src/pages/ScanListPage.tsx`
- UI (details): `client/src/pages/ScanDetailsPage.tsx`

