FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# copy EVERYTHING
COPY . .
EXPOSE 8080
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]