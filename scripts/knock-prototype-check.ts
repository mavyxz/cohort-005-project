// PROTOTYPE, throwaway: headless checks for "Does Knock hold up against Cadence?"
// Run with: npx tsx --env-file=.env scripts/knock-prototype-check.ts <check>
//   tokens: check 1 (signed tokens, including user A asking for user B's feed)
//   reply:  check 2+3 (trigger Discussion Reply → feed → unread → mark seen/read)
//   prefs:  check 4 (new Enrollment is off by default, then the user opts in)
import { signUserToken } from "@knocklabs/node";
import Knock from "@knocklabs/node";

const PK = process.env.KNOCK_PUBLIC_API_KEY!;
const CH = process.env.KNOCK_FEED_CHANNEL_ID!;
const knock = new Knock({ apiKey: process.env.KNOCK_API_KEY });
const api = "https://api.knock.app/v1";

async function asUser(token: string | null, method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${PK}`,
    "Content-Type": "application/json",
  };
  if (token) headers["X-Knock-User-Token"] = token;
  const res = await fetch(api + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

const feed = (uid: string, token: string, q = "") =>
  asUser(token, "GET", `/users/${uid}/feeds/${CH}${q}`);

function summarize(r: { status: number; json: any }) {
  if (r.status !== 200) return { status: r.status, error: r.json?.code ?? r.json };
  return {
    status: 200,
    meta: r.json.meta,
    items: r.json.entries.map((e: any) => ({
      id: e.id,
      workflow: e.source?.key,
      seen: !!e.seen_at,
      read: !!e.read_at,
      body: e.blocks?.find((b: any) => b.name === "body")?.rendered?.replace(/<[^>]+>/g, "").trim(),
    })),
  };
}

async function waitForItems(uid: string, token: string, min: number, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await feed(uid, token);
    if (r.status === 200 && r.json.entries.length >= min) return r;
    await new Promise((res) => setTimeout(res, 1000));
  }
  return feed(uid, token);
}

const log = (label: string, v: unknown) => console.log(`\n## ${label}\n` + JSON.stringify(v, null, 2));

async function tokens() {
  const tokenFor5 = await signUserToken("5");
  log("No token, public key only → user 5's feed", summarize(await asUser(null, "GET", `/users/5/feeds/${CH}`)));
  log("User 5's token → user 5's feed", summarize(await feed("5", tokenFor5)));
  log("User 5's token → user 6's feed (must be rejected)", summarize(await feed("6", tokenFor5)));
  const forged = tokenFor5.slice(0, -4) + (tokenFor5.endsWith("AAAA") ? "BBBB" : "AAAA");
  log("Tampered token → user 5's feed (must be rejected)", summarize(await feed("5", forged)));
  const expired = await signUserToken("5", { expiresInSeconds: -60 });
  log("Expired token → user 5's feed (must be rejected)", summarize(await feed("5", expired)));
}

async function reply() {
  // Emma Wilson (5) asked; Sarah Chen (2) replies.
  const uid = "5";
  const token = await signUserToken(uid);
  const before = summarize(await feed(uid, token));
  log("Feed before", before);
  const run = await knock.workflows.trigger("discussion-reply", {
    recipients: [{ id: uid, name: "Emma Wilson", email: "emma@example.com" }],
    actor: { id: "2", name: "Sarah Chen", email: "sarah@example.com" },
    data: {
      replier_name: "Sarah Chen",
      lesson_title: "Prototype lesson",
      lesson_url: "/courses/prototype",
      reply_excerpt: "Headless check reply",
    },
  });
  log("Trigger", run);
  const n = (before as any).items?.length ?? 0;
  const after = summarize(await waitForItems(uid, token, n + 1));
  log("Feed after trigger", after);
  const newest = (after as any).items[0];
  log("Mark seen", (await asUser(token, "PUT", `/messages/${newest.id}/seen`)).status);
  log("Feed after seen", summarize(await feed(uid, token)).meta);
  log("Mark read", (await asUser(token, "PUT", `/messages/${newest.id}/read`)).status);
  log("Feed after read", summarize(await feed(uid, token)).meta);
  log("Mark unread", (await asUser(token, "DELETE", `/messages/${newest.id}/read`)).status);
  log("Feed after unread", summarize(await feed(uid, token)).meta);
  log("Batch mark read (all)", (await asUser(token, "POST", `/messages/batch/read`, { message_ids: [newest.id] })).status);
  log("Feed after batch read", summarize(await feed(uid, token)).meta);
  log("Unread-only filter", summarize(await feed(uid, token, "?status=unread")).meta);
  // user 6 tries to mark user 5's message
  const token6 = await signUserToken("6");
  log("User 6 marks user 5's message unread (must be rejected)", await asUser(token6, "DELETE", `/messages/${newest.id}/read`));
}

async function prefs() {
  // A fresh instructor id that has never had preferences written.
  const uid = `prefs-probe-${Date.now()}`;
  const token = await signUserToken(uid);
  const trigger = () =>
    knock.workflows.trigger("new-enrollment", {
      recipients: [{ id: uid, name: "Probe Instructor", email: `${uid}@example.com` }],
      actor: { id: "5", name: "Emma Wilson", email: "emma@example.com" },
      data: { student_name: "Emma Wilson", course_title: "Prototype course", course_url: "/courses/prototype" },
    });
  log("Recipient", uid);
  log("Preferences before (should be empty)", await knock.users.getPreferences(uid, "default").catch((e) => String(e)));
  log("Trigger 1 (default: off)", await trigger());
  await new Promise((r) => setTimeout(r, 8000));
  log("Feed after trigger 1 (expect 0 items)", summarize(await feed(uid, token)));
  log("Messages for recipient after trigger 1", (await knock.users.listMessages(uid)).getPaginatedItems().map((m: any) => ({ status: m.status, workflow: m.source?.key })));
  // the user opts in, from the browser, with their own token
  const optIn = await asUser(token, "PUT", `/users/${uid}/preferences/default`, {
    __persistence_strategy__: "merge",
    categories: { enrollments: { channel_types: { in_app_feed: true } } },
  });
  log("Opt in (as the user, public key + user token)", { status: optIn.status, categories: optIn.json?.categories });
  log("Trigger 2 (opted in)", await trigger());
  log("Feed after trigger 2 (expect 1 item)", summarize(await waitForItems(uid, token, 1)));
}

const which = process.argv[2];
await ({ tokens, reply, prefs } as Record<string, () => Promise<void>>)[which]();
