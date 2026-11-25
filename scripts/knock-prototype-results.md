# PROTOTYPE evidence: Does Knock hold up against Cadence? (#24)

Raw output captured 2026-11-25 against Knock Development. Throwaway branch, never merge.

## Check 1: signed tokens (scripts/knock-prototype-check.ts tokens)
```

## No token, public key only → user 5's feed
{
  "status": 400,
  "error": "missing_user_token"
}

## User 5's token → user 5's feed
{
  "status": 200,
  "meta": {
    "total_count": 0,
    "__typename": "FeedMetadata",
    "unread_count": 0,
    "unseen_count": 0
  },
  "items": []
}

## User 5's token → user 6's feed (must be rejected)
{
  "status": 403,
  "error": "authorization"
}

## Tampered token → user 5's feed (must be rejected)
{
  "status": 400,
  "error": "invalid_user_token"
}

## Expired token → user 5's feed (must be rejected)
{
  "status": 200,
  "meta": {
    "total_count": 0,
    "__typename": "FeedMetadata",
    "unread_count": 0,
    "unseen_count": 0
  },
  "items": []
}
```

## Setup (scripts/knock-prototype-setup.ts)
```
in-app feed channel key: in-app
preference category discussions
preference category enrollments
upserted + committed discussion-reply fsm0oEZOAo51o+dekoMx6REgYLwqseNHwIm12lkHsxk=
upserted + committed new-enrollment Nv40E8Sb6IGNMY1BXl2K979OL4PmbjJedXdYpqzYJ+Q=
environment defaults {"updated_at":"2026-11-25T16:35:53.016745Z","preference_set":{"categories":{"enrollments":false}},"created_at":"2026-11-25T16:35:53.016745Z"}
```

## Checks 2+3: trigger + headless feed (… reply)
```

## Feed before
{
  "status": 200,
  "meta": {
    "total_count": 0,
    "__typename": "FeedMetadata",
    "unread_count": 0,
    "unseen_count": 0
  },
  "items": []
}

## Trigger
{
  "workflow_run_id": "0d59251d-3436-537d-9462-fadc9fa4a398"
}

## Feed after trigger
{
  "status": 200,
  "meta": {
    "total_count": 1,
    "__typename": "FeedMetadata",
    "unread_count": 1,
    "unseen_count": 1
  },
  "items": [
    {
      "id": "3MbgDLZ4pdRV3gSkLd32JeIUc7D",
      "workflow": "discussion-reply",
      "seen": false,
      "read": false,
      "body": "Sarah Chen replied to your question on Prototype lesson: Headless check reply"
    }
  ]
}

## Mark seen
200

## Feed after seen
{
  "total_count": 1,
  "__typename": "FeedMetadata",
  "unread_count": 1,
  "unseen_count": 0
}

## Mark read
200

## Feed after read
{
  "total_count": 1,
  "__typename": "FeedMetadata",
  "unread_count": 0,
  "unseen_count": 0
}

## Mark unread
200

## Feed after unread
{
  "total_count": 1,
  "__typename": "FeedMetadata",
  "unread_count": 1,
  "unseen_count": 0
}

## Batch mark read (all)
200

## Feed after batch read
{
  "total_count": 1,
  "__typename": "FeedMetadata",
  "unread_count": 0,
  "unseen_count": 0
}

## Unread-only filter
{
  "total_count": 1,
  "__typename": "FeedMetadata",
  "unread_count": 0,
  "unseen_count": 0
}

## User 6 marks user 5's message unread (must be rejected)
{
  "status": 403,
  "json": {
    "code": "authorization",
    "message": "You are not allowed to access that resource",
    "status": 403,
    "type": "authentication_error"
  }
}
```

## Check 4: opt-in-only preference (… prefs)
```

## Recipient
"prefs-probe-1795624570515"

## Preferences before (should be empty)
"Error: 404 The resource you requested does not exist"

## Trigger 1 (default: off)
{
  "workflow_run_id": "f9ed651f-71ca-58dd-9f6f-045810b8f4d3"
}

## Feed after trigger 1 (expect 0 items)
{
  "status": 200,
  "meta": {
    "total_count": 0,
    "__typename": "FeedMetadata",
    "unread_count": 0,
    "unseen_count": 0
  },
  "items": []
}

## Messages for recipient after trigger 1
[]

## Opt in (as the user, public key + user token)
{
  "status": 200,
  "categories": {
    "enrollments": {
      "channel_types": {
        "in_app_feed": true
      }
    }
  }
}

## Trigger 2 (opted in)
{
  "workflow_run_id": "a9d28077-968a-53d8-bc42-91073c0660fe"
}

## Feed after trigger 2 (expect 1 item)
{
  "status": 200,
  "meta": {
    "total_count": 1,
    "__typename": "FeedMetadata",
    "unread_count": 1,
    "unseen_count": 1
  },
  "items": [
    {
      "id": "3MbgG7dyPmn7isVuIcc7K4P0hgm",
      "workflow": "new-enrollment",
      "seen": false,
      "read": false,
      "body": "Emma Wilson enrolled in Prototype course"
    }
  ]
}
```

## Check 4 control: env default cleared vs restored
```
clear defaults {"updated_at":null,"preference_set":null,"created_at":null}
no env default, fresh recipient → feed items: 1
restore defaults {"categories":{"enrollments":false}}
env default restored, fresh recipient → feed items: 0
```

## Real app: reply action + DevUI switching

Sarah Chen (2) replied to Emma Wilson's (5) Discussion Question (comment 1, lesson 3) through the real lesson action. The page tokens had sub 2 and sub 5. Emma's feed showed the discussion-reply item. Sarah's feed was empty. Sarah's token on Emma's feed returned 403 authorization.

Expired tokens: a token hand-signed with exp two days in the past still returned 200 on the feed.

## Check 4, category × channel (scripts/knock-prototype-channel-check.ts). This default is the one left in place
```
set default {"categories":{"enrollments":{"channel_types":{"in_app_feed":false}}}}
fresh recipient, default (enrollments × in_app_feed: false) → items: 0
opt in → 200 {"enrollments":{"channel_types":{"in_app_feed":true}}}
after opt in → items: 1
opt out → 200 {"enrollments":{"channel_types":{"in_app_feed":false}}}
after opt out → items (expect unchanged): 1
```

Note: rows 3 and 4 ran from Node/curl with the credentials a browser would hold (public key + user token). Nobody has clicked through the /prototype/knock page in a browser yet.
