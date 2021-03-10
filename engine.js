// > CONSTANTS

const TIMER_RESOLUTION = 16;


// >> Data

const ELEMENTS = {

	main:    document.querySelector("main"),
	sidebar: document.querySelector("aside"),

	time:    document.querySelector("aside time")

};

const SELECTORS = {

	component: ".component",

	toggle:    "[type='checkbox']",
	range:     "[type='range']",
	radio:     "[type='radio']",
	text:      "[type='text']",

	random:    ".random"
	
};

const PLAYER = {

	skills: {

		// >>> Interactions & Mechanics
		motion:    1,
		physics:   1,

		// >>> Visuals & Graphics
		graphics:  1,
		animation: 1,

		// >>> Sound & Noises
		sound:     1

	}

};

const GAMEPLAY = {

	// TODO: create section for changing options // POST-ALPHA
	Options: {

		autogenerateGameName: false,
		startPaused:          true

	},

	Time: {

		current: 0,
		getFullHour () { return GAMEPLAY.Time.current % 24 },

		pause: {

			state:    false,
			isForced: false

		},

		tempo: 1,
		tempos: {

			slower: 0.5,
			regular:  1,
			faster:   2,
			fastest:  4

		},
		setTempo (id) { GAMEPLAY.Time.tempo = GAMEPLAY.Time.tempos[id] },
		getTrueTempo () { return GAMEPLAY.Time.tempo / TIMER_RESOLUTION },
		// TODO: ↑ come up with a better name

		schedule: [

			"sleep",
			"sleep",
			"sleep",
			"sleep",
			"sleep",
			"sleep",

			"commute",

			"work",
			"work",
			"work",
			"work",
			"work",
			"work",
			"work",
			"work",

			"commute",

			"project",
			"project",
			"project",
			"project",

			"rest",
			"rest",

			"sleep",
			"sleep"

		],
		getCurrentPreoccupation () { return GAMEPLAY.Time.schedule[GAMEPLAY.Time.getFullHour() - 1] },

		progress () {

			if (GAMEPLAY.Time.pause.state) return;

			GAMEPLAY.Time.current += GAMEPLAY.Time.getTrueTempo();

			if (GAMEPLAY.Time.getCurrentPreoccupation() === "project") Projects.advance();

			// TODO: advance skills if working on a project

			let fullHours  =  Math.floor(GAMEPLAY.Time.getFullHour()),
				parsedTime = `${fullHours}`.padStart(2, "0");

			updateUIComponent("time", { time: parsedTime });

		}

	}

};

const VIEWS = {

	Elements: {

		overview: document.querySelector("[view='overview']"),
		planner:  document.querySelector("[view='planner']")

	},

	render: {

		overview () {

			// TODO:
			// *  1. get a list of all the projects
			// *  2. sort projects by category, delimited by a header (current → finished → abandoned)
			// *  3. render each project element with progress etc. (use different function → `Projects.render()`?)

		},

		planner  () {

			let state = Projects.planned;

			let template = renderProjectScreen();

			// TODO: use `state` to render `template` accordingly

			VIEWS.Elements.planner.append(template);
			
		},

		project  () {}

	}

};

const TIMER = new Tock({

	resolution: TIMER_RESOLUTION,
	cycle:      true,

	callback:   GAMEPLAY.Time.progress

});

const ID = new Bronze({
	
	pid:  PROCESS_ID,
	name: PROCESS_NAME

});


// >> Placeholders

const COMPONENTS = [];


// > GAMEPLAY

class Feature {

	constructor (source) {

		Object.assign(this, source);

	};

	get finished () { return this.features.list.reduce((accumulator, feature) => accumulator += feature.timespan.left()) === 0 };

};

class ProjectPlanner {

	constructor () {

		this.title = GAMEPLAY.Options.autogenerateGameName 
						? Common.generateGameName() 
						: "";

		this.features = [];

		this.values = {};

		this.active = true;

	}

};

class Project {

	constructor (planner) {

		this.id = ID.generate();

		// * if at start there's no name to the game, assign one
		this.title = planner.title.trim() || Common.generateGameName();

		this.features = {

			get current () {

				// * map entries of `[key, feature]` to return feature
				let features = Object.entries(this.list).map(entry => entry.last);

				// * will return first unfinished feature or `undefined`
				return features.find(feature => feature.timespan.left() > 0);

			},

			list: planner.features.map(id => {

				let feature  = getFeature("id", id);
	
				let timespan = feature.values 
									? feature.values[planner.values[id]].timespan 
									: feature.timespan;
	
				return {
	
					id,
	
					timespan: {
	
						current:   0,
						total:     timespan,
	
						left       () { return this.total - this.current },
						asFraction () { return this.current / this.total }
						
					}
	
				};
	
			})

		};

		this.paused      = false;
		this.abandoned   = false;
		this.published   = false;

		this.timespan    = {

			get current () { return this.features.list.reduce((accumulator, feature) => accumulator += feature.timespan.total() - feature.timespan.left()) },

			get total   () { return this.features.list.reduce((accumulator, feature) => accumulator += feature.timespan.total()) }

		};

		this.advance     = () => {

			if (this.paused) return;

			let currentFeature = this.features.current,
				timespan       = currentFeature.timespan;

			// TODO: use skill modifiers and project multiplicity modifier in calculations of advancement

			timespan.current = Math.min(
				timespan.total, 
				timespan.current + GAMEPLAY.Time.getTrueTempo()
			);

		};

	};

	get finished () { return this.features.list.reduce((accumulator, feature) => accumulator += feature.timespan.left()) === 0; };
};

let Projects = {

	planned:      null,

	list:         [],

	get current   () { return Projects.list.filter(project => !project.finished && !project.abandoned && !project.published) },

	get abandoned () { return Projects.list.filter(project => project.abandoned) },

	get finished  () { return Projects.list.filter(project => project.isFinished()) },
	get finished  () { return Projects.list.filter(project => project.finished) },

	plan          () {

		Projects.planned    = new ProjectPlanner();

		let defaultFeatures = COMPONENTS.filter(component   => component.default),
			defaultIDs      = defaultFeatures.map(component => component.id);

		Projects.planned.features = defaultIDs;

		Projects.planned.values = Object.fromEntries(
			defaultFeatures.filter(feature => feature.values).map(feature => [feature.id, 0])
		);

		renderProjectScreen();
		
	},

	start         () {

		let planner = Projects.planned,
			project = new Project(planner);

		return Projects.list.last = project;

	},

	advance       () { return Projects.current.forEach(project => project.advance()) }

};


// > HANDLERS

function handleCheckboxToggle (event) {

	let checkbox         = event.target,
		componentElement = checkbox.closest(SELECTORS.component),

		id               = checkbox.id,
		type             = getFeature("id", id).type,

		features         = Projects.planned.features;

	features.toggle(id);

	// TODO: ↓ `enableChildrenComponents()`

	if (type === "range") {

		let range = componentElement.querySelector(SELECTORS.range);

		range.disabled = !checkbox.checked;
		
		storeValueToProject(id, range.disabled ? null : range.value)

	};

	// TODO: ↓ `updateUIComponent()` → `prequisites`

	COMPONENTS.filter(component => component.prequisites && component.prequisites.includes(id)).map(component => {

		let componentElement = document.querySelector(`[component-id="${component.id}"]`),
			toggle           = componentElement.querySelector(SELECTORS.toggle);
		
		toggle.disabled = !checkIfAllPrequisitesFulfilled(component);

		let prequisiteElements = componentElement.querySelector(".prequisites").querySelectorAll(".prequisite");

		for (let element of prequisiteElements) {

			let prequisiteID = element.id;
			
			element.checked = checkIfPrequisiteFulfilled(prequisiteID);

		};
				
	});

	renderComplexityEffort();

};

function handleRangeChange (event) {

	let range            = event.target,
		componentElement = range.closest(SELECTORS.component),

		id               = componentElement.getAttribute("component-id"),
		value            = range.value;

	storeValueToProject(id, value);

	updateComponentDetails(range);

	renderComplexityEffort();

};

function handleRadioSwitch (event) {

	let radio            = event.target,
		componentElement = radio.closest(SELECTORS.component);

		id               = componentElement.getAttribute("component-id"),
		value            = radio.id.replace(radio.name, "");
	
	storeValueToProject(id, value);

	updateComponentDetails(radio);

	renderComplexityEffort();

};

function handleTextInput (event) {

	let text             = event.target,
		componentElement = text.closest(SELECTORS.component);

		id               = componentElement.getAttribute("component-id"),
		value            = text.value;
	
	if (id === "title")	{

		Projects.planned.title = value;

	} else storeValueToProject(id, value);

};

function handleTempoChange (event) {

	let radio = event.target,
		id = radio.id;

	return GAMEPLAY.Time.setTempo(id);

};

function handlePauseStateChange (event) {

	let checkbox = event.target;

	return GAMEPLAY.Time.pause.state = checkbox.checked;

};

function randomizeTarget (event) {

	let random           = event.target,

		componentElement = random.closest(SELECTORS.component),
		componentID      = componentElement.getAttribute("component-id"),

		input            = componentElement.querySelector("input"),
		handler          = getFeature("id", componentID).random;

	let content = Common[handler]();

	return input.value = content;

};

function storeValueToProject (id, value) {

	return value === null ? delete Projects.planned.values[id] : Projects.planned.values[id] = value ;

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

function calculateProjectDuration () {

	let toggled = Projects.planned.features;

	if (!toggled.length) return 0;

	let duration = toggled.map(id => {

		let feature = getFeature("id", id);

		return feature.values 
					? feature.values[Projects.planned.values[id]].timespan 
					: feature.timespan


	}).reduce((accumulator, timespan) => accumulator += timespan);

	return duration;

};


// > RENDERING

function renderProjectScreen () {

	let fragment = renderComponentsList();

	fragment.append(html`
		<div class="effort">

			This game would take
			<div class="hours">${calculateProjectDuration()}</div>
			hours to develop

		</div>
	`);

	return fragment;

};

function renderComponentsList () {

	let fragment = new DocumentFragment();

	// * STAGE I → Render Content

	let render = {

		category (name) {

			return html`
				<article class="${name}">

					<h1>${name.toTitleCase()}</h1>

				</article>
			`;

		},

		subcategory (name) {

			return html`
				<section class="${name}">

					<h2>${name.toTitleCase()}</h2>

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

	checkboxes.filter(checkbox => checkbox.className !== "prequisite").map(checkbox => {

		let feature = getFeature("id", checkbox.id);

		let state = !checkIfAllPrequisitesFulfilled(feature);

		checkbox.disabled = state;

	});

	// * STAGE IV → Render Game Title into Respected Input

	let titleInput = fragment.querySelector("[component-id='title'] input");

	titleInput.value = Projects.planned.title;

	// * STAGE V → Display Content

	return fragment;

};

function renderComponent (component) {

	let template = component => {

		let checked  = component.default ? "checked" :  "";
		let disabled = component.default ? "" : "disabled";

		let timespan = component.values
							? component.values.first.timespan
							: component.timespan;

		let type = {
			
			toggle (component) {

				return html`
					<div class="title">

						<input type="checkbox" id="${component.id}" ${checked}>

						<label for="${component.id}">

							${component.name}

							<span class="timespan">
								⏱ ${timespan} hours
							</span>

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
					max     = component.values.length - 1;

				return html`

					<div class="title">

						<input type="checkbox" id="${component.id}" ${checked}>

						<label for="${component.id}">

							${component.name}

							<span class="timespan">
								⏱ ${component.values[initial].timespan} hours
							</span>

							<span class="complexity">
								×${component.values[initial].complexity.toFixed(2)}
							</span>

						</label>

						<div class="state" state-id="${initial}">
							${component.values[initial].name}
						</div>

					</div>

					<input type="range" value="${initial}" min="${initial}" max="${max}" ${disabled}>

					${renderComponentDescription(component)}

					${renderComponentPrequisites(component)}
				`

			},

			text (component) {
				
				// * futureproofing: this ↓ does not need wrapping quotation marks around the argument
				let placeholder = `placeholder=${component.placeholder || ""}`;
				let random = component.random ? html`<button class="random"></button>` : "";

				return html`
					<div class="title">

						${component.name}

						${random}

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
								<label>
									<input type="radio" name="${component.id}" id="${unique}" ${checked}>

									<span>
										${value.name}
										<span class="complexity">×${value.complexity.toFixed(2)}</span>
									</span>
								</label>
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
		<div class="component" component-type="${component.type}" component-id="${component.id}">
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
							: "";

	
	return description.length 
			? html`
				<div class="description">
					${description}
				</div>
			`
			: "";

};

function renderComponentPrequisites (component) {

	if (!component.prequisites || !component.prequisites.length) return "";

	return html`
		<ul class="prequisites">
			${component.prequisites.map(prequisite => {

				let checked = checkIfPrequisiteFulfilled(prequisite) ? "checked" : "";

				return html`
					<li>
						<input type="checkbox" class="prequisite" id="${prequisite}" ${checked} disabled> <b>Feature required</b>: ${getFeature("id", prequisite).name}
					</li>
				`

			})}
		</ul>`;

};

function renderComplexityEffort () {

	document.querySelector("main .hours").innerText = calculateProjectDuration();

};

function updateUIComponent (id, data) {

	let handler = {

		"time" (data) { return ELEMENTS.time.setAttribute("datetime", `${data.time}:00`); }

	};

	return handler[id](data);

};


// > UTILITY

function moveChildComponentToParentElement (component, wrapper) {

	let child  = wrapper.querySelector(`[component-id="${component.id}"]`),
		parent = wrapper.querySelector(`[component-id="${component.parent}"]`);

	parent.append(child);

};

function checkIfPrequisiteFulfilled (prequisite) {

	return Projects.planned.features.includes(prequisite);

};

function checkIfAllPrequisitesFulfilled (component) {

	return component.prequisites && component.prequisites.length
				? component.prequisites.every(prequisite => checkIfPrequisiteFulfilled(prequisite))
				: true;

};

function getFeature (key, value) {

	return COMPONENTS.find(component => component[key] === value);

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

	// >> Assemble Data

	await assignJSONToConstant("components.json", COMPONENTS);

	Projects.plan();

	TIMER.start();


	// >> Render Views

	VIEWS.render.overview();
	VIEWS.render.planner();


	// >> Event Piping

	Gator(document).on("click",  `${SELECTORS.component} ${SELECTORS.random}`, randomizeTarget);

	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.toggle}`, handleCheckboxToggle);
	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.range}`,  handleRangeChange);
	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.radio}`,  handleRadioSwitch);
	Gator(document).on("input",  `${SELECTORS.component} ${SELECTORS.text}`,   handleTextInput);

	Gator(document).on("input",  `[name="tempo"]`,                             handleTempoChange);

	Gator(document).on("input",  `[name="paused"]`,                            handlePauseStateChange);


	// >> Optional Starting Settings

	// *  trigger an `input` event on the pause checkbox, thus forcing the game to start off paused
	if (GAMEPLAY.Options.startPaused) document.querySelector("[name='paused']").click();

});