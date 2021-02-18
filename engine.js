// > CONSTANTS

const CONTAINERS = {

	main: document.querySelector("main")

};

const SELECTORS = {

	component: ".component",

	toggle:    "[type='checkbox']",
	range:     "[type='range']",
	radio:     "[type='radio']"
	
};

const DEFAULT_DESCRIPTION = "This here is where the description is supposed to be";

const BASE_COMPLEXITY      = 100; // * on the 1000 scale
const BASE_TIME_TO_DEVELOP = 120; // * hours, for 100 complexity, assuming 4hrs/day



// > PLACEHOLDERS

const COMPONENTS = [];

const TYPES      = [];


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

		let defaultFeatures = COMPONENTS.filter(component => component.default),
			defaultIDs = defaultFeatures.map(component => component.id);

		Projects.temporary.features = defaultIDs;

		Projects.temporary.values = Object.fromEntries(
			defaultFeatures.filter(feature => feature.values).map(feature => [feature.id, 0])
		);

		renderProjectScreen();
		
	}

};


// > HANDLERS

function handleCheckboxToggle (event) {

	let checkbox         = event.target,
		componentElement = checkbox.closest(SELECTORS.component),

		id               = checkbox.id,
		type             = componentElement.className.match(TYPES.join("|"), "gi")[0],

		features         = Projects.temporary.features;

	features.includes(id) ? features.splice(features.indexOf(id), 1) : features.push(id);

	if (type === "range") {

		let range = componentElement.querySelector(SELECTORS.range);

		range.disabled = !checkbox.checked;
		
		storeValueToProject(id, range.disabled ? null : range.value)

	};

	COMPONENTS.filter(component => component.prequisites && component.prequisites.includes(id)).map(component => {

		let componentElement = document.querySelector(`[component-id="${component.id}"]`),
			toggle           = componentElement.querySelector(SELECTORS.toggle);
		
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
		componentElement = range.closest(SELECTORS.component),

		id = componentElement.getAttribute("component-id"),
		value = range.value;

	storeValueToProject(id, value);

	updateComponentDetails(range);

	renderComplexityEffort();

};

function handleRadioSwitch (event) {

	let radio = event.target,
		componentElement = radio.closest(SELECTORS.component);

		id = componentElement.getAttribute("component-id"),
		value = radio.id.replace(radio.name, "");
	
	storeValueToProject(id, value);

	updateComponentDetails(radio);

	renderComplexityEffort();

};

function storeValueToProject (id, value) {

	// ? set value to `null` instead?
	return value === null ? delete Projects.temporary.values[id] : Projects.temporary.values[id] = value ;

};

function updateComponentDetails (subelement) {

	// TODO: implement with generated CSS and adjacency selectors

	let componentElement = subelement.closest(SELECTORS.component),
		componentID = componentElement.getAttribute("component-id"),

		type = subelement.getAttribute("type");

	let featureValues,
		details;

	let handler = {

		range () {

			featureValues = getFeature("id", componentID).values[subelement.value];

			details = [

				[ componentElement.querySelector(".state"),           featureValues.name         ],
				[ componentElement.querySelector(".description"),     featureValues.description  ],
				[ componentElement.querySelector(".complexity"),  `×${featureValues.complexity}` ]

			];

		},

		radio () {

			featureValues = getFeature("id", componentID).values[subelement.id.replace(subelement.name, "")];

			details = [

				[ componentElement.querySelector(".description"),     featureValues.description  ]

			];

		}

	};

	handler[type]();

	for ([element, text] of details) element.innerText = text;

	// * miscellaneous value updates

	let postfactum = {

		range () {

			// * set DOM element's `value` attribute to its effective JS `value`
			// * useful for handling views via constructed CSS
			return subelement.setAttribute("value", subelement.value)

		}

	};

	if (type in postfactum) postfactum[type]();

};


// > CALCULATIONS

function calculateProjectComplexity () {

	let toggled = Projects.temporary.features;

	let base_complexity_parsed = BASE_COMPLEXITY / 100;

	if (!toggled.length) return base_complexity_parsed;

	let calculatedComplexity = toggled.map(id => {

		let feature = COMPONENTS.filter(component => checkIfAllPrequisitesFulfilled(component)).find(component => component.id === id);
		
		// * i.e. if `feature` is not on the list of components the prequisites for which are not fulfilled → are not workable
		if (!feature) return base_complexity_parsed;

		let handler = {

			toggle () { return feature.complexity },

			range  () { return feature.values ? feature.values[Projects.temporary.values[id]].complexity : feature.complexity },

			radio  () { return feature.values ? feature.values[Projects.temporary.values[id]].complexity : feature.complexity }

		};

		return handler[feature.type]();


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
			<div class="hours">${calculateDevelopmentTime()}</div>
			hours to develop

		</div>
	`);

};

function renderComponentsList () {

	let fragment = new DocumentFragment();

	// * STAGE I → Render Content

	let render = {

		category (name) {

			return html`
				<article class="${name}">

					<h1>${toTitleCase(name)}</h1>

				</article>
			`;

		},

		subcategory (name) {

			return html`
				<section class="${name}">

					<h2>${toTitleCase(name)}</h2>

				</section>
			`;

		}

	};

	COMPONENTS.map(component => {

		let selector  = {

				category:    `article.${component.category}`,
				subcategory: `section.${component.subcategory}`

			},
		
			container = {
				
				category:    fragment.querySelector(selector.category),
				subcategory: fragment.querySelector(selector.category) 
								? fragment.querySelector(selector.category).querySelector(selector.subcategory) 
								: null
			
			},

			componentElement = renderComponent(component);

		// * ----------------------------------------------------------

		// * if containers don't exist, create them
		container.category    ??= render.category(component.category);
		container.subcategory ??= render.subcategory(component.subcategory);

		container.subcategory.append(componentElement);

		// * only append `container.subcategory` if it isn't already part of `container.category`
		container.category.querySelector(selector.subcategory) || container.category.append(container.subcategory);

		// * only append `container.category` if it isn't already part of `fragment`
		fragment.querySelector(selector.category) || fragment.append(container.category);

	});

	// * STAGE II → Sort Children to Parents Before Displaying
	
	COMPONENTS.filter(component => component.parent).map(component => moveChildComponentToParentElement(component, fragment));

	// * STAGE III → Disable Features that Have Unfulfilled Prequisites

	let checkboxes = [...fragment.querySelectorAll(SELECTORS.toggle)];

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

		let type = {
			
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
				
				// * futureproofing: this ↓ does not need wrapping quotation marks around the argument
				let placeholder = `placeholder=${component.placeholder || ""}`;

				return html`
					<div class="title">
						${component.name}
					</div>

					<input type="text" ${placeholder}>

					${renderComponentDescription(component)}

					${renderComponentPrequisites(component)}
				`

			},

			radio (component) {

				return html`
					<fieldset>

						<legend>${component.name}</legend>

						${component.values.map((value, index) => {

							let checked = index ? "" : "checked",
								unique  = `${component.id}${index}`;
							
							return html`
								<div class="option">
									<input type="radio" name="${component.id}" id="${unique}" ${checked}>
									<label for="${unique}">
										${value.name}
										<span class="complexity">×${value.complexity.toFixed(2)}</span>
									</label>
								</div>
							`
						
						})}

					</fieldset>

					${renderComponentDescription(component)}
				`

			}
		
		};

		return type[component.type](component);

	};

	return html`
		<div class="component ${component.type}" component-id="${component.id}">
			${template(component)}
		</div>
	`;

};

function renderComponentDescription (component) {

	let description = component.description && component.description.length
						// * ↓ render description consistently whether it's an array or a single string
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
		<ul class="prequisites">
			${component.prequisites.map(prequisite => {

				let fulfilled = checkIfPrequisiteFulfilled(prequisite).toString();

				return html`
					<li class="prequisite" is-prequisite-fulfilled="${fulfilled}" prequisite-id="${prequisite}">
						<b>Feature required</b>: ${getFeature("id", prequisite).name}
					</li>
				`

			})}
		</ul>`;

};

function renderComplexityEffort () {

	document.querySelector("main .hours").innerText = calculateDevelopmentTime();

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

};

function pickOneFromArray (array) {

	return array[Math.floor(Math.random() * (array.length - 1))];
	
};


// > INITIALIZATION

async function fetchJSONDocument (path) {

	let document = await fetch(path).then(response => response.json());

	return document;

};

async function assignJSONToConstant (pathToJSON, constant) {

	let data = await fetchJSONDocument(pathToJSON);

	await Object.assign(constant, data);

};

document.addEventListener("DOMContentLoaded", async () => {

	await assignJSONToConstant("components.json", COMPONENTS);

	let setOfTypes = Array.from(new Set(COMPONENTS.map(component => component.type)));

	Object.assign(TYPES, setOfTypes);

	Projects.new();

	Gator(document).on("change", `${SELECTORS.component} ${SELECTORS.toggle}`, handleCheckboxToggle);
	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.range}`,  handleRangeChange);
	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.radio}`,  handleRadioSwitch);

});