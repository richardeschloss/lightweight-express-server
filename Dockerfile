FROM node:10.15.3-alpine

ENV MYAPPDIR /usr/src/app
WORKDIR $MYAPPDIR

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package.json $MYAPPDIR/
RUN npm install
RUN apk add --no-cache bash openssl

COPY . $MYAPPDIR
