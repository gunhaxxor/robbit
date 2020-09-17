#! /bin/sh

if (( $EUID != 0 )); then
    echo "Please run as root"
    echo 'This script runs a bunch of stuff as root in order to configure the environment'
    exit
fi

# Function to display commands
exe() { echo "\$ $@" ; "$@" ; }

echo 'Gunnar är bäst!'

echo "What's the name of the user that will use docker?"
read docker_user

# set -x
echo 'Updating package register'
exe apt update -y
echo 'Install a few prerequisite packages which let apt use packages over HTTPS'
exe apt install apt-transport-https ca-certificates curl software-properties-common

echo 'Then add the GPG key for the official Docker repository to your system'
exe curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

echo 'Add the Docker repository to APT sources'
exe add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"

echo 'Next, update the package database with the Docker packages from the newly added repo'
exe apt update -y

echo 'Make sure you are about to install from the Docker repo instead of the default Ubuntu repo'
exe apt-cache policy docker-ce

echo 'Install docker'
exe apt install docker-ce

# echo 'Check that docker is now running'
# exe systemctl status docker


echo 'adding current user to the docker user group'
exe usermod -a -G docker ${docker_user}

echo 'Installing docker compose'
exe curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
echo 'Giving docker compose permission to execute'
exe chmod +x /usr/local/bin/docker-compose

echo 'creating a directory for mounting docker persistent volumes and give ownership to container user (UID 1001)'
exe mkdir /home/${docker_user}/docker-persistence
exe chown 1001 /home/${docker_user}/docker-persistence/

echo '-------------------------------'
echo '    '
echo 'NOW LOG OUT THE USER AND LOG IN AGAIN. OTHERWISE THE USER MIGHT NOT BE CONSIDERED PART OF THE DOCKER USER GROUP'