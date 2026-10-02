#!/usr/bin/env bash
# Records a run milestone in <repo>/.run/events.log. Works from the main checkout or any worktree.
# Usage: .claude/hooks/mark.sh "PHASE 1 START"
set -eu

[ $# -ge 1 ] || { echo "usage: mark.sh <message>" >&2; exit 1; }
common_dir=$(git rev-parse --path-format=absolute --git-common-dir)
run_dir="$(dirname "$common_dir")/.run"
mkdir -p "$run_dir"
printf '%s\tMARK\tlead\t-\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$run_dir/events.log"
echo "marked: $*"
