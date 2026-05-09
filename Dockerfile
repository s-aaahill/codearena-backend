FROM node:22-alpine

RUN apk add --no-cache python3 g++ build-base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 5000

CMD ["npm", "start"]