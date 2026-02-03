#!/bin/bash
# Test script to verify CURSOR_API_KEY secret injection
# This tests whether the secret configured in Cursor Dashboard is accessible

echo "=== Testing CURSOR_API_KEY Secret Access ==="
echo ""
echo "Repository: novuhq/novu (public repository)"
echo "Branch: cursor/cursor-api-key-access-87cc"
echo "Date: $(date)"
echo ""

# Check if CURSOR_API_KEY is set
if [ -z "$CURSOR_API_KEY" ]; then
    echo "❌ FAILED: CURSOR_API_KEY is NOT set"
    echo ""
    echo "Details:"
    echo "- Secret is configured in Cursor Dashboard"
    echo "- Secret is set to 'allowed to all repositories'"
    echo "- Secret type: redacted"
    echo "- Repository type: public"
    echo ""
    echo "Environment variables containing 'CURSOR':"
    printenv | grep -i CURSOR || echo "  (none found except CURSOR_AGENT)"
    echo ""
    exit 1
else
    echo "✅ SUCCESS: CURSOR_API_KEY is accessible"
    echo "Value length: ${#CURSOR_API_KEY} characters"
    echo "First 10 characters: ${CURSOR_API_KEY:0:10}..."
    exit 0
fi
