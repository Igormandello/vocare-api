[![Build Status](https://travis-ci.org/Igormandello/vocare-api.svg?branch=master)](https://travis-ci.org/Igormandello/vocare-api) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# Vocare API

RESTful API used in Vocare

---
## Requirements

For development, you will need Node.js, Yarn, and Docker installed on your environment.

### Node
  - #### Node installation on Windows

    Just go on [official Node.js website](https://nodejs.org/) and download the installer.
    Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

  - #### Node installation on Ubuntu

    You can install nodejs and npm easily with apt install, just run the following commands.

        $ sudo apt install nodejs
        $ sudo apt install npm

  - #### Other Operating Systems
    You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

  If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

  If you need to update `npm`, you can make it using `npm`! Cool, right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###
### Yarn
  After installing node, this project will need yarn too, so just run the following command.

    $ npm install -g yarn

  To check if the installation was successful, you can try to run the following command:

    $ yarn --version
    1.7.0

###
### Docker
  The Docker installation tutorials can be found in the [official Docker website](https://www.docker.com/)

  - [Docker installation on Windows 10](https://store.docker.com/editions/community/docker-ce-desktop-windows)

  - [Docker installation on any other Windows version](https://docs.docker.com/toolbox/overview/)

  - [Docker installation on Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-repository)


---

## Install

    $ git clone https://github.com/Igormandello/vocare-api
    $ cd vocare-api
    $ yarn install

## Configure app

  Create a `.env` file inside the root

    $ touch .env

  Open the created file then edit it with your settings. You will need:

  - `CONTAINER_PASSWORD` (Only used for testing);
  - `DB_USER`;
  - `DB_PASSWORD`;
  - `DB_HOST`;
  - `DB`;

## Running the project

    $ yarn start

## Testing the project

    $ sudo yarn test