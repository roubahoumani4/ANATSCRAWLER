# Copilot Instructions for darkscrawler1

## Purpose
This document provides actionable instructions for AI agents (e.g., GitHub Copilot, Copilot Chat) working in the `darkscrawler1` codebase. It covers conventions, integration points, and best practices for frontend, backend, and Python modules.

---

## General Conventions
- Use TypeScript for frontend code in `client/src`.
- Use Express/Node.js for backend code in `server/`.
- Use Python for SpiderFoot modules in `server/spiderfoot/`.
- Use absolute imports in Python modules.
- Use flexible data parsing in frontend to handle both array and object API responses.
- All API routes should be documented in `server/routes/`.
- Use PM2 for backend process management.

---

## Frontend (React/TypeScript)
- Main scan list UI: `client/src/pages/ScanListPage.tsx`.
- Dashboard scan list: `client/src/components/dashboard/OsintScans.tsx`.
- Fetch scan data from `/api/spiderfoot/scanlist` and `/osint-engine/scans`.
- Always handle both array and object responses from backend APIs.
- Fix lint errors by adding explicit type annotations (avoid implicit `any`).
- Use context providers in `client/src/context/` for authentication, theme, and language.

---

## Backend (Express/Node.js)
- Main API routes: `server/routes/spiderfoot.ts`.
- Proxy legacy routes as needed (e.g., `/osint-engine/scans`).
- Integrate with SpiderFoot Python modules via API endpoints.
- Use JWT and CSRF tokens for authentication.
- Document new routes and integration points in `server/routes/`.

---

## Python (SpiderFoot Modules)
- Modules located in `server/spiderfoot/modules/`.
- Use absolute imports (e.g., `from spiderfoot import sflib`).
- Ensure all dependencies are listed in `server/spiderfoot/requirements.txt`.
- Install dependencies with `pip install -r requirements.txt`.
- For new modules, update `requirements.txt` and test imports.

---

## Dependency Management
- Node.js: Use `package.json` for dependencies. Run `npm install` after updates.
- Python: Use `requirements.txt` for dependencies. Run `pip install -r requirements.txt` after updates.

---

## Troubleshooting
- If frontend scan list does not display, check API route and response format.
- If Python module import fails, check import path and `requirements.txt`.
- For lint errors, add explicit type annotations in TypeScript files.
- For backend errors, check logs and ensure all environment variables are set.

---

## Onboarding AI Agents
- Always analyze both frontend and backend code for integration issues.
- When updating scan list logic, ensure both `/api/spiderfoot/scanlist` and `/osint-engine/scans` are supported.
- Document any new conventions or integration points in this file.
- Ask for user feedback on unclear or incomplete sections and iterate as needed.

---

## Last Updated
- [Date: YYYY-MM-DD] (Update this when making changes)

---

## Feedback
If any section is unclear or incomplete, ask the user for clarification and update this file accordingly.
