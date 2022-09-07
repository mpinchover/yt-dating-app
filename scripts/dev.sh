#!/bin/sh
RUNTIME_ENV="DEVELOPMENT" 
echo "Starting server with runtime env: " $RUNTIME_ENV
npm run build -- --watch | firebase emulators:start --only functions