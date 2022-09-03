#!/bin/sh
RUNTIME_ENV="TEST" 
HOST="localhost"

echo "Starting server with runtime env: " $RUNTIME_ENV
docker volume prune -f
docker rm mongo-unit-test -f 
wait
# open up a new mongo db thing here
docker run -d --name mongo-unit-test -p 27020:27017 -e MONGODB_INITDB_ROOT_USERNAME=root -e MONGODB_INITDB_ROOT_PASSWORD=test mongo:4.0.4
wait
npm run test
# npm run test
wait
# docker rm mongo-unit-test -f