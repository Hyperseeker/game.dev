Array.prototype.pick = function () {

	return this[Math.floor(Math.random() * (this.length - 1))];

};