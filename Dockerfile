FROM node:latest

WORKDIR /usr/src/people-sync-api

COPY . .

RUN npm install
