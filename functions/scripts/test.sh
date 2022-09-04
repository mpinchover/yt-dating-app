#!/bin/sh
RUNTIME_ENV="TEST" 
HOST="localhost"

echo "Starting server with runtime env: " $RUNTIME_ENV
# docker volume prune -f

CONTAINER_ID=$(docker ps -aq -f status=exited -f name=mysql-unit-test)
if [ $CONTAINER_ID ]; then
    echo "starting tests"
    docker container start $CONTAINER_ID
elif [ ! $(docker ps -q -f name=mysql-unit-test) ]; then
    echo "new docker container"
    docker run -d --name mysql-unit-test -p 3308:3306 -e MYSQL_ROOT_PASSWORD=test  mysql:8.0.0
    sleep 15
fi
# docker rm mysql-unit-test -f
# wait
# docker run -d --name mysql-unit-test -p 3308:3306 -e MYSQL_ROOT_PASSWORD=test  mysql:8.0.0
# sleep 10

mysql -uroot -ptest -h 127.0.0.1 -P 3308 --ssl-mode=DISABLED < ../database/setup-unit-test.sql
mysql -uroot -ptest -h 127.0.0.1 -P 3308 --ssl-mode=DISABLED --database=test < ../database/schema.sql 
npm run test



# https://github.com/mysqljs/mysql#transactions 