# SBAChain Discord Bot

## Overview
This bot is a personal project started by Ponti for educational purposes. Underneath the hood is a basic Discord bot using [discord.js](https://discord.js.org/#/) that can spawn messages that users can react to. Each unique reaction per user will fork a "miner" to compete a hash computation race. The first to react and the first to complete will be rewarded and their coins added to the blockchain.

## Pre-requisites
* npm 8.x+
* node 16.x+

## Usage
* Checkout the repo and run `npm install` to get all the dependencies as denoted by [`package-lock.json`](https://github.com/vincenthai/streamboyadvanced/blob/master/package-lock.json)
* Setup your own Discord bot, generate its token, and put it in a file called `.env` in the top-level dir with the key `DISCORD_TOKEN`
  * this stores your bot's token in an environment variable as opposed to directly in the code
* You can either start the bot with `node src/main` or `npm run dev`, the latter of which uses [`nodemon`](https://www.npmjs.com/package/nodemon), which restarts the bot with each file save