#!/usr/bin/env bash
set -e

git submodule update --init --recursive
git config --global submodule.recurse true

pnpm install:with-ee
pnpm build

cp apps/api/src/.env.agent apps/api/src/.env
cp apps/dashboard/.env.agent apps/dashboard/.env
cp apps/worker/src/.env.agent apps/worker/src/.env

docker compose -f docker/local/docker-compose.agent.yml up -d

pnpm seed:agent
