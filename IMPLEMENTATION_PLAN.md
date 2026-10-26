# AgeVision AI — Implementation Plan

## Goal

Build a privacy-conscious, responsive Somali and English application for estimating apparent age from a single face in a photo. The estimate is educational/entertainment only and is not age or identity verification.

## Decisions and constraints

- Next.js App Router, strict TypeScript, Tailwind CSS, AWS SDK v3 Rekognition `DetectFaces` with only the `AGE_RANGE` attribute.
- No database, accounts, permanent image storage, or image data in browser storage, URLs, or logs.
- The browser retains a local preview only until the user removes it or resets the flow; camera access is explicit and camera tracks are stopped when no longer needed.
- The API limits uploads to 5 MB by default, checks content length before multipart parsing, verifies file signatures, and accepts exactly one image.
- Distributed production rate limiting uses Upstash Redis. Local development can use a bounded in-memory limiter; production still fails closed when Upstash is not configured.
- AWS and Upstash credentials are server-only. External provider retention and regional availability must be reviewed by the operator before launch.

## Work plan

1. Scaffold the Next.js app, dependency/configuration files, ignore rules, and environment example.
2. Implement the bilingual design system, responsive landing experience, upload flow, preview, and explicit consent.
3. Implement on-demand camera capture with permission/error states and track cleanup.
4. Implement server-side request limits, signature validation, distributed rate limiting, and a typed AWS provider boundary.
5. Implement safe localized result/error states and privacy/terms pages.
6. Add unit and route tests, setup/deployment documentation, and smoke-test checklist.
7. Run available formatting, lint, type, unit, and production-build checks; report checks blocked by absent credentials/configuration.

## Completion evidence

- Source code and setup guide are present.
- Automated checks are run and their actual outcomes recorded.
- Live AWS estimates and deployment are reported as unverified until valid credentials and a deployed environment are available.

## Status

- [x] Inspected workspace; it was empty.
- [x] Scaffold and configuration.
- [x] UI and bilingual flows.
- [x] Secure API and providers.
- [x] Tests and documentation.
- [x] Verification (lint, typecheck, 15 tests, build, and npm audit).

## Remaining external setup

- Add valid AWS credentials/role to the ignored `.env.local` before using real age estimation.
- Configure Upstash Redis values before production deployment; local development does not require Upstash.
- Validate current AWS regional availability, provider retention and pricing before production.
- No live AWS request or deployment was performed in this workspace.
