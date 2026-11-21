# Notification providers compared: Knock, Novu, Courier, MagicBell, SuprSend

Research for [issue #3](https://github.com/mavyxz/cohort-005-project/issues/3), part of the map in [issue #1](https://github.com/mavyxz/cohort-005-project/issues/1).

This file reports facts and names no winner. Providers appear in the order the ticket lists them, with the added candidate last.

## How to read this

- **Fetch date:** every source was fetched on 2026-11-21. Pricing and SDK versions are as of that date.
- **Sources:** the providers' own docs, pricing pages, SDK repositories and npm registry metadata. Each claim carries its link.
- **"Read from source, not run":** behaviour read out of the published SDK code. Nothing was installed into the app, signed up for, or run in a browser. These claims are implementation detail, not a documented contract.
- **Quotes:** quoted text came through a page-fetching tool that can paraphrase. The free-tier numbers on all five pricing pages, the React peer ranges on npm, Firebase's HTTPS sentence and Knock's "no first-party web push" statement were fetched a second time and matched. Other quotes were not double-checked word for word.
- **The app context used to judge fit:** React Router 8.3 framework mode (server-rendered), React 19.2, local development on `http://localhost` only, one browser where the DevUI panel switches the signed-in person, no public URL for a provider to call.

## Summary table

| | Knock | Novu (Cloud) | Courier | MagicBell | SuprSend |
| --- | --- | --- | --- | --- | --- |
| Free tier | 10,000 messages/month, no card | 10,000 workflow runs/month, no card, 5 workflows | 10,000 sends/month; a multi-channel send counts once | 1,000 deliveries/month, counted per channel | 10,000 notifications/month, counted per channel, no card |
| In-app feed | Yes | Yes | Yes | Yes | Yes (branded on Free) |
| Browser push from the one service | No: needs Firebase (FCM) | No: needs FCM, Pushpad or OneSignal | Not documented for web; push goes through connected providers | Yes: own web push channel (VAPID) | Yes: own web push (VAPID) |
| Email later | Yes, via an email provider | Yes, via an email provider | Yes, via an email provider | Yes, via an email provider | Yes, via an email provider |
| React package | `@knocklabs/react` 0.15.1 | `@novu/react` 3.20.0 | `@trycourier/courier-react` 9.3.5 | `@magicbell/react` 1.14.0 | `@suprsend/react` 1.6.0, `@suprsend/react-core` 2.5.0 |
| React peer range | `^17 \|\| ^18 \|\| ^19` | `^18 \|\| ^19` | `>=18.0.0` | none declared | `>= 16.8.0`; two dependencies of the prebuilt package stop at 18 |
| Prebuilt / headless | Both | Both | Both | Prebuilt only in React; headless via plain `magicbell-js` | Both |
| Server rendering documented | No | No (server stub entry seen in source) | Next.js only | No | No |
| Live updates | WebSocket opened by the browser | WebSocket (socket.io) opened by the browser | WebSocket opened by the browser | WebSocket opened by the browser, plus a 60 s refetch | WebSocket (socket.io) opened by the browser |
| Browser identity | Public key + user id; signed JWT optional | App id + subscriber id; HMAC optional | Server-minted JWT, mandatory | Self-signed JWT (HS256), mandatory | Public key + id; signed JWT optional, off in Sandbox |
| Recipient before send | Inline identify in the trigger | Created on trigger when `to` is an object | None for the inbox | Upserted inline | Upserted inline |
| Provider must call our server | No step found | No for dashboard workflows; yes for code-first workflows | No step found | No step found | No step found |
| Fan-out per call | 1,000 recipients; object subscriptions | Topics up to 100,000; bulk 100 events | `to` array, lists, audiences | 1,000 recipients per broadcast | 100 recipients; lists |
| Batching / digest | Yes, on Free | Yes, on Free (1-day maximum window) | Yes, as Journey nodes; plan gating unread | None found | Exists; not on Free |
| Preferences | Yes, on Free | Yes | Yes | Yes | Exists; not on Free |

Every "No step found" and every "not documented" above is expanded, with its caveat, in the sections below and in [Could not verify](#could-not-verify).

## A fact shared by all five: browser push on `localhost`

None of Knock, Novu, Courier or MagicBell states whether web push works on `http://localhost`. SuprSend does (see its section). The browser-side rule comes from the web platform, not the provider:

- Service workers need HTTPS, with a development exception: "In order to facilitate local development, `localhost` is considered a secure origin by browsers as well." ([MDN, Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers))
- The Push API is "available only in secure contexts (HTTPS)". ([MDN, PushManager](https://developer.mozilla.org/en-US/docs/Web/API/PushManager))
- The Secure Contexts specification treats loopback addresses (`127.0.0.0/8`, `::1/128`) as potentially trustworthy, and `localhost` names when the browser follows the localhost resolution rules. ([W3C Secure Contexts, section 3.1](https://w3c.github.io/webappsec-secure-contexts/))

Firebase's own page says "The FCM SDK is supported only in pages served over HTTPS" and does not mention `localhost` ([Firebase docs](https://firebase.google.com/docs/cloud-messaging/js/client)). That matters for the two providers that route web push through FCM.

---

## Knock

Product, in-app feed and free plan are all current ([pricing](https://knock.app/pricing), [in-app overview](https://docs.knock.app/in-app-ui/overview)).

### Free tier

- "Free For evaluation or small-scale deployments. Start building for free, no credit card required. $ 0 / month" ([pricing](https://knock.app/pricing)).
- 10,000 messages per month. A message is "A single message delivered to a single user on a single channel", so in-app plus push to one person is two ([pricing](https://knock.app/pricing)).
- The Free column includes unlimited environments, channels and workflows, batching and digests, preferences, in-app feeds, and prebuilt or own components. Removing Knock branding starts on the Starter plan ([pricing](https://knock.app/pricing)).
- Company-email and approval requirements: not confirmed. The signup page did not render.

### Channels

- In-app feed: yes ([in-app overview](https://docs.knock.app/in-app-ui/overview)).
- Browser push: "Knock does not have a first-party web push channel. Instead, you'll use FCM to send messages to a user's browser." ([web push tutorial](https://docs.knock.app/tutorials/sending-web-push-notifications-with-fcm)). Knock orchestrates both channels from one workflow, but web push needs a separate Firebase project.
- Email later: through a downstream provider such as Postmark, SendGrid, Resend or SES ([email integrations](https://docs.knock.app/integrations/email/overview)).

### React SDK

- `@knocklabs/react` 0.15.1. Peer range `react: ^17.0.0 || ^18.0.0 || ^19.0.0`, same for `react-dom` ([npm](https://registry.npmjs.org/@knocklabs/react/latest)).
- Prebuilt: `NotificationFeedPopover`, `NotificationFeed`, `NotificationIconButton`, with `renderItem` and `onNotificationClick` ([React feed docs](https://docs.knock.app/in-app-ui/react/feed)).
- Headless: `useKnockClient`, `useNotifications`, `useNotificationStore` ([custom UI docs](https://docs.knock.app/in-app-ui/react/custom-notifications-ui)).
- Server rendering: no documentation found. The package has entry points for Next.js and TanStack Router but none for React Router ([package.json](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react/package.json)).
- Read from source, not run:
  - The client is built and authenticated during render (`useMemo`), and the feed client starts listening inside a `useState` initialiser ([useAuthenticatedKnockClient.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react-core/src/modules/core/hooks/useAuthenticatedKnockClient.ts), [useNotifications.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react-core/src/modules/feed/hooks/useNotifications.ts)).
  - Socket creation is guarded by `typeof window !== "undefined"` ([api.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/client/src/api.ts)). The inline identify call inside `authenticate()` has no browser check ([knock.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/client/src/knock.ts)).
  - `KnockProvider` has an `enabled` prop: "When `false`, render children but keep the Knock client idle: no identify call, no API requests, and no websocket." ([KnockProvider.tsx](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react-core/src/modules/core/context/KnockProvider.tsx))
  - A source comment notes that React strict mode creates one extra feed client that is not disposed ([useNotifications.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react-core/src/modules/feed/hooks/useNotifications.ts)).

### Live updates

"Knock provides a real-time web socket connection for your users to subscribe to new messages being produced on an in-app channel." ([API overview](https://docs.knock.app/in-app-ui/api-overview)). The browser opens the socket; `useNotifications` starts listening itself.

### Browser identity

- Default: public API key plus user id, unsigned. "Without enhanced security mode, a request with your public key can act as any user." ([security docs](https://docs.knock.app/in-app-ui/security-and-authentication))
- Optional enhanced security mode: an RS256 JWT with a `sub` claim, signed by our server and passed as `userToken`. It is set per environment and can stay off in development ([security docs](https://docs.knock.app/in-app-ui/security-and-authentication)).
- Switching people is not documented. Read from source, not run: a changed user id tears down feed instances and the socket, builds a new API client and re-initialises, and the feed provider is keyed on the user id ([knock.ts](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/client/src/knock.ts), [KnockFeedProvider.tsx](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react-core/src/modules/feed/context/KnockFeedProvider.tsx)).
- Push tokens are stored per user and are not moved on a switch: "By default, Knock makes no assumptions about managing your device tokens. This means you are responsible for removing tokens" ([FCM integration](https://docs.knock.app/integrations/push/firebase)).

### Recipients

Recipients must be identified, but it can happen in the trigger: "it can be done ahead of time, or lazily via inline-identification in your workflow triggers." ([recipients](https://docs.knock.app/concepts/recipients)). Only `id` is required ([users](https://docs.knock.app/concepts/users)).

### Browser push

- Needs a Firebase project, its service account JSON in Knock, a `firebase-messaging-sw.js` service worker, the Firebase web config and Firebase's VAPID key ([FCM integration](https://docs.knock.app/integrations/push/firebase), [web push tutorial](https://docs.knock.app/tutorials/sending-web-push-notifications-with-fcm)).
- The FCM token is stored on the user as channel data, from the browser or from our server ([FCM integration](https://docs.knock.app/integrations/push/firebase)).
- HTTPS and `localhost`: not mentioned by Knock. See the shared section above.

### Inbound webhooks

No in-app or push step on the pages read has Knock calling our server. Outbound webhooks exist as an optional feature ([outbound webhooks](https://docs.knock.app/developer-tools/outbound-webhooks/overview)). No page states outright that none is needed.

### Sending

- `@knocklabs/node`: `client.workflows.trigger('workflow-key', { recipients: [...], data: {...} })` ([knock-node](https://github.com/knocklabs/knock-node)).
- "You can trigger a workflow for up to 1000 recipients at a time." ([trigger docs](https://docs.knock.app/send-notifications/triggering-workflows/api))
- Object subscriptions fan out to every subscriber of an object ([subscriptions](https://docs.knock.app/concepts/subscriptions)).
- A batch step collects triggers per recipient over a fixed or sliding window, optionally grouped by a batch key ([batch function](https://docs.knock.app/designing-workflows/batch-function)). Rendering more than 10 batched items is an Enterprise feature (same page).

### Preferences

Per-recipient preference sets by channel type, category and workflow, included on Free ([preferences](https://docs.knock.app/preferences/overview), [pricing](https://knock.app/pricing)).

---

## Novu (Cloud)

Product, `<Inbox />` and free plan are all current ([pricing](https://novu.co/pricing), [Inbox overview](https://docs.novu.co/platform/inbox/overview.md)). Novu is also open source and self-hostable; the core is MIT licensed ([README](https://raw.githubusercontent.com/novuhq/novu/next/README.md)).

### Free tier

- "$0", "10,000 workflow runs / month", "No credit card required", "All channels: Email, In-app, SMS, Chat, Push", "Up to 5 workflows" ([pricing](https://novu.co/pricing)).
- Other Free limits: 20 steps per workflow, 3 team members, 1-day maximum digest and delay, 30-day inbox retention ([limits](https://docs.novu.co/platform/developer/limits.md)).
- The Inbox shows Novu branding on Free ([prepare for production](https://docs.novu.co/platform/inbox/prepare-for-production.md)).
- Company-email and approval requirements: not confirmed.

### Channels

- In-app: yes ([Inbox overview](https://docs.novu.co/platform/inbox/overview.md)).
- Browser push: Novu orchestrates push but delivers through a provider configured in the dashboard. For browsers that is FCM, Pushpad or OneSignal ([push](https://docs.novu.co/platform/integrations/push.md), [FCM](https://docs.novu.co/platform/integrations/push/fcm.md), [Pushpad](https://docs.novu.co/platform/integrations/push/pushpad.md), [OneSignal](https://docs.novu.co/platform/integrations/push/onesignal.md)). No Novu-owned service worker or VAPID keys were found.
- Email later: a channel on every plan, through a configured email provider ([pricing](https://novu.co/pricing)).

### React SDK

- `@novu/react` 3.20.0. Peer range `react: ^18.0.0 || ^19.0.0 || ^19.0.0-0` ([npm](https://registry.npmjs.org/@novu/react/latest)). The docs state React 19 is supported ([Inbox overview](https://docs.novu.co/platform/inbox/overview.md)).
- Prebuilt: `<Inbox />`, made of `Bell`, `Notifications`, `InboxContent` and `Preferences`, each usable alone ([Inbox overview](https://docs.novu.co/platform/inbox/overview.md)).
- Headless: `NovuProvider`, `useNotifications`, `useCounts`, `useNovu`, `usePreferences` ([headless mode](https://docs.novu.co/platform/inbox/headless-mode.md)).
- Server rendering: no documented note. A Remix quickstart renders the Inbox from `app/root.tsx` with no client-only wrapper ([Remix quickstart](https://docs.novu.co/platform/quickstart/remix.md)). The React quickstart imports from `react-router-dom`, not the `react-router` package ([React quickstart](https://docs.novu.co/platform/quickstart/react.md)).
- Read from source, not run:
  - The package root resolves to a server entry unless the `browser` condition is active. That entry is stubs commented "empty functions to fix build errors in SSR": the provider renders only its children, the components render nothing, the hooks return fixed defaults ([package.json](https://raw.githubusercontent.com/novuhq/novu/next/packages/react/package.json), [server/index.tsx](https://raw.githubusercontent.com/novuhq/novu/next/packages/react/src/server/index.tsx)).
  - The `@novu/react/hooks` subpath has no such split ([package.json](https://raw.githubusercontent.com/novuhq/novu/next/packages/react/package.json)).

### Live updates

A WebSocket the browser opens to Novu. "The `useNotifications` and `useCounts` hooks automatically listen for real-time events and update your component state." ([headless mode](https://docs.novu.co/platform/inbox/headless-mode.md)). Read from source: `socket.io-client` with `transports: ['websocket']` ([socket.ts](https://raw.githubusercontent.com/novuhq/novu/next/packages/js/src/ws/socket.ts)).

### Browser identity

- Default: a public `applicationIdentifier` plus a `subscriberId`, with no proof. Novu's own advisory says a subscriber JWT is issued "for any `subscriberId` when HMAC is not enabled on the in-app integration (the default)." ([advisory GHSA-wjx8-c9gq-37gg](https://github.com/novuhq/novu/security/advisories/GHSA-wjx8-c9gq-37gg))
- Optional HMAC, toggled per environment: `HMAC-SHA256(secretKey, subscriberId)` computed on our server and passed as `subscriberHash`. When it is on and the hash is missing, "the Inbox will not load." ([prepare for production](https://docs.novu.co/platform/inbox/prepare-for-production.md))
- Switching people is not documented. Read from source, not run:
  - `NovuProvider` builds a new client when `subscriberId` changes, which starts a new session ([NovuProvider.tsx](https://raw.githubusercontent.com/novuhq/novu/next/packages/react/src/hooks/NovuProvider.tsx)).
  - No cleanup that disconnects the previous client's socket is visible in that file.
  - Passing an inline `subscriber` object rebuilds the client on every render (same file).
- Push stays bound to the previous person until removed: "When a subscriber logs out of a device, remove that device token from the subscriber's credentials." ([push](https://docs.novu.co/platform/integrations/push.md))

### Recipients

- "Novu allows you to create a subscriber automatically at the moment a notification is triggered." and "If the subscriber does not exist yet, passing `to` as an object creates them on that trigger." ([subscribers](https://docs.novu.co/platform/concepts/subscribers.md), [trigger](https://docs.novu.co/platform/workflow/trigger-workflow.md))
- The same docs also say "You must add a subscriber to Novu before triggering the workflow." ([subscribers](https://docs.novu.co/platform/concepts/subscribers.md)). The two statements were not reconciled.
- Push needs the device token stored on the subscriber first ([push](https://docs.novu.co/platform/integrations/push.md)).

### Browser push

- A downstream account is required: Firebase (service account JSON in the Novu dashboard), Pushpad or OneSignal. The browser gets its token from that provider and our server registers it on the subscriber ([FCM](https://docs.novu.co/platform/integrations/push/fcm.md), [push](https://docs.novu.co/platform/integrations/push.md)).
- Service worker, VAPID, HTTPS and `localhost`: Novu's docs cover none of them; they are the downstream provider's requirements.

### Inbound webhooks

- Workflows built in the dashboard need no endpoint on our side: they "run via Novu's Shared Bridge Endpoint." ([workflows](https://docs.novu.co/platform/concepts/workflows.md))
- Code-first workflows (Novu Framework) do: "Novu Framework requires a single HTTP webhook-like endpoint" that Novu Cloud calls, reached locally through a tunnel ([Framework overview](https://docs.novu.co/framework/overview.md)). This path is optional.
- The "Push Webhook" provider also calls our server; the FCM, Pushpad and OneSignal routes do not ([push webhook](https://docs.novu.co/platform/integrations/push/push-webhook.md)).

### Sending

- `@novu/api`: `novu.trigger({ workflowId, to: [{ subscriberId }], payload })` ([trigger](https://docs.novu.co/platform/workflow/trigger-workflow.md)). A workflow must exist first; Free allows 5 ([limits](https://docs.novu.co/platform/developer/limits.md)).
- Bulk: "limited to 100 events per request." ([bulk trigger](https://docs.novu.co/api-reference/events/bulk-trigger-event.md))
- Topics: "Each topic supports up to 100,000 subscribers", and the `actor` field excludes one subscriber ([topics](https://docs.novu.co/platform/concepts/topics.md)).
- Digest step: "Novu batches multiple trigger events and executes downstream steps only once per digest window", per subscriber, with an optional extra key ([digest](https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest.md)). Free caps the window at 1 day.

### Preferences

Three levels: workflow defaults, subscriber per workflow, subscriber global. A `Preferences` component and a `usePreferences` hook exist ([preferences](https://docs.novu.co/platform/concepts/preferences.md)).

---

## Courier

Product, Courier Inbox and free plan are all current ([pricing](https://www.courier.com/pricing.md), [in-app overview](https://www.courier.com/docs/in-app/overview.md)).

### Free tier

- "The Developer plan is free and includes 10,000 sends a month". "Going over 10,000 requires the Business plan", which needs a card ([pricing](https://www.courier.com/pricing.md)).
- "One send is one template sent to one recipient." "A multi-channel template counts as one send". Sends from the Test environment count ([pricing](https://www.courier.com/pricing.md)).
- "The in-app Inbox has no fee of its own." ([pricing](https://www.courier.com/pricing.md))
- Signup requirements (card, company email, approval): not confirmed. The pricing page lists "SSO via Google, GitHub" on the Developer plan ([pricing](https://www.courier.com/pricing)).

### Channels

- In-app: yes, and it needs no downstream provider ([send overview](https://www.courier.com/docs/send/overview.md)).
- Browser push: not documented. "Courier sends push through the providers you connect, such as APNs, Firebase Cloud Messaging (FCM), Expo, or OneSignal" ([push overview](https://www.courier.com/docs/integrations/push/overview.md)). The docs frame push as mobile ([in-app overview](https://www.courier.com/docs/in-app/overview.md)). A search of the push pages for "web push", "browser", "VAPID" and "service worker" found nothing; the one "web" mention is a Pusher Beams mode ([Pusher Beams](https://www.courier.com/docs/integrations/push/pusher-beams.md)).
- Email later: a channel on the same Send API, through a connected email provider ([docs index](https://www.courier.com/docs/llms.txt)).

### React SDK

- `@trycourier/courier-react` 9.3.5. Peer range `react: >=18.0.0` ([npm](https://registry.npmjs.org/@trycourier/courier-react/latest)). The repository develops against React 19.1 ([package.json](https://raw.githubusercontent.com/trycourier/courier-web/main/%40trycourier/courier-react/package.json)). No explicit React 19 statement was found.
- The older `@trycourier/react-inbox`, `react-provider` and `react-hooks` are deprecated ([in-app overview](https://www.courier.com/docs/in-app/overview.md)).
- Prebuilt: `<CourierInbox />`, `<CourierInboxPopupMenu />`, `<CourierToast />`, `<CourierPreferences />` ([React SDK docs](https://www.courier.com/docs/sdk-libraries/courier-react-web.md)).
- Headless: `useCourier()` returns the client and the feed state; parts of the prebuilt inbox can also be replaced ([React SDK docs](https://www.courier.com/docs/sdk-libraries/courier-react-web.md), [custom inbox](https://www.courier.com/docs/in-app/build-a-custom-inbox.md)).
- Server rendering is documented for Next.js only: "Courier Inbox and Toast support Next.js but render client-side only." Importing on the server is stated to be safe: "element registration is guarded on `typeof window`" ([React SDK docs](https://www.courier.com/docs/sdk-libraries/courier-react-web.md), [Next.js guide](https://www.courier.com/docs/guides/add-an-inbox-to-nextjs.md)). React Router is not mentioned.
- The inbox renders as a custom element and styles itself inline ([add an inbox](https://www.courier.com/docs/in-app/add-an-inbox.md)).

### Live updates

"Once a user signs in, the inbox opens a realtime connection. New messages appear live." ([inbox behaviour](https://www.courier.com/docs/in-app/how-the-inbox-behaves.md)). The browser opens a WebSocket to `wss://realtime.courier.io` ([add an inbox](https://www.courier.com/docs/in-app/add-an-inbox.md)). A custom UI must call `inbox.listenForUpdates()` itself ([React SDK docs](https://www.courier.com/docs/sdk-libraries/courier-react-web.md)).

### Browser identity

- A JWT minted by our server through Courier's API (`client.auth.issueToken`, scoped to one `user_id`), then passed to `signIn` ([authenticate users](https://www.courier.com/docs/in-app/authenticate-users.md)).
- It is mandatory. "Client keys no longer authenticate anything, so every app needs a backend endpoint that issues a token." ([migration guide](https://www.courier.com/docs/sdk-libraries/courier-react-v8-migration-guide.md)). No way to switch it off in development was found.
- "The SDKs do **not** refresh tokens." ([authenticate users](https://www.courier.com/docs/in-app/authenticate-users.md))
- Switching people is not documented for user ids. Read from source, not run: `signIn` while someone is signed in signs the current person out (closing the socket), builds a new client, and the inbox reloads without cache. The quick-start runs `signIn` once on mount, so re-running it on a switch is the app's job (`@trycourier/courier-js` 3.7.1, [npm](https://registry.npmjs.org/@trycourier/courier-js)).
- The web SDK holds no push subscription: version 9.3.5 has no service worker or `pushManager` code (same package, read from source).

### Recipients

For the inbox, none: "Nothing has to exist in Courier first, since signing in registers the user." ([authenticate users](https://www.courier.com/docs/in-app/authenticate-users.md)). Other channels need a profile or inline contact details ([recipients](https://www.courier.com/docs/recipients/overview.md)).

### Browser push

- Courier's docs contain no service worker, VAPID or browser-permission instructions.
- Device tokens can be managed through an API that accepts the provider keys `firebase-fcm`, `apn`, `expo` and `onesignal` ([token API](https://www.courier.com/docs/api-reference/device-tokens/add-a-token-to-a-user.md)). Whether an FCM web token registered that way reaches a browser is not documented.
- `localhost` and HTTPS: not covered.

### Inbound webhooks

"The inbox calls Courier directly from the browser" ([add an inbox](https://www.courier.com/docs/in-app/add-an-inbox.md)). No inbox or send step requires Courier to call us. Courier's webhooks to our server ("outbound webhooks" in its terms) are optional ([outbound webhooks](https://www.courier.com/docs/monitor/webhooks/outbound.md)). Our server does have to call Courier to mint each JWT.

### Sending

- `@trycourier/courier` 10.1.0: `client.send.message({ message: { to: { user_id }, template, ... } })`, with `inbox` in the routing channels ([send to the inbox](https://www.courier.com/docs/in-app/send-to-the-inbox.md)). The inbox guide uses a published template.
- Fan-out: `to` accepts an array; lists and audiences are addressed by id ([Send API](https://www.courier.com/docs/api-reference/send/send-a-message.md), [lists](https://www.courier.com/docs/recipients/lists-and-audiences/lists.md)).
- Batching and digests are Journey nodes, not Send API parameters. Batch: "Collect events at one point in a journey and release them as a single per-user payload", with a wait of 1 minute to 1 day ([batch node](https://www.courier.com/docs/journeys/nodes/batch.md)). The free plan includes Journeys; the per-plan cells of the "Digest & batching" pricing row could not be read.

### Preferences

Topic-based preferences with `OPTED_IN`, `OPTED_OUT` and `REQUIRED` defaults, a `<CourierPreferences />` component and a hosted page ([preferences](https://www.courier.com/docs/recipients/preferences/overview.md)). Preference-blocked sends still count against the quota ([pricing](https://www.courier.com/pricing.md)).

---

## MagicBell

Product, inbox and a $0 plan are all current ([inbox](https://www.magicbell.com/inbox), [pricing](https://www.magicbell.com/pricing)).

### Free tier

- "Builder", "$0 /month", "1,000 Deliveries/mo.", "1 Project", "Unlimited Users". The next plan is "Startup" at "$249 /month" ([pricing](https://www.magicbell.com/pricing)).
- "To count deliveries, we add up all the channels a user receives a notification on." In-app plus web push to one person is two deliveries ([pricing](https://www.magicbell.com/pricing)).
- What happens past 1,000 on Builder is not stated. Card, company-email and approval requirements are not stated.

### Channels

- In-app: yes ([in-app channel](https://www.magicbell.com/docs/channels/in_app)).
- Browser push: a first-party channel. "MagicBell handles VAPID keys, device tokens, and delivery" ([web push](https://www.magicbell.com/web-push)). Its only configuration is a VAPID key pair; FCM and APNs are listed for mobile push only ([web push channel](https://www.magicbell.com/docs/channels/web_push)).
- Email later: through Mailgun, SMTP, Amazon SES, SendGrid or similar ([email channel](https://www.magicbell.com/docs/channels/email)).

### React SDK

- `@magicbell/react` 1.14.0, which declares no `peerDependencies` at all ([npm](https://registry.npmjs.org/@magicbell/react/latest)). No doc page states React 19 support.
- `@magicbell/magicbell-react` and `@magicbell/react-headless` are deprecated in their READMEs ([npm](https://registry.npmjs.org/@magicbell/react-headless)).
- Prebuilt: `ContextProvider`, `FloatingInbox`, `Inbox`, `ToastContainer`, `UserPreferences`, `WebPushButton`, with `ItemComponent` and similar replacement points ([React docs](https://www.magicbell.com/docs/libraries/magicbell-react)).
- Headless: the React package exports no hooks. The stated route is the plain `magicbell-js` client (`user-client` and `realtime`) or the REST API ([magicbell-js docs](https://www.magicbell.com/docs/libraries/magicbell-js)).
- Server rendering: no doc page mentions it. Read from source, not run: entry files start with `"use client"`, and the socket is created closed when `window` is undefined ([package tarball](https://registry.npmjs.org/@magicbell/react/-/react-1.14.0.tgz), `src/internal/stores/realtime-store.ts`).

### Live updates

"Notifications update live via WebSockets." ([inbox](https://www.magicbell.com/inbox)). Read from source, not run: the browser opens `wss://ws.magicbell.com`, and the store also refetches every 60 seconds (`src/internal/stores/notification-store.ts` in the [tarball](https://registry.npmjs.org/@magicbell/react/-/react-1.14.0.tgz)).

### Browser identity

- A per-person JWT our server signs itself: "User JWTs must be signed with your project's Secret Key using the HS256 algorithm." No call to MagicBell is needed to mint it ([user authentication](https://www.magicbell.com/docs/api/authentication/user)).
- It is mandatory: the provider's `token` prop is required, and no unsigned mode is documented ([React docs](https://www.magicbell.com/docs/libraries/magicbell-react)).
- Switching people is not documented. Read from source, not run ([tarball](https://registry.npmjs.org/@magicbell/react/-/react-1.14.0.tgz)):
  - A new `token` builds a new client, socket and store, cached by token (`src/internal/context/context.ts`).
  - A mounted `Inbox` subscribes to its store once, with an empty dependency list, so it keeps watching the previous person's store until remounted (`src/inbox.tsx`).
  - No code closes the previous person's socket.
- Push: tokens are "Linked to specific users". The docs advise "Discard tokens when a user signs out by sending a DELETE request to the token endpoint." ([channels](https://www.magicbell.com/docs/channels)). Read from source: nothing deregisters automatically on a token change.

### Recipients

No pre-registration: broadcast recipients are inline and upserted, and "We create users for you on the fly when you initialize the Inbox for them" ([user](https://www.magicbell.com/docs/primitive/user), [quick start](https://www.magicbell.com/docs/quick-start)). An `external_id` "cannot be changed or unset" once set.

### Browser push

- Service worker: "your service worker must import MagicBell's script: `importScripts('https://assets.magicbell.io/web-push-notifications/sw.js');`" ([React docs](https://www.magicbell.com/docs/libraries/magicbell-react)). The `WebPushButton` registers `/sw.js` by default (read from source).
- VAPID, not Firebase. The channel docs mark both keys as required configuration, while the product page says "MagicBell manages VAPID key generation and rotation" ([web push channel](https://www.magicbell.com/docs/channels/web_push), [web push](https://www.magicbell.com/web-push)). The two were not reconciled.
- HTTPS and `localhost`: not mentioned. See the shared section above.

### Inbound webhooks

None found for in-app or web push: every step is the browser or our server calling MagicBell. No outbound-webhook endpoint appears in the docs sitemap or OpenAPI files ([project API](https://www.magicbell.com/docs/api/openapi.project.json)).

### Sending

- `magicbell-js/project-client`: `client.broadcasts.createBroadcast({ title, content, action_url, category, recipients })`, authenticated with a Project JWT from the dashboard ([magicbell-js docs](https://www.magicbell.com/docs/libraries/magicbell-js)).
- `recipients` takes 1 to 1,000 entries per broadcast ([broadcast](https://www.magicbell.com/docs/primitive/broadcast)). Topics are mentioned in prose but are absent from the schema.
- Batching or digests: none found in the docs or OpenAPI files. Workflows offer `broadcast`, `wait`, `pause` and `abort` ([workflows](https://www.magicbell.com/workflows)).

### Preferences

Per recipient, by channel and category, with a `UserPreferences` component and a preferences API ([in-app channel](https://www.magicbell.com/docs/channels/in_app), [React docs](https://www.magicbell.com/docs/libraries/magicbell-react)).

---

## SuprSend (additional candidate)

The only other service screened that offers a React inbox and its own browser push with a free tier. Product and free plan are current ([pricing](https://www.suprsend.com/pricing)).

### Free tier

- "$0 /month", "No Credit Card required", "10k Notifications/mo", "In-app notification feed (with SuprSend branding)" ([pricing](https://www.suprsend.com/pricing)).
- Each channel counts as a separate notification ([pricing](https://www.suprsend.com/pricing)).
- Not on Free: Batching, Digest, Channel Preferences, the ready-made preference centre. Web Push and the headless inbox are on Free ([pricing](https://www.suprsend.com/pricing)).
- "Unlock all features for 30 days trial, after which account transitions to Free Plan" ([pricing](https://www.suprsend.com/pricing)).
- "Sandbox is a trial workspace. It expires 30 days after you sign up." Staging and Production workspaces also exist ([quick start](https://docs.suprsend.com/docs/quick-start-guide.md)).
- Signup offers email, Google, Microsoft and GitHub ([sign-up](https://auth.suprsend.com/sign-up)). Company-email and approval requirements are not stated.

### Channels

- "For Mobile Push, Web Push, Slack, Teams and In-app Inbox, we offer direct integrations with the channels and you do not require any intermediary provider." ([pricing](https://www.suprsend.com/pricing))
- Email later: "For SMS and Email, you will need downstream messaging providers." ([pricing](https://www.suprsend.com/pricing))

### React SDK

- `@suprsend/react` 1.6.0 (prebuilt components) on top of `@suprsend/react-core` 2.5.0 (providers and hooks). Both declare `react: >= 16.8.0` ([npm](https://registry.npmjs.org/@suprsend/react/latest), [npm](https://registry.npmjs.org/@suprsend/react-core/latest)).
- Two dependencies of the prebuilt package declare React ranges that stop at 18: `react-popper` 2.3.0 and `react-timeago` 7.2.0 ([npm](https://registry.npmjs.org/react-popper/2.3.0), [npm](https://registry.npmjs.org/react-timeago/7.2.0)). The headless package does not depend on them. No doc sentence names React 19.
- Headless hooks: `useFeedClient`, `useFeedData`, `useFeed` ([headless feed](https://docs.suprsend.com/docs/react-sdk-headless-feed.md)).
- Server rendering: no documented note for React Router. One docs sentence: "With no `window` (for example, during server-side rendering), the browser counts as online." ([JS feed docs](https://docs.suprsend.com/docs/js-inapp-feed.md)). Read from source: the client is constructed during render with browser globals guarded, and identify runs in an effect ([SuprSendProvider.tsx](https://github.com/suprsend/suprsend-react-core/blob/main/src/core/context/SuprSendProvider.tsx)).

### Live updates

A socket the browser opens (`socket.io-client`, WebSocket transport, `new_notification` event) ([JS feed docs](https://docs.suprsend.com/docs/js-inapp-feed.md), [feed.ts](https://github.com/suprsend/suprsend-web-sdk/blob/main/src/feed.ts)).

### Browser identity

- A public API key plus an optional ES256 JWT signed by our server. "All requests will be rejected by SuprSend if enhanced security mode is on and signed user token is not provided." ([client authentication](https://docs.suprsend.com/docs/client-authentication.md))
- "Sandbox doesn't check your token yet." Enhanced Security Mode is off in Sandbox ([add a channel](https://docs.suprsend.com/docs/add-a-channel.md)).
- Switching people: passing `null` as `distinctId` is documented as "kind of logout" ([React docs](https://docs.suprsend.com/docs/react-1.md)). A change from one id to another is not documented. Read from source, not run: the provider's effect on `distinctId` resets the client (removing feeds and aborting the socket), then authenticates the new id ([SuprSendProvider.tsx](https://github.com/suprsend/suprsend-react-core/blob/main/src/core/context/SuprSendProvider.tsx)).
- Push on switch, read from source, not run: `reset()` removes the outgoing person's web push token by default, and the next identify sends the browser's subscription for the new person ([main.ts](https://github.com/suprsend/suprsend-web-sdk/blob/main/src/main.ts)). The changelog says "`reset()` removes the push token and sets the unsubscribe flag" ([SDK changelog](https://docs.suprsend.com/docs/developer/versioning/sdk-changelog.md)).

### Recipients

Not required before a send: the trigger "doesn't require user creation before hand", and recipients passed inline are upserted ([Node trigger](https://docs.suprsend.com/docs/node-trigger-workflow-from-api.md), [users](https://docs.suprsend.com/docs/users.md)).

### Browser push

- "SuprSend generates the VAPID key pair for you." No Firebase for web ([add a channel](https://docs.suprsend.com/docs/add-a-channel.md)).
- A `serviceworker.js` at the site root that imports SuprSend's script from a CDN; the VAPID public key goes in the `vapidKey` prop ([React web push](https://docs.suprsend.com/docs/react-webpush.md)).
- "Web push needs HTTPS. `localhost` is exempt in most browsers, so local development works" ([add a channel](https://docs.suprsend.com/docs/add-a-channel.md)).
- The docs pin older service worker script versions (4.0.0 and 3.0.3) than the current web SDK (5.5.0) ([React web push](https://docs.suprsend.com/docs/react-webpush.md), [JS web push](https://docs.suprsend.com/docs/js-webpush.md), [web SDK repo](https://github.com/suprsend/suprsend-web-sdk)).

### Inbound webhooks

None described for inbox or web push. With enhanced security on, our server needs its own endpoint to mint the JWT, called by our browser ([add a channel](https://docs.suprsend.com/docs/add-a-channel.md)).

### Sending

- `@suprsend/node-sdk`: `supr_client.workflows.trigger(new WorkflowTriggerRequest(body))` ([Node trigger](https://docs.suprsend.com/docs/node-trigger-workflow-from-api.md)).
- "You can add up to 100 recipients in a single API." ([trigger API](https://docs.suprsend.com/reference/trigger-workflow-api.md)). "Lists & Broadcasts" is on the Free plan card; "Data Modeling: Objects" is on the Business plan card ([pricing](https://www.suprsend.com/pricing)).
- Batch and digest nodes exist but are "Not included" on Free ([batch](https://docs.suprsend.com/docs/batch.md), [pricing](https://www.suprsend.com/pricing)).

### Preferences

They exist, with ready-made UI, but are not on Free ([preferences](https://docs.suprsend.com/docs/user-preferences.md), [pricing](https://www.suprsend.com/pricing)).

---

## Screened and not investigated

| Candidate | Why not | Source |
| --- | --- | --- |
| Pingram (formerly NotificationAPI) | Live FAQ and pricing list email, SMS and voice only; in-app and web push doc pages return 404 | [FAQ](https://www.pingram.io/docs/faq), [pricing](https://www.pingram.io/pricing) |
| Engagespot | Site and pricing page returned HTTP 404; free tier unconfirmable | [pricing](https://engagespot.co/pricing) |
| Fyno | Site returned HTTP 502 on three attempts; React inbox package is an alpha | [pricing](https://fyno.io/pricing), [npm](https://registry.npmjs.org/@fyno/inapp-react/latest) |
| OneSignal | Web push, but in-app messages are for mobile apps only | [docs](https://documentation.onesignal.com/docs/in-app-messages-setup) |
| Stream Activity Feeds | Feed, but its push does not support web | [docs](https://getstream.io/activity-feeds/docs/react/push_introduction/) |
| Pusher Beams | Push only; no feed | [docs](https://pusher.com/docs/beams/) |
| Firebase Cloud Messaging | Delivery only; no stored feed or read state | [docs](https://firebase.google.com/docs/cloud-messaging) |
| Liveblocks Notifications | Inbox, but no browser push documented | [docs](https://liveblocks.io/docs/ready-made-features/notifications) |
| Pushwoosh | Web push, but no inbox component | [pricing](https://www.pushwoosh.com/pricing/) |
| Notificare | No free tier stated | [pricing](https://notificare.com/pricing/) |

Each line rests on a single page fetch.

## Could not verify

Applies to every provider:

- **Nothing was run.** No account was created and no SDK was rendered under React Router 8 framework mode. Server-rendering safety, hydration and React 19.2 behaviour are unconfirmed for all five. Only Courier documents server rendering at all, and only for Next.js.
- **Switching people in one browser** is documented by none of them for a change from one person to another. Every statement about it above is a reading of SDK source.
- **Signup requirements** beyond "no credit card" (company email, manual approval). Signup pages did not render. "No credit card" is stated by Knock, Novu and SuprSend; Courier and MagicBell state nothing either way.
- **Web push on `http://localhost` through each provider's own flow.** The browser rule is confirmed (shared section); only SuprSend states it for its own product. FCM's "HTTPS only" sentence is silent on `localhost`.

Knock:

- Whether a server render of `KnockProvider` makes the inline identify HTTP call from the server.
- Whether the previous person keeps receiving this browser's push after a switch. It follows from per-user token storage and explicit removal, but no page states it.
- Behaviour of a trigger for a bare id that was never identified.

Novu:

- Whether React Router 8's server build resolves `@novu/react` to the server stubs.
- Whether the previous client's socket is closed when `subscriberId` changes.
- Whether a trigger with a bare string `subscriberId` creates a missing subscriber (the docs contradict each other).
- Inbox retention on Free: the limits page says 30 days; a pricing table row read unclearly as 24 hours.
- A request rate figure for Free (possibly 60 events per second) was not readable with confidence.

Courier:

- Whether web push works through Courier at all, for example an FCM web token registered under `firebase-fcm`.
- Plan gating of "Digest & batching", and which plan gets which log retention.
- Whether the previous person's messages are cleared from view between sign-out and reload.
- Whether an inbox send to a `user_id` that has never signed in is stored and shown on first sign-in.
- Whether an inbox send works with inline content and no template.

MagicBell:

- React 19 support: no peer range and no statement.
- What happens past 1,000 deliveries on Builder.
- Who supplies the VAPID keys by default, and whether we must host our own `/sw.js` (the docs and the product page disagree).
- Whether batching, digests or outbound webhooks exist in the dashboard; they are absent from the docs.
- Whether an optional unsigned or HMAC mode still exists; current docs describe only the JWT.
- Notification retention on Builder, and rate limits.

SuprSend:

- What happens to a development setup when the Sandbox workspace expires at 30 days.
- Whether Enhanced Security Mode is off by default outside Sandbox, and whether VAPID keys are pre-generated there.
- Whether the prebuilt components install and run under React 19 given the two dependency peer ranges.
- Whether the outgoing person's push token removal completes before the next person's registration on a switch.
