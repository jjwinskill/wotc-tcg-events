#!/bin/sh
set -e
/app/node_modules/.bin/prisma migrate deploy
npm run db:seed
exec node --import tsx src/server.ts
