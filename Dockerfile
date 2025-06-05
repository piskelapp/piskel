# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g grunt-cli
COPY . .
RUN grunt build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dest/prod ./dest/prod
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
EXPOSE 9001
CMD ["npx", "http-server", "dest/prod", "-p", "9001"]
