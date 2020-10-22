#! /bin/sh

if (( $EUID != 0 )); then
    echo "Please run as root"
    echo 'This script runs a bunch of stuff as root in order to configure the environment'
    exit
fi


# Function to display commands
exe() { echo "\$ $@" ; "$@" ; }

echo 'Gunnar är bäst!'
echo "We will now create the user. It will get the uid of 1001. Be sure that this uid is available. If not, ctrl+c now and fix before moving on."
echo "You'll also need a public SSH key for the user. This is so you can log in remotely as the new user. Fix a public ssh-key before moving on with this script (ctrl+c to abort now)."
echo "You can check if the user exists by calling 'id 1001'"
echo "We want to use 1001 as uid because thats the user id we gonna run inside the docker containers :-D"
echo "That will make it more fluent to handle permissions when sharing (type bind) volumes between the docker users and the host user"
echo 'Have you read the information above? If so, what username do you want?'
read new_user

exe adduser --disabled-password --uid 1001 $new_user

# exe su - $new_user
exe mkdir /home/$new_user/.ssh
echo 'paste the public SSH key for the new user:'
read public_key

echo "$public_key" > /home/$new_user/.ssh/authorized_keys

exe chown -R $new_user /home/$new_user/.ssh

echo 'Nice. If nothing went wrong you now have a new user you can log into through ssh :-D'
echo 'Be aware that this user isnt added to sudo group so it cant run sudo commands.'
echo 'If you need the user to be able to run sudo stuff, add it manually to the sudo group with:'
echo 'usermod -aG sudo <the username>'