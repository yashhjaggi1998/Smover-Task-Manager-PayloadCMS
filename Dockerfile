FROM node:18.8-alpine as builder

WORKDIR /home/node/app
COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build

FROM node:18.8-alpine as runtime

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js
ENV PAYLOAD_SECRET=1d2aa346ded4a17b59ec48ed
ENV DATABASE_URL=postgres://postgres:i@my2jYJ@34.55.67.68:5432/smover_task_manager
ENV PORT=8080

WORKDIR /home/node/app
COPY package*.json  ./

RUN yarn install --production

COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/build ./build

CMD ["node", "dist/server.js"]
