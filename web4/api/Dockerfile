FROM node:20-alpine as builder

ARG HOST_IP
ARG DATABASE_URL
ENV HOST_IP=${HOST_IP}
ENV DATABASE_URL=${DATABASE_URL}
#ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate  

RUN npm run build


FROM builder as runner

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

EXPOSE 3000

CMD [ "node", "dist/main"]