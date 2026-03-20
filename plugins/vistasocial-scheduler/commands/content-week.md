---
description: >
  Plan and generate a full week of social media content for a brand. Creates
  post copy following the format library and caption SOPs, respects the
  utility/scenic mix ratio, applies seasonal hooks, and optionally schedules
  all posts via batch-schedule. Use when building a content calendar from scratch.
allowed-tools: VistaSocial:schedulePost, VistaSocial:searchPosts, VistaSocial:listProfiles, VistaSocial:getOptimalPublishTimes, WebSearch, GoogleDrive
---

# Plan a Content Week

Generate a complete week of content for a brand, ready for scheduling.

## Step 1: Define the Week

Collect from the user:
- **Brand name** (e.g., "Santorini Secrets")
- **Network** (e.g., "threads" — or "all" for multi-network)
- **Week start date** (Monday of the target week)
- **Theme or seasonal hook** (optional — e.g., "Greek Easter", "shoulder season")
- **Any specific topics to include or avoid**

## Step 2: Check Existing Content

1. **Search VistaSocial** via `searchPosts` for the brand + date range to see if anything is already scheduled
2. **Search recent posts** from the past 2 weeks to avoid topic repetition
3. **Check Google Drive** for any pre-planned content or editorial calendars

## Step 3: Determine Post Count and Cadence

Look up the brand's cadence from the `scheduling-sop` skill:
- Daily brand (e.g., Santorini Threads) = 7 posts
- Mon/Wed/Fri brand (e.g., ViaTravelers Threads) = 3 posts
- Mixed schedule (e.g., Crete Instagram Tue/Thu/Sat/Sun) = 4 posts

## Step 4: Apply Format Mix Rules

For a 7-post week, enforce the content-creation skill's mix rules:

**Minimum distribution for Greece Threads (7 posts)**:
- 2–3 utility posts (tips, warnings, how-tos, itineraries)
- 2 local storytelling / hidden gem posts
- 1 debate prompt or opinion post
- 1–2 scenic/inspirational posts

**Never**: 3+ consecutive scenic-only posts.

## Step 5: Generate Content

For each post, create:
1. **Topic headline** (internal reference, not published)
2. **Post message** (following caption SOP for the network)
3. **First-comment link** (for Greece brands)
4. **Publish time** (from cadence standard, with correct UTC offset)
5. **Label** (brand-name,network,week-of-<date>)

### Threads Content Template (Greece brands)

```
Post [N]/[total] — [topic headline]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Post message — under 500 characters, conversational tone, strong hook]

Publish: [date] [time] [timezone]
Comment: → [link text]: https://[domain].com
Label: [brand],[network],week-of-[date]
Format: [utility/scenic/storytelling/debate]
```

## Step 6: Present Content Plan

Show the full week as a table for user review:

```
Content Week: Santorini Secrets Threads (Mar 30 – Apr 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Day  | Format      | Topic                              | Chars
Mon  | Utility     | Timed entry tickets at Acropolis    | 312
Tue  | Storytelling| Hidden chapel in Pyrgos             | 287
Wed  | Debate      | Oia vs Imerovigli for sunsets       | 341
Thu  | Utility     | Ferry booking hack for peak season  | 298
Fri  | Scenic      | Blue dome churches at golden hour   | 245
Sat  | Utility     | Skip the tourist restaurants        | 389
Sun  | Storytelling| Donkey path from Fira Old Port      | 276

Mix: 3 utility, 2 storytelling, 1 debate, 1 scenic ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 7: User Approval

Ask the user to:
1. Approve all posts as-is
2. Request edits to specific posts
3. Replace any topics

Do NOT proceed to scheduling until explicit approval.

## Step 8: Schedule (Optional)

If the user approves and wants to schedule:
- Hand off to the `/batch-schedule` workflow
- Apply all rate-limit pacing rules
- Report batch completion summary

If the user wants to review further or have Lexi schedule manually:
- Output the content plan in a format that can be shared in Slack #social-media
- Offer to draft a Slack message with the content plan for Lexi's review
