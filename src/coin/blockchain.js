const Block = require('./block');
const Work = require('./work');
const propsReader = require('properties-reader');
const props = propsReader('./resources/coin.properties');
const persist = require('node-persist');

class BlockChain {
	constructor() {
		this.chain = [this.createBlockZero()];
		this.pendingWork = [];
		this.difficulty = props.get('difficulty');
		this.baseReward = props.get('baseReward');
	}

	// genesis block w/ a seed of 1000 coins
	createBlockZero() {
		const greatWork = new Work(null, 'god', 1000);
		return new Block('05/26/2022', [greatWork], '0');
	}

	// get the latest block added to the chain
	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	// main way to add blocks. we can experiment ways on how often this is called, who calls it, and how we choose recipients
	processPendingWork(user, r) {
		const block = new Block(Date.now(), this.pendingWork, this.getLatestBlock.hash);
		const runTime = block.mineBlock(this.difficulty);

		return {
			'user': user,
			'reaction': r,
			'runTime': runTime,
			'block': block,
		};
	}

	addWinningBlock(rewardAddy, block) {
		this.chain.push(block);

		// whoever won the race gets rewarded with a base amount (we can scale this at a later time)
		this.pendingWork = [new Work(null, rewardAddy, this.baseReward)];
	}

	// event-driven. to be invoked by discord bot with work item
	// it can be a transaction from one player to another
	// or an event that just gives out reward, the recipient can be decided by a random event spawn and the first user to @ the bot
	// can earn a reward
	addWork(work) {
		this.pendingWork.push(work);
	}

	// dynamic balance calculator
	// scans blockchain to compound transactions
	// this function is the basis for how users can retrieve their balance, we can try to optimize this later
	getBalance(addy) {
		let balance = 0;
		for (const block of this.chain) {
			for (const work of block.work) {
				if (work.fr === addy) {
					balance -= work.amt;
				}
				else if (work.to === addy) {
					balance += work.amt;
				}
			}
		}

		return balance;
	}

	isChainValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currBlock = this.chain[i];
			const prevBlock = this.chain[i - 1];

			if (currBlock.hash !== currBlock.calcHash()) return false;
			if (currBlock.prev !== prevBlock.calcHash()) return false;
		}

		return true;
	}

	async persist() {
		await persist.init({

			dir: './resources',
			stringify: JSON.stringify,
			encoding: 'utf8',
			logging: true,
			ttl: false,
			forgiveParseErrors: true,
		});

		await persist.setItem('chain', JSON.stringify(this.chain, null));
	}

	async reassemble() {
		await persist.init({
			dir: './resources',
			encoding: 'utf8',
			logging: true,
			ttl: false,
			forgiveParseErrors: true,
		});

		await persist.getItem('chain').then(value => {
			if (value) {
				this.chain = JSON.parse(value);
			}
		});
	}
}

module.exports = BlockChain;