---
name: gmail
description: >
  Manage email communications, search for information in threads, and handle
  correspondence within Mirror Agency.
---

# Gmail Skill

This skill allows agents to interact with the agency's Gmail accounts. Use it to find client requests, coordinate with external partners, and stay updated on email-based workflows.

## Email Management

Use `search_emails` to find relevant threads. Be specific with your query to avoid exhausting your token limit with irrelevant data.

### Common Queries:
- `from:client@example.com`
- `subject:"Project Update"`
- `label:important`

## Rules
- **Concise**: When summarizing emails, focus on actionable information.
- **Drafts First**: If you need to send an email, create a draft first for review if the policy requires it.
- **Security**: Never share passwords or sensitive credentials found in emails.
