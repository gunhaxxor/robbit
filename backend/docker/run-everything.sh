#! /bin/sh



file="./.env"
if [ ! -f "$file" ]
then
    echo "the file .env file not found. Please provide one so we can have nice configured behaviour. Have a look at example.env for reference"
    exit
fi

# file="./turnserver.conf"
# if [ ! -f "$file" ]
# then
#     echo "the file turnserver.conf not found. Please provide one so we can setup COTURN correctly. Have a look at example.turnserver.conf for reference"
#     exit
# fi

echo 'BE AWARE! Gunnar är bäst!'

# Specific to AWS to get the public hostname of this vm instance.
# export PARSE_HOST=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)

# More genreal approach
# export PARSE_HOST="$(curl -4 https://icanhazip.com 2>/dev/null)"
# echo "This project runs on public domain: ${PARSE_HOST}"
# echo "That domain name will be injected as env variable \$PARSE_HOST to docker-compose"

echo 'starting docker service'
sudo service docker start

docker-compose up --build $1