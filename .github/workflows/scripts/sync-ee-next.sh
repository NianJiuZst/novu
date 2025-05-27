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
🔄 Starting Enterprise Submodule Sync to '$TARGET_BRANCH' branch...
"

# Step 1: Verify we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository root directory"
  echo "   Please run this script from the root of the monorepo"
  exit 1
fi

# Step 2: Verify submodule exists
if [ ! -d "$SOURCE_SUBMODULE" ]; then
  echo "❌ Error: $SOURCE_SUBMODULE submodule directory not found!"
  echo "   Please ensure submodules are initialized:"
  echo "   git submodule init && git submodule update"
  exit 1
fi

# Step 3: Check if submodule is a valid git repository
if [ ! -d "$SOURCE_SUBMODULE/.git" ]; then
  echo "❌ Error: $SOURCE_SUBMODULE is not a valid git repository"
  echo "   Please ensure submodules are properly initialized"
  exit 1
fi

# Step 4: Update the submodule
echo "📂 Updating $SOURCE_SUBMODULE submodule..."
cd "$SOURCE_SUBMODULE"

# Get current branch and commit for reference
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "   Current state:"
echo "   - Branch: $CURRENT_BRANCH"
echo "   - Commit: $CURRENT_COMMIT"
echo ""

# Fetch latest changes
echo "📡 Fetching latest changes from remote..."
git fetch origin

# Check if target branch exists
if ! git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  echo "❌ Error: Branch '$TARGET_BRANCH' does not exist in the remote repository"
  echo "   Available branches:"
  git branch -r | grep -v HEAD | sed 's/origin\///' | sed 's/^/   - /'
  exit 1
fi

# Switch to target branch
echo "🔀 Switching to '$TARGET_BRANCH' branch..."
git checkout "$TARGET_BRANCH"

# Pull latest changes
echo "⬇️  Pulling latest changes from '$TARGET_BRANCH'..."
git pull origin "$TARGET_BRANCH"

# Get new commit hash
NEW_COMMIT=$(git rev-parse HEAD)
echo "   New commit: $NEW_COMMIT"

# Go back to main repository
cd ..

# Step 5: Check if there are changes to commit
echo ""
echo "🔍 Checking for changes..."
if git diff --quiet HEAD -- "$SOURCE_SUBMODULE"; then
  echo "✅ No changes detected - submodule already points to the latest '$TARGET_BRANCH' branch"
  echo "   Current commit: $NEW_COMMIT"
  exit 0
fi

# Step 6: Stage and commit changes
echo "📝 Staging submodule changes..."
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

echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Auto-push if requested (for GitHub Actions)
if [ "$AUTO_PUSH" = "true" ]; then
  CURRENT_BRANCH=$(git branch --show-current)
  echo "📤 Pushing changes to origin/$CURRENT_BRANCH..."
  git push origin "$CURRENT_BRANCH"
  echo "✅ Successfully pushed changes!"
fi

echo ""
echo "✅ Successfully updated submodule to '$TARGET_BRANCH' branch!"
echo "   Previous commit: $CURRENT_COMMIT"
echo "   New commit: $NEW_COMMIT"

if [ "$AUTO_PUSH" != "true" ]; then
  echo ""
  echo "📤 To push changes, run:"
  echo "   git push origin \$(git branch --show-current)"
fi
echo "" 
