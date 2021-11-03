FROM node
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
# CMD [ "npm", "start"]
ENV DEV=bajskorv
RUN chmod +x entrypoint.sh
RUN chmod +x entrypoint.dev.sh
ENTRYPOINT [ "./entrypoint.sh" ]