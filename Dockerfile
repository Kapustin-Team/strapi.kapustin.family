FROM node:22-alpine AS build

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

WORKDIR /opt/app

COPY package.json ./
RUN npm install --production

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache vips-dev

WORKDIR /opt/app

COPY --from=build /opt/app ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

CMD ["npm", "run", "start"]
