#!/bin/bash
set -e

if [ ! -d ".git" ]; then git init; fi

git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/sangsaist/SentinelBank.git

git checkout -b dev 2>/dev/null || git checkout dev

git add .
git commit -m "feat: monorepo restructure — backend modular architecture (api/core/db/schemas/websocket) with tests"

git push -u origin dev

echo ""
echo "✅ Pushed to https://github.com/sangsaist/SentinelBank.git → branch: dev"
echo "🔗 https://github.com/sangsaist/SentinelBank/tree/dev"
