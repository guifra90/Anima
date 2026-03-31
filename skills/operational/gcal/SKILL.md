---
name: gcal
description: >
  Manage schedules, check availability, and coordinate meetings within 
  Mirror Agency through Google Calendar.
---

# Google Calendar Skill

This skill allows agents to manage calendars and scheduling. Use it to check for project deadlines, internal meetings, and external client appointments.

## Scheduling Management

Use `list_events` to understand the current schedule before making any changes or proposing new meetings.

### Common Operations:
- List events for today.
- Find free slots for a 30-minute meeting.
- Create a calendar event for a project milestone.

## Rules
- **No Conflicts**: Always check for existing events before creating a new one.
- **Buffers**: Include a 5-10 minute buffer between meetings when scheduling for others.
- **Clear Titles**: Use descriptive titles for all calendar events.
