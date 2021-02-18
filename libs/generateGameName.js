let GAME_NAME_PARTS = [

	"adventure",
	"rite",
	"rate",
	"bone",
	"fire",
	"silence",
	"reason",
	"politics"

];

let MODELS = [

	"$1 of $2",
	"the $1 of $2",
	"the $1",
	"$1 is coming"

];

function generateGameName () {

	let model = MODELS.pick();

	return renderModel(model);

};

function pluralize (singular) {

	return singular[singular.length - 1] === "s"
				? singular
				: singular + "s";

};

function renderModel (model) {
	
	return model.replaceAll(/(\$\w*)/g, getGameNamePart).toTitleCase();

};

function getGameNamePart () {

	let part = GAME_NAME_PARTS.pick();

	return Random.boolean()
				? part
				: pluralize(part);

};

Common.generateGameName = generateGameName;