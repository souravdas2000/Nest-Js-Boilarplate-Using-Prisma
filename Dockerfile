# Step 1: Use Node.js as the base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Install PM2 globally
RUN npm install pm2 -g

# Step 6: Copy the rest of the application files
COPY . .

# Step 7: Build the NestJS app
RUN npm run build

# Step 8: Expose the port the app will run on
EXPOSE 4000

# Step 9: Use PM2 to run the application in production mode
CMD ["pm2-runtime", "start", "dist/main.js", "--name", "nest-template-api", "--env", "production"]
