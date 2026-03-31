---
name: scoro
description: >
  Monitor project status, budgets, and tasks within Scoro. 
  This skill provides READ-ONLY access to production project data.
  Use it to check project health, budget consumption, and overdue tasks.
---

# Scoro Skill (Read-Only)

Use this skill to retrieve real-time data from Scoro projects. This is a critical integration with production data, so all operations are deterministic and read-only.

## Project Monitoring

To check the status of a project, identify the `projectId` and use the `get_project_status` tool.

### Steps:
1. Identify the project you need to monitor.
2. Call `get_project_status` with the `projectId`.
3. Analyze the results:
    - **budget_used vs budget_total**: Check if the project is on budget.
    - **overdue_tasks**: Identify if there are immediate blockers.
    - **status**: Confirm the current lifecycle stage of the project.

## Critical Rules
- **READ-ONLY**: Never attempt to modify project data, tasks, or budgets via this skill. 
- **Deterministic**: Provide factual reports based on Scoro data without making assumptions.
- **Privacy**: Only share project details with authorized stakeholders.
