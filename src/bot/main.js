/* eslint-disable max-nested-callbacks */
require('dotenv').config();

// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require('discord.js');
const BlockChain = require('../coin/blockchain');
const Work = require('../coin/work');
const propsReader = require('properties-reader');
const props = propsReader('./resources/coin.properties');
const async = require('async');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('ready!');
});

let eventOnline = false;
let mineOnline = false;
let eventMsgId = '';
let winningUser = '';

const chain = new BlockChain();
chain.reassemble();
const usersReacted = new Map();

// sba
const channelId = '404574680264081408';
const threshold = 25;
const timelimit = 60000;

// mine
// const channelId = '938179231458951231';
// const threshold = 100;
// const timelimit = 10000;

client.login(process.env.DISCORD_TOKEN);

/**
 * 'message' event listener
 */
client.on('messageCreate', (msg) => {

	// limit the activity of the bot to just a single channel for now
	if (msg.channelId !== channelId) return;

	// if a mine has begun, we're going to pause bot commands
	if (msg.author.bot || mineOnline) return;

	// register bot msg event id and keep listening
	if (msg.author.bot && eventOnline) {
		eventMsgId = msg.id;
		return;
	}

	// if an event is not happening, and we've encountered a sweep, sweep all bot msgs
	if (msg.content === '$sweep' && !eventOnline) {
		msg.channel.messages.fetch({ limit:50 }).then(msgs => {
			msgs.filter(m => m.author.bot).forEach(m => m.delete());
			msg.delete();
		});
	}
	// if a trade has been initiated, handle the work/transaction and keep listening
	else if (msg.content.match(/\$trade\s.*/)) {
		console.log('trade initiated. to be implemented at a later state');
	}
	else if (msg.content === '$dump') {
		console.log(JSON.stringify(chain, null, 2));
	}
	else if (msg.content.match(/^\$balance.*/)) {
		const balance = chain.getBalance(msg.author.id);
		const channel = msg.channel;
		const balanceEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${msg.author.tag}, your balance is: ${balance} coins!`)
			.setImage('https://images.squarespace-cdn.com/content/v1/5e2372d18e3cf11ebaf2d20d/1586455217566-259FY1S9S4XVAVDP3WI7/5a105381eed609b127ec423c337f64e3.gif')
			.setTimestamp();

		msg.delete();
		channel.send({ embeds:[balanceEmbed] });
	}
	// on any other message, have a 'random' chance to send an event
	// we also will only ever react to messages with no embeds in it. cause im lazy
	// currently pegged at 75% occurrence rate
	else if (msg.embeds.length == 0) {
		const random = Math.floor(Math.random() * 100);
		if (random <= threshold && !eventOnline) {
			console.log('event online!');
			eventOnline = true;
			// construct the embed
			const eventEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`SBA Mining Event! (beta ${threshold}% spawn rate)`)
				.setDescription('You have 60 seconds to react to this message!')
				.setImage('https://images.gamebanana.com/img/ico/sprays/megamanx2.gif')
				.setTimestamp();

			// send the embed and timeout after 60seconds
			msg.channel.send({ embeds:[eventEmbed] }).then((m) => {
				eventMsgId = m.id;
				// this is the core reset when the event ends. here we will toggle the event offline, reset queued members, and kick off the mining procedure
				setTimeout(() => {
					eventOnline = false;
					eventMsgId = m.id;
					// edit the embed and resend
					const embedEdit = m.embeds[0];
					embedEdit.setTitle('SBA Mining Event is Over!');
					embedEdit.setDescription('60 seconds are up! We\'re gonna start mining now!');
					embedEdit.setImage('https://thumbs.gfycat.com/ThunderousIdealBorzoi-size_restricted.gif');
					m.edit({ embeds:[embedEdit] });

					console.log(`timeout reached\n -eventOnline: ${eventOnline}`);
					console.log(` -eventMsgId: ${eventMsgId}`);
				}, timelimit);
			});
		}
	}
},
);

// on reaction to the event message, log the users!
client.on('messageReactionAdd', (msgReaction, user) => {
	if (msgReaction.message.id !== eventMsgId || !eventOnline) {
		return;
	}

	console.log(`${user.tag} has reacted with ${msgReaction.emoji.name}`);
	let reactions = new Set();
	// if this user has reacted before...
	if (usersReacted.has(user)) {
		reactions = usersReacted.get(user);
		// add their reaction emoji if they haven't already reacted with that
		if (!reactions.has(msgReaction.emoji.name)) {
			reactions.add(msgReaction.emoji.name);
		}
	}
	// otherwise, since this is a new user reacting, we'll add their reaction set here
	else {
		reactions.add(msgReaction.emoji.name);
		usersReacted.set(user, reactions);
	}

	// compound all the embed fields here
	const embedFields = [];
	usersReacted.forEach((r, u) => {
		const embedField = {
			'name': `${u.tag}`,
			'value': `${r.size} reacts`,
		};
		embedFields.push(embedField);
	});

	// edit the embed and resend it
	const embed = msgReaction.message.embeds[0];
	embed.setFields(embedFields);
	embed.setImage('https://images.gamebanana.com/img/ico/sprays/megamanx2.gif');
	msgReaction.message.edit({ embeds:[embed] });

	// for the 1st user, make a new work transaction to reward them
	if (usersReacted.size === 1) {
		chain.addWork(new Work('god', user.id, 20));
		winningUser = user;
	}
});

// we'll use the messageUpdate event as a trigger for when we start the mining procedure
// if the event is online still (meaning the message updated whenever someone reacted), we'll just ignore it
// otherwise, if the event is over, we'll consider it time to mine
client.on('messageUpdate', (oldMsg, newMsg) => {
	// limit the activity of the bot to just a single channel for now
	if (newMsg.channelId !== channelId || !newMsg.author.bot || mineOnline || (newMsg.id === eventMsgId && eventOnline) || usersReacted.size === 0 || newMsg.id !== eventMsgId) {
		console.log('messageUpdated:');
		console.log(` -newMsg.channelId: ${newMsg.channelId}`);
		console.log(` -channelId: ${channelId}`);
		console.log(` -newMsg.id: ${newMsg.id}`);
		console.log(` -eventMsgId: ${eventMsgId}`);
		console.log(` -newMsg.author.bot: ${newMsg.author.bot}`);
		console.log(` -mineOnline: ${mineOnline}`);
		console.log(` -eventOnline ${eventOnline}`);
		return;
	}

	mineOnline = true;

	const miners = [];

	// for each user, fork a promise for every reaction they made
	usersReacted.forEach((rs, u) => {
		console.log(`id: ${u.id} tag: ${u.tag}`);
		rs.forEach((r) => {
			console.log(` -adding miner for ${u.tag} for reactionId: ${r}`);

			// add an anonomyous function that will call the processPendingWork function
			miners.push((callback) => {
				const result = chain.processPendingWork(u, r);

				callback(null, result);
			});
		});
	});

	async.parallel(miners, (error, results) => {
		console.log(results);
		const result = results.reduce((prev, curr) => {
			return prev.runTime < curr.runTime ? prev : curr;
		});
		console.log(`block finalized with hash: ${result.block.hash} by ${result.user.tag} in ${result.runTime}ms with ${result.reaction}`);
		// add winning block to the blockchain, and reward the user
		chain.addWinningBlock(result.user.id, result.block);
		chain.persist();
		const winEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Mining race complete!')
			.setDescription(`${winningUser} was the first to react and won 20 coins!\n\n${result.user} won the mining race with ${result.reaction} in ${result.runTime}ms!\nYou will get ${props.get('baseReward')} coins!`)
			.setImage(result.user.displayAvatarURL({ size: 1024, dynamic: true }))
			.setFooter({ text:'Note: mining rewards are minted after the next event' });

		mineOnline = false;
		eventOnline = false;
		usersReacted.clear();
		winningUser = null;

		newMsg.edit({ embeds:[winEmbed] });
	});
});