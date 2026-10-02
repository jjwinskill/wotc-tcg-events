#!/usr/bin/env bash
# Appends one tab-separated line per hook event to <repo>/.run/events.log:
#   time  event  agent_type  agent_id  detail
# Registered for lifecycle, notification and Bash tool events in .claude/settings.json.
# Never blocks: always exits 0.
set -u

input=$(cat)
run_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}/.run"
mkdir -p "$run_dir"

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
line=$(printf '%s' "$input" | jq -r --arg ts "$ts" '
  def clip(n): tostring | gsub("[\t\n\r]+"; " ") | .[0:n];
  (.tool_input.command // "") as $cmd
  | (if .hook_event_name == "PreToolUse"
        and ($cmd | test("<<") | not)
        and ($cmd | test("(^|[;&|] *)npm (i|install|add)( +-[^ ]+)* +[@a-zA-Z]"))
     then "DEP_ADD" else .hook_event_name end) as $event
  | [ $ts, $event, (.agent_type // "lead"), (.agent_id // "-"),
      ( if .hook_event_name == "PreToolUse" or .hook_event_name == "PostToolUseFailure"
          then ((.tool_name // "") + ": " + ($cmd | clip(200)))
        elif .hook_event_name == "Notification"
          then ((.notification_type // "") + ": " + ((.message // "") | clip(200)))
        elif .hook_event_name == "Stop" or .hook_event_name == "SubagentStop"
          then ((.last_assistant_message // "") | clip(300))
        elif .hook_event_name == "UserPromptSubmit"
          then ((.prompt // "") | clip(200))
        elif .hook_event_name == "SessionStart"
          then ("source=" + (.source // "") + " model=" + (.model // "") + " cwd=" + (.cwd // ""))
        else "" end )
    ] | @tsv' 2>/dev/null)

[ -n "$line" ] || line=$(printf '%s\tPARSE_ERROR\t-\t-\t%s' "$ts" "$(printf '%s' "$input" | tr '\t\n\r' '   ' | cut -c1-200)")
printf '%s\n' "$line" >> "$run_dir/events.log"
exit 0
