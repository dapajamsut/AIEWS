FROM node:20-alpine

WORKDIR /app

# copy dependency dulu (biar cache optimal)
COPY package*.json ./

RUN npm install

# copy semua file
COPY . .

# build production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
