FROM node:8.2-alpine

# Run tasks as unpriviledged user
USER node

# Change to $HOME as defined in node:8.2-alpine image
WORKDIR /home/node

# Install app dependencies
RUN npm install chromeless

ENTRYPOINT ["node"]
CMD ["-h"]
