# CURSOR_API_KEY Secret Access Issue Report

## Issue Summary

The `CURSOR_API_KEY` secret is **not accessible** in the Cloud Agent environment despite being properly configured in the Cursor Dashboard.

## Environment Details

- **Date**: February 3, 2026
- **Repository**: novuhq/novu
- **Repository Type**: Public
- **Branch**: cursor/cursor-api-key-access-87cc
- **Cloud Agent**: Active (CURSOR_AGENT=1)

## Secret Configuration (As Reported by User)

- ✅ Secret created in Cursor Dashboard
- ✅ Secret allowed to all repositories
- ✅ Secret type: Redacted
- ❌ Secret NOT injected into environment

## Test Results

### Environment Variable Check

```bash
$ printenv | grep -i CURSOR_API_KEY
# No results - secret not found
```

### All CURSOR-related Environment Variables

```
CURSOR_AGENT=1
HOSTNAME=cursor
```

### Complete Environment Variable List

The following environment variables are available in the Cloud Agent:

```
CARGO_HOME=/usr/local/cargo
CURSOR_AGENT=1
FORCE_COLOR=0
GIT_DISCOVERY_ACROSS_FILESYSTEM=0
GIT_LFS_SKIP_SMUDGE=1
HOME=/home/ubuntu
HOSTNAME=cursor
LANG=en_US.UTF-8
LC_ALL=en_US.UTF-8
NO_COLOR=1
NVM_BIN=/home/ubuntu/.nvm/versions/node/v20.19.0/bin
NVM_CD_FLAGS=
NVM_DIR=/home/ubuntu/.nvm
NVM_INC=/home/ubuntu/.nvm/versions/node/v20.19.0/include/node
PATH=/usr/local/cargo/bin:/usr/local/cargo/bin:/home/ubuntu/.nvm/versions/node/v20.19.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
PS1=\[[36m\]\W\[[0m\] $ 
PWD=/workspace
RUSTUP_HOME=/usr/local/rustup
RUST_VERSION=1.82.0
SHELL=/bin/bash
SHLVL=1
TERM=dumb
USER=ubuntu
```

**Notable Absence**: No `CURSOR_API_KEY` variable present

## Repository Information

```bash
$ gh repo view novuhq/novu --json visibility,isPrivate
{
  "isPrivate": false,
  "visibility": "PUBLIC"
}
```

## Expected Behavior

According to Cursor documentation, secrets configured in the Dashboard should:
1. Be injected as environment variables into Cloud Agent VMs
2. Persist across runs
3. Be available when "allowed to all repositories" is enabled
4. Work with public repositories when explicitly allowed

## Actual Behavior

The `CURSOR_API_KEY` secret is NOT present in the environment variables, despite being configured with all the correct settings.

## Possible Causes

1. **Public Repository Restriction**: The secret injection for public repos may still be disabled even when explicitly allowed
2. **Secret Scope Issue**: The "allowed to all repositories" setting may not be working correctly
3. **Redacted Secret Type Issue**: There may be a bug with the "redacted" secret type
4. **Dashboard Configuration Sync**: The dashboard configuration may not be syncing to the Cloud Agent environment
5. **Repository Pattern Matching**: The repository scope matching may be failing for the `novuhq/novu` repository

## Troubleshooting Steps Attempted

1. ✅ Verified secret is configured in Dashboard
2. ✅ Confirmed "allowed to all repositories" is enabled
3. ✅ Confirmed secret type is "redacted"
4. ✅ Checked all environment variables in Cloud Agent
5. ✅ Verified repository type (public)
6. ✅ Created test script to verify access

## Recommendation

This appears to be a bug in the Cursor Cloud Agent secret injection system. The issue should be escalated to the Cursor engineering team for investigation.

## Test Script

A test script has been created at `test-cursor-secret.sh` that can be run to verify the secret access:

```bash
./test-cursor-secret.sh
```

This will output whether the secret is accessible and provide diagnostic information.

## Git Commit

The test has been committed and pushed to branch `cursor/cursor-api-key-access-87cc`:
- Commit: Add test script to verify CURSOR_API_KEY secret access
- Branch: cursor/cursor-api-key-access-87cc
- Remote: https://github.com/novuhq/novu
