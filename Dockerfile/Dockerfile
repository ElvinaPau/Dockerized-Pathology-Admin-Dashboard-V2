# Original repository: https://github.com/ElvinaPau/Pathology-Admin-Dashboard-V2
# Dockerized repository: https://github.com/ElvinaPau/Dockerized-Pathology-Admin-Dashboard-V2

# Use Node.js 18 as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy backend package.json and package-lock.json
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/ .

# Expose the backend port
EXPOSE 5001

# Start the backend
CMD ["npm", "start"]
