FROM node:alpine
ENV NODE_ENV=production

VOLUME /config
WORKDIR /app

COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 8443
CMD ["npm", "start", "--", "--config=/config/config.yml"]
