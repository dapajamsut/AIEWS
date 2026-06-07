FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy sisa file Next.js
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Expose port frontend
EXPOSE 3000

# Start frontend
CMD ["npm", "start"]
