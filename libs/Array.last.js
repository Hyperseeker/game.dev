Object.defineProperty(Array.prototype, 'last', {

	get () { return this[this.length - 1] },

	set (value) { this[this.length] = value }
	
});