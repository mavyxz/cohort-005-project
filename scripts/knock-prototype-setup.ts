export {};
// PROTOTYPE, throwaway: sets up Knock Development for the spike in
// "Does Knock hold up against Cadence?" (#24) through the Management API.
// It needs KNOCK_SERVICE_TOKEN in .env. Run with:
//   npx tsx --env-file=.env scripts/knock-prototype-setup.ts
// It upserts and commits two workflows, then sets the environment's default
// preference set so the `enrollments` category is off unless a user opts in.
const TOKEN = process.env.KNOCK_SERVICE_TOKEN;
if (!TOKEN) throw new Error("KNOCK_SERVICE_TOKEN missing from .env");
const ENV = "development";
const mapi = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`https://control.knock.app/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
};

const channels = await mapi("GET", `/channels`);
const feed = channels.entries.find((c: any) => c.id === process.env.KNOCK_FEED_CHANNEL_ID);
if (!feed) throw new Error(`feed channel not found: ${JSON.stringify(channels.entries.map((c: any) => [c.key, c.id]))}`);
console.log("in-app feed channel key:", feed.key);

const workflows = {
  "discussion-reply": {
    name: "Discussion Reply → question author",
    categories: ["discussions"],
    steps: [
      {
        ref: "in_app_feed_1",
        type: "channel",
        channel_key: feed.key,
        template: {
          markdown_body:
            "**{{ data.replier_name }}** replied to your question on **{{ data.lesson_title }}**: {{ data.reply_excerpt }}",
          action_url: "{{ data.lesson_url }}",
        },
      },
    ],
  },
  "new-enrollment": {
    name: "New Enrollment → Instructor",
    categories: ["enrollments"],
    steps: [
      {
        ref: "in_app_feed_1",
        type: "channel",
        channel_key: feed.key,
        template: {
          markdown_body: "**{{ data.student_name }}** enrolled in **{{ data.course_title }}**",
          action_url: "{{ data.course_url }}",
        },
      },
    ],
  },
};

for (const [key, workflow] of Object.entries(workflows)) {
  const r = await mapi(
    "PUT",
    `/workflows/${key}?environment=${ENV}&commit=true&commit_message=${encodeURIComponent("knock spike #24")}`,
    { workflow }
  );
  console.log("upserted + committed", key, r.workflow?.sha);
}

// Off by default and opt-in: the category is false in the environment default.
// A user's own preference set merges over it, so an opt-in turns it back on.
const defaults = await mapi("PUT", `/environments/${ENV}/defaults`, {
  preference_set: { categories: { enrollments: false } },
});
console.log("environment defaults", JSON.stringify(defaults));
