# Think of the Docker env. as a mini computer running Ubuntu 
# We can create separate containers within that machine (separate fs's)
# This is a blueprint for that mini-fs
# We can run some UNIX functions in Docker, e.g. docker cp {process-name}/path /dest/path for copy
# We can run a docker process on the image using docker run {...args}
# We can stop a docker process using docker stop {process-name}
# This seems to only pause the process, to fully kill it run docker rm {proces-name} after
# To remove the fs we were running with (we can list them using docker images), run docker image rm {image}
# [GO MORE IN DEPTH WITH DOCKER, REPEAT THESE CONTAINERIZATION STEPS A FEW TIMES!]

# Define a runtime
FROM node:18

# Set working directory within container
WORKDIR /app

# Copy all package definition related files
COPY package*.json ./

# Install ffmpeg within the container
RUN apt-get update && apt-get install -y ffmpeg

# Install any packages depended on (as stated in package.json)
RUN npm install

# Copy app source to docker image
COPY . .

# Make port 3000 available outside docker container
EXPOSE 3000

# Define command to run app, CMD is allowed once (NEED MORE INFO)
CMD [ "npm", "start" ]

# Note: For Docker to work, it runs a daemon
# But for that daemon and the docker env. to run we need a GUI app
# Colima solves that problem; colima start --runtime docker launches the docker env.!
# colima start --runtime docker -> Starts docker env.
# colima stop -> Stops it :)
