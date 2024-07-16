# Use an official Node.js runtime as a parent image
FROM node:19-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Expose the port on which the application runs
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
