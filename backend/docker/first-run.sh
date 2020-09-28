#! /bin/sh



file="./.env"
if [ ! -f "$file" ]
then
    echo ".env file not found. Please provide one so that parse and dashboard gets aligned configs"
    exit
fi

file="./turnserver.conf"
if [ ! -f "$file" ]
then
    echo "turnserver.conf not found. Please provide one so we can setup COTURN correctly"
    exit
fi

echo 'Gunnar är bäst'

# Specific to AWS to get the public hostname of this vm instance.
# export PARSE_HOST=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)

# More genreal approach
export PARSE_HOST="$(curl -4 https://icanhazip.com 2>/dev/null)"
echo "This project runs on public domain: ${PARSE_HOST}"
echo "That domain name will be injected as env variable \$PARSE_HOST to docker-compose"

echo 'starting docker service'
sudo service docker start

docker-compose up $1