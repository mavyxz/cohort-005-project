// PROTOTYPE, throwaway: the spike for "Does Knock hold up against Cadence?" (#24).
// It lives only on the `prototype/knock-spike` branch.
//
// About the shape: the ticket asks for a spike against the real app, so this is
// a throwaway route inside the app layout. It is not a standalone HTML file,
// because signing tokens needs the server key and the page has to follow the
// DevUI switcher.
//
// What it checks:
//  1. The server signs an RS256 user token for the DevUI user. The browser
//     calls Knock with the public key + that token only, never the secret key.
//  2. Discussion Reply → question author fires from the real reply action on
//     the lesson page. It shows up here for the question author.
//  3. The headless feed API: list, unread/unseen counts, mark seen/read/unread.
//  4. The "enrollments" category is off by default. The user opts in for the
//     in-app feed. Then "Simulate new Enrollment" delivers.
import { useCallback, useEffect, useState } from "react";
import { Form, data } from "react-router";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/prototype.knock";
import { db } from "~/db";
import { courses, users, UserRole } from "~/db/schema";
import { getCurrentUserId } from "~/lib/session";
import {
  knockPublicConfig,
  knockUserId,
  signKnockUserToken,
  triggerNewEnrollment,
} from "~/lib/knock.prototype.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    throw data("Select a user from the DevUI panel", { status: 401 });
  }
  const user = db.select().from(users).where(eq(users.id, userId)).get()!;
  const allCourses = db
    .select({ id: courses.id, title: courses.title, instructorId: courses.instructorId })
    .from(courses)
    .all();
  return {
    user: { id: user.id, name: user.name, role: user.role },
    knockUserId: knockUserId(user.id),
    userToken: await signKnockUserToken(user.id),
    ...knockPublicConfig(),
    courses: allCourses,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await getCurrentUserId(request);
  if (!userId) throw data("Select a user from the DevUI panel", { status: 401 });
  const form = await request.formData();
  const course = db
    .select()
    .from(courses)
    .where(eq(courses.id, Number(form.get("courseId"))))
    .get()!;
  const student = db.select().from(users).where(eq(users.id, userId)).get()!;
  const instructor = db.select().from(users).where(eq(users.id, course.instructorId)).get()!;
  const run = await triggerNewEnrollment({
    instructor,
    student,
    courseTitle: course.title,
    courseUrl: `/courses/${course.slug}`,
  });
  return { triggered: `new-enrollment → ${instructor.name}`, run };
}

type FeedItem = {
  id: string;
  inserted_at: string;
  seen_at: string | null;
  read_at: string | null;
  source: { key: string };
  blocks: { name: string; rendered: string }[];
  data: Record<string, unknown>;
};
type Feed = {
  entries: FeedItem[];
  meta: { total_count: number; unread_count: number; unseen_count: number };
};

export default function KnockPrototype({ loaderData, actionData }: Route.ComponentProps) {
  const { user, knockUserId, userToken, publicApiKey, feedChannelId } = loaderData;
  const [feed, setFeed] = useState<Feed | null>(null);
  const [prefs, setPrefs] = useState<unknown>(null);
  const [lastCall, setLastCall] = useState<string>("");

  // Browser → Knock with the public key + signed user token, nothing else.
  const knock = useCallback(
    async (method: string, path: string, body?: unknown) => {
      const res = await fetch(`https://api.knock.app/v1${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${publicApiKey}`,
          "X-Knock-User-Token": userToken,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => null);
      setLastCall(`${method} ${path} → ${res.status}`);
      return { status: res.status, json };
    },
    [publicApiKey, userToken]
  );

  const refresh = useCallback(async () => {
    const f = await knock("GET", `/users/${knockUserId}/feeds/${feedChannelId}`);
    if (f.status === 200) setFeed(f.json);
    const p = await knock("GET", `/users/${knockUserId}/preferences/default`);
    setPrefs(p.status === 200 ? p.json : { status: p.status, ...p.json });
  }, [knock, knockUserId, feedChannelId]);

  useEffect(() => {
    setFeed(null);
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const mark = async (id: string, status: "seen" | "read", on: boolean) => {
    await knock(on ? "PUT" : "DELETE", `/messages/${id}/${status}`);
    refresh();
  };
  const setEnrollments = async (on: boolean) => {
    await knock("PUT", `/users/${knockUserId}/preferences/default`, {
      __persistence_strategy__: "merge",
      categories: { enrollments: { channel_types: { in_app_feed: on } } },
    });
    refresh();
  };
  const tryOtherUser = async () => {
    const other = knockUserId === "1" ? "2" : "1";
    await knock("GET", `/users/${other}/feeds/${feedChannelId}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
        PROTOTYPE, throwaway. Spike for <em>Does Knock hold up against Cadence?</em>
      </div>

      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Knock spike as {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {user.role} · Knock recipient id <code>{knockUserId}</code> · token sub{" "}
          <code>{JSON.parse(atob(userToken.split(".")[1])).sub}</code> · last call{" "}
          <code>{lastCall}</code>
        </p>
        <Button variant="outline" size="sm" onClick={tryOtherUser}>
          Try reading another user's feed with my token (expect 403)
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">
          Notification Feed: {feed?.meta.unread_count ?? "…"} unread ·{" "}
          {feed?.meta.unseen_count ?? "…"} unseen · {feed?.meta.total_count ?? "…"} total
        </h2>
        {feed && feed.entries.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await knock("POST", `/messages/batch/seen`, {
                message_ids: feed.entries.map((e) => e.id),
              });
              refresh();
            }}
          >
            Mark all seen
          </Button>
        )}
        <ul className="divide-y rounded border">
          {feed?.entries.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 p-3">
              <div>
                <div
                  className={item.read_at ? "text-muted-foreground" : "font-medium"}
                  dangerouslySetInnerHTML={{
                    __html: item.blocks.find((b) => b.name === "body")?.rendered ?? "",
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  {item.source.key} · {new Date(item.inserted_at).toLocaleTimeString()} ·{" "}
                  {item.seen_at ? "seen" : "unseen"} · {item.read_at ? "read" : "unread"}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => mark(item.id, "seen", !item.seen_at)}>
                  {item.seen_at ? "Unsee" : "See"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => mark(item.id, "read", !item.read_at)}>
                  {item.read_at ? "Mark unread" : "Mark read"}
                </Button>
              </div>
            </li>
          ))}
          {feed?.entries.length === 0 && <li className="p-3 text-sm">No Notifications.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Preferences: new Enrollment (opt-in only)</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEnrollments(true)}>Opt in to new Enrollment</Button>
          <Button size="sm" variant="outline" onClick={() => setEnrollments(false)}>Opt out</Button>
        </div>
        <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(prefs, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Simulate a new Enrollment (you enrol; the course's Instructor is notified)</h2>
        <Form method="post" className="flex gap-2">
          <select name="courseId" className="rounded border px-2 py-1 text-sm">
            {loaderData.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (instructor #{c.instructorId})
              </option>
            ))}
          </select>
          <Button size="sm" type="submit">Trigger new-enrollment</Button>
        </Form>
        {actionData && (
          <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(actionData, null, 2)}</pre>
        )}
        <p className="text-xs text-muted-foreground">
          Discussion Reply is not simulated here. Reply to someone's Discussion Question on a
          lesson page, then switch to that user in the DevUI.
        </p>
      </section>
    </div>
  );
}
