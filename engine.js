// > CONSTANTS

const CONTAINERS = {

	main: document.querySelector("main")

};

const DEFAULT_DESCRIPTION = "This here is where the description is supposed to be";

const BASE_COMPLEXITY = 100;
const BASE_TIME_TO_DEVELOP = 60; // * days, for 100 complexity

const TYPES = [
	"input",
	"toggle",
	"range"
];


// > PLACEHOLDERS

let COMPONENTS = [];


// > GAMEPLAY

class Project {

	constructor () {

		// TODO: set up random name for the new game by default

		this.title = "";

		this.features = [];

		this.values = {};

	}

}

let Projects = {

	temporary: null,

	current: [],

	finished: [],

	abandoned: [],

	new () {

		Projects.temporary = new Project();

		let defaultFeatures = COMPONENTS.filter(component => component.default).map(component => component.id);

		Projects.temporary.features = defaultFeatures;

		renderProjectScreen();
		
	}

};


// > HANDLERS

function handleCheckboxToggle (event) {

	let checkbox = event.target,
		componentElement = checkbox.closest(".component"),

		id = checkbox.id,
		type = componentElement.className.match(TYPES.join("|"), "gi")[0],

		features = Projects.temporary.features;

	features.includes(id) ? features.splice(features.indexOf(id), 1) : features.push(id);

	if (type === "range") {

		let range = componentElement.querySelector("[type='range']");

		range.disabled = !checkbox.checked;
		
		storeRangeValueToProject(id, range.disabled ? null : range.value)

	};

	COMPONENTS.filter(component => component.prequisites && component.prequisites.includes(id)).map(component => {

		let componentElement = document.querySelector(`[component-id="${component.id}"]`),
			toggle           = componentElement.querySelector(`[type="checkbox"]`);
		
		toggle.disabled = !checkIfAllPrequisitesFulfilled(component);

		let prequisitesElement = componentElement.querySelector(".prequisites");

		if (prequisitesElement) {

			let prequisiteElementsList = prequisitesElement.querySelectorAll(".prequisite");

			for (prequisiteElement of prequisiteElementsList) {

				let prequisiteID = prequisiteElement.getAttribute("prequisite-id");
				
				prequisiteElement.setAttribute("is-prequisite-fulfilled", checkIfPrequisiteFulfilled(prequisiteID));

			}

		};
				
	});

	renderComplexityEffort();

};

function handleRangeChange (event) {

	let range = event.target,
		componentElement = range.closest(".component"),

		id = componentElement.getAttribute("component-id"),
		value = range.value;

	storeRangeValueToProject(id, value);

	updateRangeDetails(range);

	renderComplexityEffort();

};

function storeRangeValueToProject (id, value) {

	// ? set value to `null` instead?
	return value === null ? delete Projects.temporary.values[id] : Projects.temporary.values[id] = value ;

};

function updateRangeDetails (range) {

	// TODO: implement with generated CSS and adjacency selectors

	let componentElement = range.closest(".component"),
		componentID = componentElement.getAttribute("component-id");

	let featureValues = getFeature("id", componentID).values[range.value];

	let details = [

		[ componentElement.querySelector(".state"),           featureValues.name         ],
		[ componentElement.querySelector(".description"),     featureValues.description  ],
		[ componentElement.querySelector(".complexity"),  `×${featureValues.complexity}` ]

	];

	for ([element, text] of details) element.innerText = text;

}


// > CALCULATIONS

function calculateProjectComplexity () {

	let toggled = Projects.temporary.features;

	let base_complexity_parsed = BASE_COMPLEXITY / 100;

	if (!toggled.length) return base_complexity_parsed;

	let calculatedComplexity = toggled.map(id => {

		let feature = COMPONENTS.filter(component => checkIfAllPrequisitesFulfilled(component)).find(component => component.id === id);
		
		// * i.e. if `feature` is not on the list of components the prequisites for which are not fulfilled → are not workable
		if (!feature) return base_complexity_parsed;

		let handlers = {

			toggle () { return feature.complexity },

			range  () { return feature.values ? feature.values[Projects.temporary.values[id]].complexity : feature.complexity }

		};

		return handlers[feature.type]();


	}).reduce((accumulator, complexity) => accumulator *= complexity);

	return base_complexity_parsed * calculatedComplexity;

};

function calculateDevelopmentTime () {

	let complexity = calculateProjectComplexity();

	return Math.ceil(complexity.toFixed(2) * BASE_TIME_TO_DEVELOP);

};


// > RENDERING

function renderProjectScreen () {

	renderComponentsList();

	CONTAINERS.main.append(html`
		<div class="effort">

			This game would take
			<div class="days">${calculateDevelopmentTime()}</div>
			days to develop

		</div>
	`);

};

function renderComponentsList () {

	let fragment = new DocumentFragment();

	// * STAGE I → Render Content

	COMPONENTS.map(component => {

		let { category, subcategory } = component;

		let article, section;

		if (!fragment.querySelector(`article.${category}`)) {

			let article = html`
				<article class="${category}">
					<h1>${toTitleCase(category)}</h1>
				</article>
			`;

			fragment.append(article);

		};

		article = fragment.querySelector(`article.${category}`);

		if (!article.querySelector(`section.${subcategory}`)) {

			let section = html`
				<section class="${subcategory}">
					<h2>${toTitleCase(subcategory)}</h2>
				</section>
			`;

			article.append(section);
			
		};

		section = article.querySelector(`section.${subcategory}`);

		let componentElement = renderComponent(component);

		section.append(componentElement);

	});

	// * STAGE II → Sort Children to Parents Before Displaying
	
	COMPONENTS.filter(component => component.parent).map(component => moveChildComponentToParentElement(component, fragment));

	// * STAGE III → Add Default Features to Features List & Disable Features that Have Unfulfilled Prequisites

	let checkboxes = [...fragment.querySelectorAll("[type='checkbox']")];

	checkboxes.map(checkbox => {

		let feature = getFeature("id", checkbox.id);

		checkbox.disabled = !checkIfAllPrequisitesFulfilled(feature);

	});

	// * STAGE IV → Display Content

	CONTAINERS.main.append(fragment);

};

function renderComponent (component) {

	let template = component => {

		let checked  = component.default ? "checked" : "";
		let disabled = component.default ? "" : "disabled";

		let types = {
			
			toggle (component) {

				return html`
					<div class="title">

						<input type="checkbox" id="${component.id}" ${checked}>

						<label for="${component.id}">

							${component.name}

							<span class="complexity">
								×${component.complexity.toFixed(2)}
							</span>

						</label>

					</div>

					${renderComponentDescription(component)}

					${renderComponentPrequisites(component)}
				`

			},

			range (component) {

				let initial = 0,
					max = component.values.length - 1;

				return html`

					<div class="title">

						<input type="checkbox" id="${component.id}" ${checked}>

						<label for="${component.id}">

							${component.name}

							<span class="complexity">
								×${component.values[initial].complexity.toFixed(2)}
							</span>

						</label>

						<span class="state" state-id="${initial}">
							${component.values[initial].name}
						</span>

					</div>

					<input type="range" value="${initial}" min="${initial}" max="${max}" ${disabled}>

					${renderComponentDescription(component)}

					${renderComponentPrequisites(component)}
				`

			},

			input (component) {

				let placeholder = `placeholder=${component.placeholder || ""}`;

				return html`
					<div class="title">
						${component.name}
					</div>

					<input type="text" ${placeholder}>

					${renderComponentDescription(component)}

					${renderComponentPrequisites(component)}
				`

			}
		
		};

		return types[component.type](component);

	};

	return html`
		<div class="component ${component.type}" component-id="${component.id}">
			${template(component)}
		</div>
	`;

};

function renderComponentDescription (component) {

	let description = component.description && component.description.length
						? [component.description].flat().map(line => html`<p>${line}</p>`)
						: component.values
							? component.values[0].description
							: DEFAULT_DESCRIPTION;

	return html`
		<div class="description">
			${description}
		</div>
	`;

};

function renderComponentPrequisites (component) {

	if (!component.prequisites || !component.prequisites.length) return "";

	return html`
		<div class="prequisites">
			${component.prequisites.map(prequisite => {

				let fulfilled = checkIfPrequisiteFulfilled(prequisite).toString();

				let element = html`
					<div class="prequisite" is-prequisite-fulfilled="${fulfilled}" prequisite-id="${prequisite}">
						<b>Feature required</b>: ${getFeature("id", prequisite).name}
					</div>
				`

				return element;

			})}
		</div>`;

};

function renderComplexityEffort () {

	document.querySelector("main .days").innerText = calculateDevelopmentTime();

};


// > UTILITY

function moveChildComponentToParentElement (component, wrapper) {

	let child  = wrapper.querySelector(`[component-id="${component.id}"]`),
		parent = wrapper.querySelector(`[component-id="${component.parent}"]`);

	let clone = child.cloneNode(true);
	child.remove();

	parent.append(clone);

};

function checkIfPrequisiteFulfilled (prequisite) {

	return Projects.temporary.features.includes(prequisite);

};

function checkIfAllPrequisitesFulfilled (component) {

	return component.prequisites && component.prequisites.length
				? component.prequisites.every(prequisite => checkIfPrequisiteFulfilled(prequisite))
				: true;

};

function getFeature (key, value) {

	return COMPONENTS.find(component => component[key] === value);

}

function pickOneFromArray (array) {

	return array[Math.floor(Math.random() * (array.length - 1))];
	
}


// > INITIALIZATION

document.addEventListener("DOMContentLoaded", async () => {

	await fetch("components.json").then(response => response.json()).then(response => Object.assign(COMPONENTS, response));

	Projects.new();

	Gator(document).on("change", ".component [type='checkbox']", handleCheckboxToggle);
	Gator(document).on("input",  ".component [type='range']",    handleRangeChange);

});