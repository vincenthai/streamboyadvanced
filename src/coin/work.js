class Work {
	constructor(fr, to, amt, actualWork = []) {
		this.fr = fr;
		this.to = to;
		this.amt = amt;
		this.actualWork = actualWork;
	}
}

module.exports = Work;