Array.prototype.toggle = function (item) {

	this.includes(item) ? this.splice(this.indexOf(item), 1) : this.push(item);

}