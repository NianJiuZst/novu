#!/bin/bash

# Enterprise Submodule Sync Script
# This script updates the .source submodule to point to the "next" branch
# and commits the changes to the current branch

set -e  # Exit on any error

# Configuration
SOURCE_SUBMODULE=".source"
TARGET_BRANCH="${1:-next}"  # Allow branch to be passed as argument
COMMIT_PREFIX="chore"
AUTO_PUSH="${2:-false}"     # Allow auto-push to be controlled
PR_URL="${3:-}"             # Optional PR URL for commit message

echo "
🔄 Starting enterprise submodule sync to '$TARGET_BRANCH' branch...
"

# Verify we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository root directory"
  echo "   Please run this script from the root of the monorepo"
  exit 1
fi

# Verify submodule exists and is initialized
echo "📂 Checking $SOURCE_SUBMODULE submodule..."
if [ ! -d "$SOURCE_SUBMODULE" ]; then
  echo "❌ Error: $SOURCE_SUBMODULE submodule directory not found!"
  echo "   Please ensure:"
  echo "   1. Submodules are properly initialized (git submodule init)"
  echo "   2. Submodules are updated (git submodule update)"
  echo "   3. You're in the correct directory"
  echo ""
  exit 1
fi

# Update the submodule
echo "🔄 Updating $SOURCE_SUBMODULE submodule to '$TARGET_BRANCH' branch..."
cd "$SOURCE_SUBMODULE"

# Get current commit for reference
CURRENT_COMMIT=$(git rev-parse HEAD)

# Fetch latest changes
git fetch origin

# Check if target branch exists
if ! git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  echo "❌ Error: Branch '$TARGET_BRANCH' does not exist in the remote repository"
  echo "   Please check that the branch exists in the enterprise repository"
  echo ""
  exit 1
fi

# Switch to target branch and pull latest changes
git checkout "$TARGET_BRANCH"
git pull origin "$TARGET_BRANCH"

# Get new commit hash
NEW_COMMIT=$(git rev-parse HEAD)
echo "✅ Successfully updated to latest '$TARGET_BRANCH' branch"
echo "   Commit hash: $NEW_COMMIT"
echo ""

# Go back to main repository
cd ..

# Check if there are changes to commit
echo "🔍 Checking for changes in main repository..."
if git diff --quiet HEAD -- "$SOURCE_SUBMODULE"; then
  echo "✅ No changes detected - submodule already points to the latest '$TARGET_BRANCH' branch"
  echo "   Current commit: $NEW_COMMIT"
  echo ""
  exit 0
fi

# Stage and commit changes
echo "📝 Committing submodule changes..."
git add "$SOURCE_SUBMODULE"

# Create commit message
if [ -n "$PR_URL" ]; then
  COMMIT_MESSAGE="$COMMIT_PREFIX: sync enterprise submodule to $TARGET_BRANCH branch

Updated $SOURCE_SUBMODULE submodule to point to $TARGET_BRANCH branch
New commit: $NEW_COMMIT

Triggered by: $PR_URL"
else
  COMMIT_MESSAGE="$COMMIT_PREFIX: sync enterprise submodule to $TARGET_BRANCH branch

Updated $SOURCE_SUBMODULE submodule to point to $TARGET_BRANCH branch
Previous commit: $CURRENT_COMMIT
New commit: $NEW_COMMIT"
fi

git commit -m "$COMMIT_MESSAGE"

# Auto-push if requested (for GitHub Actions)
if [ "$AUTO_PUSH" = "true" ]; then
  CURRENT_BRANCH=$(git branch --show-current)
  git push origin "$CURRENT_BRANCH"
fi

echo "✅ Successfully updated submodule to '$TARGET_BRANCH' branch!"
echo "   Previous commit: $CURRENT_COMMIT"
echo "   New commit: $NEW_COMMIT"

if [ "$AUTO_PUSH" != "true" ]; then
  echo ""
  echo "📤 To push changes, run:"
  echo "   git push origin \$(git branch --show-current)"
fi
echo "" 
