#! /bin/sh



file="./.env"
if [ ! -f "$file" ]
then
    echo ".env file not found not found. Please provide one so that parse and dashboard gets aligned configs"
    exit
fi

echo 'Gunnar är bäst'

export PARSE_HOST=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)
echo "This project runs on public domain: ${PARSE_HOST}"
echo "That domain name will be injected as env variable \$PARSE_HOST to docker-compose"

echo 'starting docker service'
sudo service docker start

docker-compose up $1