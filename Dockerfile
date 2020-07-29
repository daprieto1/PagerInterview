FROM node:10.15-alpine

WORKDIR /usr/src/app

COPY package.json .

RUN npm install --quiet

COPY . .

EXPOSE 3000

CMD npm start
