#!/bin/bash
set -e
cd /opt/adinfinity-backend
echo "[deploy] pulling latest..."
git fetch origin main && git reset --hard origin/main
echo "[deploy] installing deps..."
pnpm install --frozen-lockfile
npx prisma generate
echo "[deploy] building..."
rm -f tsconfig.build.tsbuildinfo
pnpm run build
echo "[deploy] reloading (zero downtime)..."
if pm2 show adinfinity-backend > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
echo "[deploy] removing errored instances..."
pm2 jlist | python3 -c "
import sys,json,subprocess
for p in json.load(sys.stdin):
  if p['name']=='adinfinity-backend' and p['pm2_env']['status'] in ('errored','stopped'):
    print('deleting',p['pm_id'])
    subprocess.run(['pm2','delete',str(p['pm_id'])])
"
pm2 save
echo "[deploy] done."
pm2 list | grep adinfinity
