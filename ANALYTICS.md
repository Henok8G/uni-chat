# Internal Analytics & Measurement

## Overview
As of Phase 13, Ethi-Uni Chat uses a privacy-first analytics pipeline built natively on PostgreSQL (`AnalyticsEvent`). This lets us monitor global system health, feature adoption, and WebRTC performance without tracking individual plain text chat data or leaking sensitive information.

## Analytics Database Schema
Metrics are tracked in `AnalyticsEvent`.
- **id**: System generated id
- **type**: The event classification (e.g. `SESSION_STARTED`, `WEBRTC_FAILED`)
- **userId**: (Optional) For tying events to user accounts.
- **sessionId**: (Optional) Ties tracking directly via Chat Session lifecycle.
- **universityId**: (Optional) Allow aggregate queries per campus.
- **plan**: (Optional) Allow queries by plan type (`FREE` / `STANDARD` / `PRO`).
- **properties**: A JSON payload accommodating flexible analytics metrics (e.g., session durations, ICE failure causes, report categories).
- **createdAt**: Timeline.

## Monitored Events
We currently track the following explicit event hooks directly from Server Actions and Web Socket relays:

- `USER_SIGNED_UP`: Occurs continuously on registration.
- `USER_VERIFIED`: After successful email verification clicks.
- `USER_UPGRADED_PLAN`: Issued whenever an admin manually updates a user's pricing tier.
- `USER_BANNED`: Tracking moderative action velocity.
- `SESSION_STARTED`: Invoked via Match Engine finding a successful peer map.
- `SESSION_ENDED`: Occurs cleanly off socket discon or NEXT requests. 
- `MESSAGE_SENT`: Used to deduce global chat volumes vs active session rates.
- `WEBRTC_STARTED`: WebRTC video connection stabilized correctly.
- `WEBRTC_FAILED`: WebRTC stun verification failed ICE procedures natively.
- `REPORT_CREATED`: Whenever moderation requests stream in.
- `REPORT_RESOLVED`: Track when reports are successfully addressed.

## Architecture
Events are inserted asynchronously via the `src/lib/analytics.ts` module wrapper over Prisma. 
We explicitly use unstructured Promises utilizing `.catch()` to achieve a **fire-and-forget** flow, meaning an analytics database freeze shouldn't halt active chats or socket routing dynamically natively.

## Environment Variables
- `ANALYTICS_ENABLED` -> "true" or "false". If strictly "false", events silently drop. By default, it operates in production. You can explicitly set it in your local dev via `.env`.

## Admin Visualization
Admins have access to an `Analytics` tab under `/admin`. It tracks aggregate metrics counts from the last 30 revolving days grouped by `type`.
