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
* You'll also want the following keys in your `.env` file:
  * `CHANNEL_ID` - this is the ID of the Discord channel you want the bot to spawn events in
  * `THRESHOLD` - the % rate at which you want the bot to spawn an event, e.g. 15, 50, 100, etc.
  * `TIME_LIMIT` - the time in seconds before the bot closes off reaction window before it starts the mining process
* You can either start the bot with `node src/main` or `npm run dev`, the latter of which uses [`nodemon`](https://www.npmjs.com/package/nodemon), which restarts the bot with each file save