const hash = require('crypto-js/sha256');
const crypto = require('crypto');
const now = require('performance-now');

class Block {
	constructor(timestamp, work, prev = '') {
		this.timestamp = timestamp;
		this.work = work;
		this.prev = prev;
		this.hash = this.calcHash();
		this.nonce = crypto.randomBytes(16).toString('base64');
	}

	calcHash() {
		return hash(this.prev + this.timestamp + JSON.stringify(this.work) + this.nonce).toString();
	}

	mineBlock(diff) {
		const start = now();
		// this is the meat we can change. we want to do something with the items in work[] and scale it with difficulty
		while (this.hash.substring(0, diff) !== Array(diff + 1).join('0')) {
			this.nonce = crypto.randomBytes(16).toString('base64');
			this.hash = this.calcHash();
		}
		const end = now();
		return parseFloat((end - start).toFixed(2));
	}
}

module.exports = Block;