### Our base image
FROM amazonlinux:2.0.20211223.0

### Update our image
RUN yum update -y && yum clean all

### Install tar & gzip
RUN yum install -y tar gzip shadow-utils && yum clean all

### Install NVM
RUN mkdir /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 14.18.3

RUN curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Add app port
ENV CLUSTER_SAMPLE_APP_PORT 8080

#### Create dedicated user
RUN useradd -ms /bin/bash user
USER user

#### Create app directory
WORKDIR /usr/src/app

#### Install app dependencies
COPY package*.json ./

#### Install our packages
RUN npm install

#### Bundle app source
COPY . .

#### Configure container
EXPOSE 8080
HEALTHCHECK CMD curl --fail http://localhost:8080/healthcheck || exit 1
CMD [ "node", "src/app.js" ]
