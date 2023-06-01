# build
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build


# prod stage
FROM node:18-alpine

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build /app/dist ./dist

COPY package.json yarn.lock prisma ./

RUN yarn install --frozen-lockfile --production
RUN yarn prisma generate

RUN rm package.json yarn.lock

EXPOSE 5000

CMD ["node", "dist/main.js"]
