# Backend for digital seniors

## Security on (AWS) instance
Besides normal http and https you also need to open port 1337 to have requests to parse come through.

## Parse
The backend is running parse server. Check it out here: [https://parseplatform.org/](https://parseplatform.org/)

## Parse dashboard
There is an instance of parse dashboard running for easier admin of data and structure

# .env
Check out `.env.example` for an example of how to configure the containers. Be aware that (at least) the parse container only cares about the env-variables on first launch. After that it will fetch it's config from the persistent volumes on subsequent spin ups. If you need to change the config of parse and/or dashboard, either:

**A:** remove the folders `docker-persistence/parse` and `docker-persistence/parse-dashboard` and make changes to `.env` before (re-)starting the containers.

or

**B:** edit the two `config.json`-files in `docker-persistence/parse` and `docker-persistence/parse-dashboard` before (re-)starting the containers.

## Docker
Everything is run with docker and docker-compose. There are 3 containers, all of them from bitnami with non-root privileges. Mongodb, parse and parse-dashboard. Check out `docker-compose.yml` for details.
`docker-compose up` starts all containers.
`docker-compose down` stops all containers.

## Data persistence
All data is stored with mongodb. The mongodb-container has a volume attached to `docker-persistence/data`. **Deleting this folder will delete the whole database.**

## Utility shell scripts
There are 2 shell scripts for making the setup process easier.
`sudo ./setup-docker.sh` installs docker, docker compose and creates a folder called docker-persistence where the containers can mount their persistent data.
`./run.sh` fetches the AWS-instance's own public domain name. Then starts the containers by calling `docker-compose up` (passing the public DNS as an env-var). You can also pass an argument through to `docker-compose up`. For example `./run.sh -d` will have the script call `docker-compose up -d` (detached)