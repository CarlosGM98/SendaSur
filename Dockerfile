# Use a lightweight Node.js image (Alpine is much smaller)
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first to leverage Docker layer caching
# This speeds up future builds if your code changes but dependencies don't
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of your application code
COPY . .

# Expose the port your Express app listens on (default is often 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
