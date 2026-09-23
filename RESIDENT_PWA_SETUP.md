# GatePulse Resident PWA

The resident experience is available at `/resident` and is separate from the visitor flow.

## Demo resident accounts

The seed script creates a resident for every seeded flat.

- Phone: the phone stored against the flat
- PIN: `1234`

Change the PIN/authentication model before production use. The current PIN flow is intentionally a lightweight demo authentication mechanism.

## Database

After pulling this branch, from the API workspace:

```bash
cd apps/api
npm install
npm run db:push
npm run seed
```

This adds:

- Resident
- ResidentSession
- PushSubscription

## Web Push setup

GatePulse uses standard browser Web Push with VAPID. Firebase is not required for this implementation.

Generate a key pair:

```bash
npx web-push generate-vapid-keys
```

Configure the keys separately:

### Web app

The VAPID public key is safe to expose to browsers, so it belongs in the frontend environment:

```env
VITE_WEB_PUSH_VAPID_PUBLIC_KEY=<generated-public-key>
```

### API

Only the VAPID private key and subject belong on the server:

```env
WEB_PUSH_VAPID_SUBJECT=mailto:you@example.com
WEB_PUSH_VAPID_PRIVATE_KEY=<generated-private-key>
```

For local development, put the public key in `apps/web/.env` and the private key/subject in `apps/api/.env`.

For Render:

- Add `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` to the **web service** environment before the frontend build.
- Add `WEB_PUSH_VAPID_SUBJECT` and `WEB_PUSH_VAPID_PRIVATE_KEY` to the **API service** environment.

The public key is not a secret. Never expose the private key in frontend code or `VITE_*` variables.

## Visitor notification flow

The resident PWA is now the approval channel.

```text
Visitor
  ↓
Create VisitorLog (PENDING)
  ↓
Resident Web Push notification
  ↓
Resident opens visitor details
  ↓
Approve / Deny
  ↓
Visitor receives Socket.IO update
```

The visitor request no longer sends an outbound WhatsApp approval message. The existing WhatsApp webhook/API code remains in the project only for legacy/inbound support and can be removed later if we decide WhatsApp is no longer needed.

## Resident test flow

1. Open `/resident` on the web app.
2. Log in with a seeded resident phone and PIN `1234`.
3. Click **Enable notifications** and allow browser notifications.
4. Click **Send test push** and verify the notification arrives.
5. From the visitor flow, create a visitor request for that resident's flat.
6. The resident should receive a push notification — **not a WhatsApp approval request**.
7. Open the notification and approve or deny the visitor.
8. The visitor browser should update through the existing Socket.IO/polling flow.

## PWA installation

On a supported mobile browser, use the browser's **Add to Home Screen / Install** action after opening `/resident`. The PWA manifest and service worker are included in the web app.

## Production notes

This branch is a demo-ready foundation. Before production rollout, replace the demo PIN login with a stronger resident onboarding/authentication flow, add rate limiting and session revocation, and consider CSRF/session hardening and audit logging.
