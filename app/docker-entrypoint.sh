#!/bin/bash

echo "entrypoint for web container. Aaaaw yeah!!!"
# ugly hack to let ionic acces the environment
echo "These env vars will be copied to .env.dev to be used when building ionic app:"
printenv
printenv > .env.dev

npm run build browser

node server.js