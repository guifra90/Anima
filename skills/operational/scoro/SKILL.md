---
name: scoro
description: >
  Advanced agency operations via Scoro. 
  Monitor projects, tasks, financials, and team workload.
  This skill provides READ-ONLY access to production data.
metadata:
  paperclip:
    version: 2.0.0
    category: operational
---

# Scoro Skill (Advanced Ops)

Use this skill to interface with the Mirror Agency database on Scoro. It allows for autonomous project health checks, task monitoring, and financial auditing.

## Core Capabilities

### 1. Project Management (`list_projects`, `get_project_details`)
- **Use Case**: Identify active projects and their high-level status.
- **PM Logic**: Regularly check `get_project_details` to identify projects approaching their deadline or exceeding the `completed_budget`.

### 2. Task Control (`get_tasks`)
- **Use Case**: Drill down into specific project blockers.
- **PM Logic**: Filter tasks where `is_overdue` is true. Escalate to the human owner if more than 3 tasks are overdue on a critical project.

### 3. Financial Oversight (`get_financial_summary`)
- **Use Case**: Monitor billing status and agency margins.
- **CFO Logic**: Use this to generate the "Monthly Cashflow Alert". Identify `pending_invoices` that are `Overdue` and prepare a report for the Account Manager.

### 4. Workload Analysis (`get_time_entries`)
- **Use Case**: Analyze team effort distribution.
- **HR/PM Logic**: Check `get_time_entries` to see if a project is consuming more hours than estimated (Workload Drift).

## Critical Rules
- **READ-ONLY**: Never attempt to modify project data, tasks, or budgets via this skill. 
- **Data Integrity**: Report numbers exactly as they appear in Scoro.
- **Mission Continuum**: Always correlate Scoro data with the current Mission scope to maintain context.

## Available Tools
- `list_projects({ limit })`: List projects.
- `get_project_details({ projectId })`: Detailed financials and status.
- `get_tasks({ projectId, limit })`: Task breakdown.
- `get_financial_summary({ limit })`: Invoice and margin overview.
- `get_time_entries({ projectId, limit })`: Team effort log.
