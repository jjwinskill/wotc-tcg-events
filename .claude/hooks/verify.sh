#!/usr/bin/env bash
# Verify gate for builder agents. Runs `npm run verify` in the agent's working directory
# (its worktree) and blocks while it fails. Wired two ways:
#   - PreToolUse on the hand-back tool (settings.json): blocks the report from reaching the lead.
#   - Stop in builder frontmatter (runs as SubagentStop): backstop.
# After MAX_BLOCKS failed attempts it lets the agent through, so an unfixable failure can't
# trap it; the agent must then report the failure.
set -u

MAX_BLOCKS=3
GATED_AGENTS=" backend-engineer frontend-engineer infra-engineer "

input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // ""')
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')
agent=$(printf '%s' "$input" | jq -r '.agent_type // "lead"')
agent_id=$(printf '%s' "$input" | jq -r '.agent_id // "lead"')
[ -n "$cwd" ] || cwd=$(pwd)

run_dir="${CLAUDE_PROJECT_DIR:-$cwd}/.run"
mkdir -p "$run_dir"
log() {
  printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$agent" "$agent_id" "$2" >> "$run_dir/events.log"
}

case "$GATED_AGENTS" in *" $agent "*) ;; *) exit 0 ;; esac
cd "$cwd" 2>/dev/null || exit 0

# Nothing to verify until the scaffold defines a verify script.
node -e 'process.exit(require("./package.json").scripts?.verify ? 0 : 1)' 2>/dev/null || exit 0

out=$(npm run verify 2>&1)
if [ $? -eq 0 ]; then
  log VERIFY_PASS "$event $cwd"
  exit 0
fi

count_file="$run_dir/verify-blocks-$agent_id"
count=$(cat "$count_file" 2>/dev/null || echo 0)
if [ "$count" -ge "$MAX_BLOCKS" ]; then
  log VERIFY_FAIL_RELEASED "$event released after $count blocks"
  exit 0
fi
count=$((count + 1))
echo "$count" > "$count_file"
log VERIFY_FAIL "$event block $count/$MAX_BLOCKS"

reason=$(printf 'npm run verify failed (block %s of %s). Fix the failure before handing back. If it cannot be fixed within your scope, state that explicitly under "Not done / risks" in your report.\n\nLast 60 lines of output:\n%s' \
  "$count" "$MAX_BLOCKS" "$(printf '%s' "$out" | tail -n 60)")

if [ "$event" = "PreToolUse" ]; then
  jq -n --arg r "$reason" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $r}}'
else
  jq -n --arg r "$reason" '{decision: "block", reason: $r}'
fi
exit 0
