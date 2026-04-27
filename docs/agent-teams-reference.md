# Agent Teams — Master Reference Guide

Source: https://code.claude.com/docs/en/agent-teams  
Requires: Claude Code v2.1.32+, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## What Are Agent Teams?

A team consists of a **lead** (the main Claude Code session) that spawns and coordinates **teammates** (separate Claude Code instances). Each teammate has its own context window, works independently, and communicates via a shared task list and mailbox messaging system.

Unlike subagents (which only report back to the lead), teammates can message each other directly.

---

## Subagents vs. Agent Teams — Choose the Right Tool

| Dimension | Subagents | Agent Teams |
|---|---|---|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report to main agent only | Message each other directly |
| Coordination | Main agent manages all work | Shared task list, self-coordination |
| Token cost | Lower — results summarized back | Higher — each teammate is a full instance |
| Best for | Focused tasks where only the result matters | Complex work needing discussion/collaboration |

**Use subagents** when workers don't need to talk to each other.  
**Use agent teams** when teammates need to share findings, debate, and self-coordinate.

---

## Enabling Agent Teams

Add to `.claude/settings.json` (project-local) or `~/.claude/settings.json` (global):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set in shell: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## Architecture

| Component | Role |
|---|---|
| Team lead | Main session — creates team, spawns teammates, coordinates work |
| Teammates | Separate Claude Code instances working on assigned tasks |
| Task list | Shared work items teammates claim and complete |
| Mailbox | Direct messaging between any agents |

**Storage locations (auto-managed, do not hand-edit):**
- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`

The `config.json` holds runtime state (session IDs, pane IDs) and is overwritten on every state update. To define reusable roles, use subagent definitions instead.

---

## Display Modes

| Mode | How it works | When to use |
|---|---|---|
| `in-process` (default) | All teammates in one terminal; Shift+Down to cycle | Any terminal, no extra setup |
| `tmux` / split panes | Each teammate gets its own pane | When you need to see all output simultaneously |

**Set globally** in `~/.claude/settings.json`:
```json
{ "teammateMode": "in-process" }
```

**Override per session:**
```bash
claude --teammate-mode in-process
```

Split-pane mode requires tmux (`brew install tmux`) or iTerm2 with `it2` CLI + Python API enabled.  
Not supported in VS Code terminal, Windows Terminal, or Ghostty.

---

## Starting a Team

Tell the lead what you want in natural language. Example:

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Claude creates the team, spawns teammates, and coordinates based on your prompt. You can also specify teammate count and model:

```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

---

## Controlling the Team

### Talk to Teammates Directly
- **In-process**: Shift+Down to cycle, type to message, Enter to view session, Escape to interrupt, Ctrl+T to toggle task list
- **Split-pane**: Click into a teammate's pane

### Assign Tasks
- **Lead assigns**: tell the lead which task goes to which teammate
- **Self-claim**: teammates pick up unassigned, unblocked tasks after finishing

Task claiming uses file locking to prevent race conditions.

### Require Plan Approval Before Implementation
```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```
Teammate stays in read-only plan mode until lead approves. Lead can reject with feedback, and teammate revises and resubmits.

### Keep the Lead from Jumping In
```
Wait for your teammates to complete their tasks before proceeding
```

### Shut Down a Teammate
```
Ask the researcher teammate to shut down
```
The teammate can approve (graceful exit) or reject with explanation.

### Clean Up the Team
```
Clean up the team
```
Always run cleanup from the lead, not a teammate. Cleanup fails if any teammates are still running — shut them down first.

---

## Task Management

Tasks have three states: **pending**, **in progress**, **completed**.  
Tasks can have dependencies — a pending task with unresolved dependencies cannot be claimed until those are complete.

Rule of thumb: **5-6 tasks per teammate** keeps everyone productive without excessive context switching.

If the lead isn't creating enough tasks:
```
Split the work into smaller pieces before assigning
```

---

## Context and Communication

- Each teammate loads project context fresh at spawn: CLAUDE.md, MCP servers, skills
- The lead's conversation history does **not** carry over to teammates
- Include all task-specific context in the spawn prompt
- Messages are delivered automatically — lead does not need to poll
- Teammates notify the lead automatically when they go idle
- Any teammate can message any other by name; to broadcast, send one message per recipient

---

## Permissions

- Teammates start with the lead's permission settings
- If lead runs `--dangerously-skip-permissions`, all teammates do too
- Per-teammate modes can be changed after spawning but not at spawn time
- Pre-approve common operations before spawning to reduce permission-prompt friction

---

## Using Subagent Definitions for Teammates

Define reusable roles as subagent definitions (project, user, plugin, or CLI scope), then reference by name:

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

The teammate uses that definition's `tools` allowlist and `model`. The definition body appends to the teammate's system prompt.  
**Note:** `skills` and `mcpServers` frontmatter fields are ignored when running as a teammate — teammates load those from project/user settings like a normal session.

---

## Hooks for Quality Gates

| Hook | Trigger | Exit 2 behavior |
|---|---|---|
| `TeammateIdle` | Teammate about to go idle | Send feedback, keep teammate working |
| `TaskCreated` | Task being created | Prevent creation, send feedback |
| `TaskCompleted` | Task being marked complete | Prevent completion, send feedback |

---

## Best Practices

### Team Size
- Start with **3–5 teammates** for most workflows
- Token costs scale linearly — each teammate is a full Claude instance
- More teammates = more coordination overhead and diminishing returns
- Three focused teammates often outperform five scattered ones

### Task Sizing
- Too small: coordination overhead exceeds benefit
- Too large: long runs without check-ins increase wasted effort risk
- Right size: self-contained unit with a clear deliverable (one function, one test file, one review)

### Context in Spawn Prompts
Since teammates don't inherit conversation history, include everything they need:
```
Spawn a security reviewer with the prompt: "Review src/auth/ for security 
vulnerabilities. Focus on token handling, session management, and input 
validation. App uses JWT in httpOnly cookies. Report issues with severity ratings."
```

### Avoid File Conflicts
Two teammates editing the same file = overwrites. Assign each teammate a distinct file set.

### Monitor and Steer
Check in on progress, redirect approaches not working, synthesize findings as they arrive.  
Don't let a team run unattended for long periods.

### Start Simple
New to agent teams? Begin with research/review tasks (no code writes). Clear boundaries, high value, low coordination risk.

---

## Ideal Use Cases

| Use Case | Why Teams Excel |
|---|---|
| Research / review | Multiple angles simultaneously; teammates challenge each other |
| New modules / features | Each teammate owns separate files, no overlap |
| Debugging with competing hypotheses | Parallel investigation, adversarial debate narrows root cause faster |
| Cross-layer changes (frontend + backend + tests) | Each layer owned by one teammate |

**Not ideal for:** sequential tasks, same-file edits, work with many interdependencies — use a single session or subagents instead.

### Parallel Code Review Pattern
```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
```

### Competing Hypothesis Debugging Pattern
```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk 
to each other to disprove each other's theories, like a scientific debate. 
Update the findings doc with whatever consensus emerges.
```

---

## Token Cost Guidance

- Each teammate = a separate Claude instance with its own full context window
- Token usage scales linearly with teammate count
- Agent teams are worthwhile for: research, review, new feature work
- Single session is more cost-effective for: routine tasks, sequential work

---

## Limitations (Experimental)

| Limitation | Workaround |
|---|---|
| No session resumption for in-process teammates | After `/resume`, spawn new teammates |
| Task status can lag / stay stuck | Manually update status or tell lead to nudge teammate |
| Slow shutdown | Teammates finish current request before exiting |
| One team per lead session | Clean up before starting a new team |
| No nested teams | Only the lead can spawn teammates |
| Lead is fixed for team lifetime | No leadership transfer |
| Per-teammate permissions only settable post-spawn | Pre-configure lead permissions before spawning |
| Split panes: tmux or iTerm2 only | Use in-process mode in unsupported terminals |

---

## Troubleshooting

**Teammates not appearing:**
- In-process: press Shift+Down — they may be running but not visible
- Task may be too simple for Claude to decide a team is warranted
- Check `which tmux` if split-pane mode was requested

**Too many permission prompts:**
Pre-approve common operations in permission settings before spawning.

**Teammate stopped on error:**
Use Shift+Down to view output, then give direct instructions or spawn a replacement.

**Lead shuts down prematurely:**
Tell it to keep going; tell it to wait for teammates before proceeding.

**Orphaned tmux sessions:**
```bash
tmux ls
tmux kill-session -t <session-name>
```

---

## Related Features

- **Subagents** (`/en/sub-agents`): lightweight delegation within one session, no inter-agent messaging
- **Git worktrees**: manual parallel sessions without automated coordination
