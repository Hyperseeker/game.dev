String.prototype.toTitleCase = function () {

	return this.replaceAll(/\w*/g, (word, index) => {

		let PREPOSITIONS = [

			"aboard", "about", "above", "across", "after", "against", "along", "amid", "among", "anti", "around", "as", "at", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "but", "by", "concerning", "considering", "despite", "down", "during", "except", "excepting", "excluding", "following", "for", "from", "in", "inside", "into", "like", "minus", "near", "of", "off", "on", "onto", "opposite", "outside", "over", "past", "per", "plus", "regarding", "round", "save", "since", "than", "through", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "via", "with", "within", "without"
		
		];

		let NONCAPITALIZABLE_STYLISTICS = [

			"is",
			"are"
		
		];

		let ARTICLES = [ 
		
			"a", "an", "the" 
			
		];
		
		let NONCAPITALIZABLE = [
		
			...PREPOSITIONS,
			...NONCAPITALIZABLE_STYLISTICS,
			...ARTICLES
		
		];

		let capitalize = word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();

		return index
				? NONCAPITALIZABLE.includes(word)
					? word
					: capitalize(word)
				: capitalize(word);
		
	});

};