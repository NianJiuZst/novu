#!/usr/bin/env bash
set -euo pipefail

# Spawns ONE Cursor Cloud Agent via API.
# Reads API key from env: CURSOR_API_KEY
# Reads branch name from env: BRANCH_NAME
#
# Requirements: curl, python3
#
# Usage:
#   spawn_cloud_agent.sh <prompt_file_or_->
#
# Examples:
#   echo "Do X..." | spawn_cloud_agent.sh -
#   spawn_cloud_agent.sh /tmp/prompt.txt

: "${CURSOR_API_KEY:?CURSOR_API_KEY is required}"
: "${BRANCH_NAME:?BRANCH_NAME is required}"

# Read prompt text
if [[ "${1:--}" == "-" ]]; then
  PROMPT_TEXT="$(cat)"
else
  PROMPT_TEXT="$(cat "$1")"
fi

if [[ -z "${PROMPT_TEXT//[[:space:]]/}" ]]; then
  echo "Error: Prompt is empty" >&2
  exit 2
fi

# Build JSON payload using Python (properly escapes everything)
payload=$(printf '%s' "$PROMPT_TEXT" | python3 -c "
import json
import sys
import os

prompt = sys.stdin.read()
data = {
    'prompt': {'text': prompt},
    'source': {
        'repository': 'https://github.com/novuhq/novu',
        'ref': 'next'
    },
    'target': {
        'branchName': os.environ['BRANCH_NAME'],
        'autoCreatePr': False,
        'openAsCursorGithubApp': True
    }
}

print(json.dumps(data))
")

# Use -u for Basic auth (official method from docs)
curl -sS \
  --request POST \
  --url https://api.cursor.com/v0/agents \
  -u "${CURSOR_API_KEY}:" \
  --header 'Content-Type: application/json' \
  --data "$payload"
