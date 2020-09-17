#! /bin/sh

if (( $EUID != 0 )); then
    echo "Please run as root"
    echo 'This script runs a bunch of stuff as root in order to configure the environment'
    exit
fi

# Function to display commands
exe() { echo "\$ $@" ; "$@" ; }

echo 'Gunnar är bäst!'
# set -x
echo 'updating package register'
exe yum update -y
echo 'installing docker'
exe yum install docker -y
echo 'adding ec2-user to the docker user group'
exe usermod -a -G docker ec2-user
echo 'Installing docker compose'
exe curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
echo 'Giving docker compose permission to execute'
exe chmod +x /usr/local/bin/docker-compose

echo 'creating a directory for mounting docker persistent volumes and give ownership to container user (UID 1001)'
exe mkdir docker-persistence
exe chown 1001 ./docker-persistence/

echo '-------------------------------'
echo '    '
echo 'NOW LOG OUT THE USER AND LOG IN AGAIN. OTHERWISE THE USER WILL NOT BE CONSIDERED PART OF THE DOCKER USER GROUP'