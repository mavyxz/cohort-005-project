// PROTOTYPE, throwaway. This is the spike for "Does Knock hold up against
// Cadence?" (issue #24). It lives only on the `prototype/knock-spike` branch.
// It is not the production design. Where triggering lives, how failures are
// handled, and how users sync with Knock are all still open on the map.
import Knock, { signUserToken } from "@knocklabs/node";

export const KNOCK_WORKFLOWS = {
  discussionReply: "discussion-reply",
  newEnrollment: "new-enrollment",
} as const;

// The Knock recipient id for a Cadence user. A signed token's `sub` must be
// exactly this string, or the feed won't match the trigger's recipient.
export function knockUserId(userId: number) {
  return String(userId);
}

let client: Knock | undefined;
export function knock() {
  client ??= new Knock({ apiKey: process.env.KNOCK_API_KEY });
  return client;
}

export function signKnockUserToken(userId: number) {
  return signUserToken(knockUserId(userId), {
    signingKey: process.env.KNOCK_SIGNING_KEY,
    expiresInSeconds: 3600,
  });
}

export function knockPublicConfig() {
  return {
    publicApiKey: process.env.KNOCK_PUBLIC_API_KEY ?? "",
    feedChannelId: process.env.KNOCK_FEED_CHANNEL_ID ?? "",
  };
}

type Recipient = { id: number; name: string; email: string };

function inlineRecipient(user: Recipient) {
  return { id: knockUserId(user.id), name: user.name, email: user.email };
}

export async function triggerDiscussionReply(args: {
  questionAuthor: Recipient;
  replier: Recipient;
  lessonTitle: string;
  lessonUrl: string;
  replyExcerpt: string;
}) {
  if (args.questionAuthor.id === args.replier.id) return null; // never notify yourself
  return knock().workflows.trigger(KNOCK_WORKFLOWS.discussionReply, {
    recipients: [inlineRecipient(args.questionAuthor)],
    actor: inlineRecipient(args.replier),
    data: {
      replier_name: args.replier.name,
      lesson_title: args.lessonTitle,
      lesson_url: args.lessonUrl,
      reply_excerpt: args.replyExcerpt,
    },
  });
}

export async function triggerNewEnrollment(args: {
  instructor: Recipient;
  student: Recipient;
  courseTitle: string;
  courseUrl: string;
}) {
  return knock().workflows.trigger(KNOCK_WORKFLOWS.newEnrollment, {
    recipients: [inlineRecipient(args.instructor)],
    actor: inlineRecipient(args.student),
    data: {
      student_name: args.student.name,
      course_title: args.courseTitle,
      course_url: args.courseUrl,
    },
  });
}
