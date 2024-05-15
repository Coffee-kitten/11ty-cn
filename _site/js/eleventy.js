


class Island extends HTMLElement {
  static tagName = "is-land";
  static prefix = "is-land--";
  static attr = {
    template: "data-island",
    ready: "ready",
    defer: "defer-hydration",
  };

  static onceCache = new Map();
  static onReady = new Map();

  static fallback = {
    ":not(is-land,:defined,[defer-hydration])": (readyPromise, node, prefix) => {
      // remove from document to prevent web component init
      let cloned = document.createElement(prefix + node.localName);
      for(let attr of node.getAttributeNames()) {
        cloned.setAttribute(attr, node.getAttribute(attr));
      }
    
      // Declarative Shadow DOM (with polyfill)
      let shadowroot = node.shadowRoot;
      if(!shadowroot) {
        let tmpl = node.querySelector(":scope > template:is([shadowrootmode], [shadowroot])");
        if(tmpl) {
          let mode = tmpl.getAttribute("shadowrootmode") || tmpl.getAttribute("shadowroot") || "closed";
          shadowroot = node.attachShadow({ mode }); // default is closed
          shadowroot.appendChild(tmpl.content.cloneNode(true));
        }
      }
    
      // Cheers to https://gist.github.com/developit/45c85e9be01e8c3f1a0ec073d600d01e
      if(shadowroot) {
        cloned.attachShadow({ mode: shadowroot.mode }).append(...shadowroot.childNodes);
      }
    
      // Keep *same* child nodes to preserve state of children (e.g. details->summary)
      cloned.append(...node.childNodes);
      node.replaceWith(cloned);
    
      return readyPromise.then(() => {
        // Restore original children and shadow DOM
        if(cloned.shadowRoot) {
          node.shadowRoot.append(...cloned.shadowRoot.childNodes);
        }
        node.append(...cloned.childNodes);
        cloned.replaceWith(node);
      });
    }
  }

  constructor() {
    super();

    // Internal promises
    this.ready = new Promise(resolve => {
      this.readyResolve = resolve;
    });
  }

  // any parents of `el` that are <is-land> (with conditions)
  static getParents(el, stopAt = false) {
    let nodes = [];
    while(el) {
      if(el.matches && el.matches(Island.tagName)) {
        if(stopAt && el === stopAt) {
          break;
        }

        if(Conditions.hasConditions(el)) {
          nodes.push(el);
        }
      }
      el = el.parentNode;
    }
    return nodes;
  }

  static async ready(el, parents) {
    if(!parents) {
      parents = Island.getParents(el);
    }
    if(parents.length === 0) {
      return;
    }
    let imports = await Promise.all(parents.map(p => p.wait()));
    // return innermost module import
    if(imports.length) {
      return imports[0];
    }
  }

  forceFallback() {
    if(window.Island) {
      Object.assign(Island.fallback, window.Island.fallback);
    }

    for(let selector in Island.fallback) {
      // Reverse here as a cheap way to get the deepest nodes first
      let components = Array.from(this.querySelectorAll(selector)).reverse();

      // with thanks to https://gist.github.com/cowboy/938767
      for(let node of components) {
        if(!node.isConnected) {
          continue;
        }

        let parents = Island.getParents(node);
        // must be in a leaf island (not nested deep)
        if(parents.length === 1) {
          let p = Island.ready(node, parents);
          Island.fallback[selector](p, node, Island.prefix);
        }
      }
    }
  }

  wait() {
    return this.ready;
  }

  async connectedCallback() {
    // Only use fallback content with loading conditions
    if(Conditions.hasConditions(this)) {
      // Keep fallback content without initializing the components
      this.forceFallback();
    }

    await this.hydrate();
  }

  getTemplates() {
    return this.querySelectorAll(`template[${Island.attr.template}]`);
  }

  replaceTemplates(templates) {
    // replace <template> with the live content
    for(let node of templates) {
      // if the template is nested inside another child <is-land> inside, skip
      if(Island.getParents(node, this).length > 0) {
        continue;
      }

      let value = node.getAttribute(Island.attr.template);
      // get rid of the rest of the content on the island
      if(value === "replace") {
        let children = Array.from(this.childNodes);
        for(let child of children) {
          this.removeChild(child);
        }
        this.appendChild(node.content);
        break;
      } else {
        let html = node.innerHTML;
        if(value === "once" && html) {
          if(Island.onceCache.has(html)) {
            node.remove();
            return;
          }

          Island.onceCache.set(html, true);
        }

        node.replaceWith(node.content);
      }
    }
  }

  async hydrate() {
    let conditions = [];
    if(this.parentNode) {
      // wait for all parents before hydrating
      conditions.push(Island.ready(this.parentNode));
    }

    let attrs = Conditions.getConditions(this);
    for(let condition in attrs) {
      if(Conditions.map[condition]) {
        conditions.push(Conditions.map[condition](attrs[condition], this));
      }
    }

    // Loading conditions must finish before dependencies are loaded
    await Promise.all(conditions);

    this.replaceTemplates(this.getTemplates());

    for(let fn of Island.onReady.values()) {
      await fn.call(this, Island);
    }

    this.readyResolve();

    this.setAttribute(Island.attr.ready, "");

    // Remove [defer-hydration]
    this.querySelectorAll(`[${Island.attr.defer}]`).forEach(node => node.removeAttribute(Island.attr.defer));
  }
}

class Conditions {
  static map = {
    visible: Conditions.visible,
    idle: Conditions.idle,
    interaction: Conditions.interaction,
    media: Conditions.media,
    "save-data": Conditions.saveData,
  };

  static hasConditions(node) {
    return Object.keys(Conditions.getConditions(node)).length > 0;
  }

  static getConditions(node) {
    let map = {};
    for(let key of Object.keys(Conditions.map)) {
      if(node.hasAttribute(`on:${key}`)) {
        map[key] = node.getAttribute(`on:${key}`);
      }
    }

    return map;
  }

  static visible(noop, el) {
    if(!('IntersectionObserver' in window)) {
      // runs immediately
      return;
    }

    return new Promise(resolve => {
      let observer = new IntersectionObserver(entries => {
        let [entry] = entries;
        if(entry.isIntersecting) {
          observer.unobserve(entry.target);
          resolve();
        }
      });

      observer.observe(el);
    });
  }

  // Warning: on:idle is not very useful with other conditions as it may resolve long before.
  static idle() {
    let onload = new Promise(resolve => {
      if(document.readyState !== "complete") {
        window.addEventListener("load", () => resolve(), { once: true });
      } else {
        resolve();
      }
    });

    if(!("requestIdleCallback" in window)) {
      // run immediately
      return onload;
    }

    // both idle and onload
    return Promise.all([
      new Promise(resolve => {
        requestIdleCallback(() => {
          resolve();
        });
      }),
      onload,
    ]);
  }

  static interaction(eventOverrides, el) {
    let events = ["click", "touchstart"];
    // event overrides e.g. on:interaction="mouseenter"
    if(eventOverrides) {
      events = (eventOverrides || "").split(",").map(entry => entry.trim());
    }

    return new Promise(resolve => {
      function resolveFn(e) {
        resolve();

        // cleanup the other event handlers
        for(let name of events) {
          el.removeEventListener(name, resolveFn);
        }
      }

      for(let name of events) {
        el.addEventListener(name, resolveFn, { once: true });
      }
    });
  }

  static media(query) {
    let mm = {
      matches: true
    };

    if(query && ("matchMedia" in window)) {
      mm = window.matchMedia(query);
    }

    if(mm.matches) {
      return;
    }

    return new Promise(resolve => {
      mm.addListener(e => {
        if(e.matches) {
          resolve();
        }
      });
    });
  }

  static saveData(expects) {
    // return early if API does not exist
    if(!("connection" in navigator) || navigator.connection.saveData === (expects !== "false")) {
      return;
    }

    // dangly promise
    return new Promise(() => {});
  }
}

// Should this auto define? Folks can redefine later using { component } export
if("customElements" in window) {
  window.customElements.define(Island.tagName, Island);
  window.Island = Island;
}

export {
  Island,
  Island as component, // Backwards compat only: recommend `Island` export
};

// TODO remove in 4.0
export const ready = Island.ready; // Backwards compat only: recommend `Island` export

class IslandAutoinit {
	static attr = {
		autoInitType: "autoinit",
		import: "import",
	}

	static types = {
		"petite-vue": function(lib) {
			lib.createApp().mount(this);
		},
		"vue": function(lib) {
			lib.createApp().mount(this);
		},
		"svelte": function(lib) {
			new lib.default({ target: this });
		},
		"svelte-ssr": function(lib) {
			new lib.default({ target: this, hydrate: true });
		},
		"preact": function(lib) {
			lib.default(this);
		}
	};
}

Island.onReady.set("import-autoinit", async function(Island) {
	let mod;
  // [dependency="my-component-code.js"]
  let importScript = this.getAttribute(IslandAutoinit.attr.import);
  if(importScript) {
    // we could resolve import maps here manually but you’d still have to use the full URL in your script’s import anyway
    mod = await import(importScript);
  }

  if(mod) {
    // Use `import=""` for when import maps are available e.g. `import="petite-vue"`
    let fn = IslandAutoinit.types[this.getAttribute(IslandAutoinit.attr.autoInitType) || importScript];
    if(fn) {
      await fn.call(this, mod);
    }
  }
})

class HtmlFetch extends HTMLElement {
	static tagName = "html-fetch";

	constructor() {
		super();

		this.attrs = {
			src: "src",
			replace: "replace",
		};
	}

	async connectedCallback() {
		await this.fetch();
	}

	getTarget() {
		let targetAttr = this.getAttribute("target");
		if (targetAttr) {
			let target = this.closest(targetAttr);
			if (target) {
				return target;
			}
		}

		return this;
	}

	inject(target, html, shouldReplaceTarget) {
		if (shouldReplaceTarget) {
			let div = document.createElement("div");
			div.innerHTML = html;

			for (let child of Array.from(div.children)) {
				target.insertAdjacentElement("beforebegin", child);
			}
			target.remove();
		} else {
			target.innerHTML = html;
		}
	}

	async fetch() {
		if (!("fetch" in window)) {
			return;
		}

		try {
			let targetUrl = this.getAttribute(this.attrs.src);
			let response = await fetch(targetUrl);
			let text = await response.text();

			// remove attribute so we don’t reprocess it
			this.removeAttribute(this.attrs.src);
			this.inject(
				this.getTarget(),
				text,
				this.hasAttribute(this.attrs.replace)
			);
		} catch (e) {
			console.log("html-fetch failed", e);
		}
	}
}

// Should this auto define? Folks can redefine later using { component } export
if ("customElements" in window) {
	customElements.define(HtmlFetch.tagName, HtmlFetch);
}

class FilterContainer extends HTMLElement {
  constructor() {
    super();
    this.attrs = {
      oninit: "oninit",
      valueDelimiter: "delimiter",
      leaveUrlAlone: "leave-url-alone",
      mode: "filter-mode",
      bind: "data-filter-key",
      results: "data-filter-results",
      resultsExclude: "data-filter-results-exclude",
    };
    this.classes = {
      enhanced: "filter-container--js",
      hidden: "filter--hide",
    }
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this._lookedFor = {};

    this.classList.add(this.classes.enhanced);

    this.bindEvents(this.formElements);

    if(this.hasAttribute(this.attrs.oninit)) {
      // This timeout was necessary to fix a bug with Google Chrome 93
      // Navigate to a filterable page, navigate away, use the back button to return
      // (connectedCallback would filter before the DOM was ready)
      window.setTimeout(() => {
        for(let key in this.formElements) {
          this.initFormElements(this.formElements[key]);
          this.applyFilterForKey(key);
          this.renderResultCount(true);
        }
      }, 0);
    }
  }

  get valueDelimiter() {
    if(!this._valueDelimiter) {
      this._valueDelimiter = this.getAttribute(this.attrs.valueDelimiter) || ",";
    }

    return this._valueDelimiter;
  }

  get formElements() {
    if(!this._lookedFor.formElements) {
      let selector = `:scope [${this.attrs.bind}]`;
      let results = {};
      for(let node of this.querySelectorAll(selector)) {
        let attr = node.getAttribute(this.attrs.bind);
        if(!results[attr]) {
          results[attr] = [];
        }
        results[attr].push(node);
      }
      this._formElements = results;
      this._lookedFor.formElements = true;
    }

    return this._formElements;
  }

  getAllKeys() {
    return Object.keys(this.formElements);
  }
  
  getElementSelector(key) {
    return `data-filter-${key}`
  }

  getKeyFromAttributeName(attributeName) {
    return attributeName.substr("data-filter-".length);
  }

  getFilterMode(key) {
    if(!this.modes) {
      this.modes = {};
    }
    if(!this.modes[key]) {
      this.modes[key] = this.getAttribute(`${this.attrs.mode}-${key}`);
    }
    if(!this.modes[key]) {
      if(!this.globalMode) {
        this.globalMode = this.getAttribute(this.attrs.mode);
      }
      return this.globalMode;
    }

    return this.modes[key];
  }

  bindEvents() {
    this.addEventListener("input", e => {
      let closest = e.target.closest(`[${this.attrs.bind}]`);
      if(closest) {
        this.applyFilterForElement(closest);
        requestAnimationFrame(() => {
          this.renderResultCount();
        });
      }
    }, false);
  }

  initFormElements(formElements) {
    for(let el of formElements) {
      let urlParamValues = this.getUrlFilterValues(el);
      for(let value of urlParamValues) {
        let type = el.getAttribute("type");
        if(el.tagName === "INPUT" && (type === "checkbox" || type === "radio")) {
          if(el.value === value) {
            el.checked = true;
          }
        } else {
          el.value = value;
        }
      }
    }
  }

  getFormElementKey(formElement) {
    return formElement.getAttribute(this.attrs.bind);
  }

  _getMap(key) {
    let values = [];
    for(let formElement of this.formElements[key]) {
      let type = formElement.getAttribute("type");
      if(formElement.tagName === "INPUT" && (type === "checkbox" || type === "radio")) {
        if(formElement.checked) {
          values.push(formElement.value);
        }
      } else {
        values.push(formElement.value);
      }
    }

    if(!this.hasAttribute(this.attrs.leaveUrlAlone)) {
      this.updateUrl(key, values);
    }

    let elementsSelectorAttr = this.getElementSelector(key);
    let selector = `:scope [${elementsSelectorAttr}]`;
    let elements = this.querySelectorAll(selector);

    let map = new Map();
    for(let element of Array.from(elements)) {
      let isValid = this.elementIsValid(element, elementsSelectorAttr, values);
      map.set(element, isValid)
    }
    return map;
  }

  _applyMapForKey(key, map) {
    if(!key) {
      return;
    }

    for(let [element, isVisible] of map) {
      let cls = `filter-${key}--hide`;
      if(isVisible) {
        element.classList.remove(cls);
      } else {
        element.classList.add(cls);
      }
    }
  }

  applyFilterForElement(formElement) {
    let key = this.getFormElementKey(formElement);
    this.applyFilterForKey(key);
  }

  applyFilterForKey(key) {
    let firstFormElementForDelimiter = this.formElements[key][0];
    if(!firstFormElementForDelimiter) {
      return;
    }
    let map = this._getMap(key);
    this._applyMapForKey(key, map);
  }

  _hasValue(needle, haystack = [], mode = "any") {
    if(!haystack || !haystack.length || !Array.isArray(haystack)) {
      return false;
    }

    if(!Array.isArray(needle)) {
      needle = [needle];
    }

    // all must match
    if(mode === "all") {
      let found = true;
      for(let lookingFor of haystack) {
        if(!needle.some((val) => val === lookingFor)) {
          found = false;
        }
      }
      return found;
    }

    for(let lookingFor of needle) {
      // has any, return true
      if(haystack.some((val) => val === lookingFor)) {
        return true;
      }
    }
    return false;
  }

  elementIsValid(element, attributeName, values) {
    let hasAttr = element.hasAttribute(attributeName);
    if(hasAttr && (!values.length || !values.join(""))) { // [] or [''] for value="" radio
      return true;
    }
    let haystack = (element.getAttribute(attributeName) || "").split(this.valueDelimiter);
    let key = this.getKeyFromAttributeName(attributeName);
    let mode = this.getFilterMode(key);
    if(hasAttr && this._hasValue(haystack, values, mode)) {
      return true;
    }
    return false;
  }

  /*
   * Feature: Result count
   */

  get resultsCounter() {
    if(!this._lookedFor.resultsCounter) {
      this._results = this.querySelector(`:scope [${this.attrs.results}]`);
      this._lookedFor.resultsCounter = true;
    }

    return this._results;
  }

  getGlobalCount() {
    let keys = this.getAllKeys();
    let selector = keys.map(key => {
      return `:scope [${this.getElementSelector(key)}]`;
    }).join(",");
    let elements = this.querySelectorAll(selector);

    return Array.from(elements)
      .filter(entry => this.elementIsVisible(entry))
      .filter(entry => !this.elementIsExcluded(entry))
      .length;
  }

  elementIsVisible(element) {
    for(let cls of element.classList) {
      if(cls.startsWith("filter-") && cls.endsWith("--hide")) {
        return false;
      }
    }
    return true;
  }

  elementIsExcluded(element) {
    return element.hasAttribute(this.attrs.resultsExclude);
  }

  getLabels() {
    if(this.resultsCounter) {
      let attrValue = this.resultsCounter.getAttribute(this.attrs.results);
      let split = attrValue.split("/");
      if(split.length === 2) {
        return split;
      }
    }
    return ["Result", "Results"];
  }

  _renderResultCount(count) {
    if(!this.resultsCounter) {
      return;
    }
    if(!count) {
      count = this.getGlobalCount();
    }

    let labels = this.getLabels();
    this.resultsCounter.innerText = `${count} ${count !== 1 ? labels[1] : labels[0]}`;
  }

  renderResultCount(isOnload = false) {
    if(!this.resultsCounter) {
      return;
    }

    if(!isOnload && this.resultsCounter.hasAttribute("aria-live")) {
      // This timeout helped VoiceOver
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this._renderResultCount()
      }, 250);
    } else {
      this._renderResultCount();
    }
  }

  /*
   * Feature: Work with URLs
   */

  getUrlSearchValue() {
    let s = window.location.search;
    if(s.startsWith("?")) {
      return s.substr(1);
    }
    return s;
  }

  getUrlFilterValues(formElement) {
    let params = new URLSearchParams(this.getUrlSearchValue());
    let key = this.getFormElementKey(formElement);
    return params.getAll(key);
  }

  // Future improvement: url updates currently once per key (we could group these into one)
  updateUrl(key, values) {
    let params = new URLSearchParams(this.getUrlSearchValue());
    let keyParamsStr = params.getAll(key).sort().join(",");
    let valuesStr = values.slice().sort().join(",");

    if(keyParamsStr !== valuesStr) {
      params.delete(key);
      for(let value of values) {
        if(value) { // ignore ""
          params.append(key, value);
        }
      }

      let baseUrl = window.location.pathname;
      history.replaceState({}, '', `${baseUrl}${params.toString().length > 0 ? `?${params}`: ""}` );
    }
  }
}

if("customElements" in window) {
  window.customElements.define("filter-container", FilterContainer);
}
class DetailsUtilsForceState {
	constructor(detail, options = {}) {
		this.options = Object.assign({
			closeClickOutside: false,		// can also be a media query str
			forceStateClose: false,			// can also be a media query str
			forceStateOpen: false,			// can also be a media query str
			closeEsc: false,						// can also be a media query str
			forceStateRestore: true,
		}, options);

		this.detail = detail;
		this.summary = detail.querySelector(":scope > summary");
		this._previousStates = {};
	}

	getMatchMedia(el, mq) {
		if(!el) return;
		if(mq && mq === true) {
			return {
				matches: true
			};
		}

		if(mq && "matchMedia" in window) {
			return window.matchMedia(mq);
		}
	}

	// warning: no error checking if the open/close media queries are configured wrong and overlap in weird ways
	init() {
		let openMatchMedia = this.getMatchMedia(this.detail, this.options.forceStateOpen);
		let closeMatchMedia = this.getMatchMedia(this.detail, this.options.forceStateClose);
		
		// When both force-close and force-open are valid, it toggles state
		if( openMatchMedia && openMatchMedia.matches && closeMatchMedia && closeMatchMedia.matches ) {
			this.setState(!this.detail.open);
		} else {
			if( openMatchMedia && openMatchMedia.matches ) {
				this.setState(true);
			}

			if( closeMatchMedia && closeMatchMedia.matches ) {
				this.setState(false);
			}
		}

		this.addListener(openMatchMedia, "for-open");
		this.addListener(closeMatchMedia, "for-close");
	}

	addListener(matchmedia, type) {
		if(!matchmedia || !("addListener" in matchmedia)) {
			return;
		}

		// Force stated based on force-open/force-close attribute value in a media query listener
		matchmedia.addListener(e => {
			if(e.matches) {
				this._previousStates[type] = this.detail.open;
				if(this.detail.open !== (type === "for-open")) {
					this.setState(type === "for-open");
				}
			} else {
				if(this.options.forceStateRestore && this._previousStates[type] !== undefined) {
					if(this.detail.open !== this._previousStates[type]) {
						this.setState(this._previousStates[type]);
					}
				}
			}
		});
	}


	toggle() {
		let clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true
		});
		this.summary.dispatchEvent(clickEvent);
	}

	triggerClickToClose() {
		if(this.summary && this.options.closeClickOutside) {
			this.toggle();
		}
	}

	setState(setOpen) {
		if( setOpen ) {
			this.detail.setAttribute("open", "open");
		} else {
			this.detail.removeAttribute("open");
		}
	}
}

class DetailsUtilsAnimateDetails {
	constructor(detail) {
		this.duration = {
			open: 200,
			close: 150
		};
		this.detail = detail;
		this.summary = this.detail.querySelector(":scope > summary");

		let contentTarget = this.detail.getAttribute("data-du-animate-target");
		if(contentTarget) {
			this.content = this.detail.closest(contentTarget);
		}

		if(!this.content) {
			this.content = this.summary.nextElementSibling;
		}
		if(!this.content) {
			// TODO wrap in an element?
			throw new Error("For now <details-utils> requires a child element for animation.");
		}

		this.summary.addEventListener("click", this.onclick.bind(this));
	}

	parseAnimationFrames(property, ...frames) {
		let keyframes = [];
		for(let frame of frames) {
			let obj = {};
			obj[property] = frame;
			keyframes.push(obj);
		}
		return keyframes;
	}

	getKeyframes(open) {
		let frames = this.parseAnimationFrames("maxHeight", "0px", `${this.getContentHeight()}px`);
		if(!open) {
			return frames.filter(() => true).reverse();
		}
		return frames;
	}

	getContentHeight() {
		if(this.contentHeight) {
			return this.contentHeight;
		}

		// make sure it’s open before we measure otherwise it will be 0
		if(this.detail.open) {
			this.contentHeight = this.content.offsetHeight;
			return this.contentHeight;
		}
	}

	animate(open, duration) {
		this.isPending = true;
		let frames = this.getKeyframes(open);
		this.animation = this.content.animate(frames, {
			duration,
			easing: "ease-out"
		});
		this.detail.classList.add("details-animating")

		this.animation.finished.catch(e => {}).finally(() => {
			this.isPending = false;
			this.detail.classList.remove("details-animating");
		});

		// close() has to wait to remove the [open] attribute manually until after the animation runs
		// open() doesn’t have to wait, it needs [open] added before it animates
		if(!open) {
			this.animation.finished.catch(e => {}).finally(() => {
				this.detail.removeAttribute("open");
			});
		}
	}

	open() {
		if(this.contentHeight) {
			this.animate(true, this.duration.open);
		} else {
			// must wait a frame if we haven’t cached the contentHeight
			requestAnimationFrame(() => this.animate(true, this.duration.open));
		}
	}

	close() {
		this.animate(false, this.duration.close);
	}

	useAnimation() {
		return "matchMedia" in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// happens before state change when toggling
	onclick(event) {
		// do nothing if the click is inside of a link
		if(event.target.closest("a[href]") || !this.useAnimation()) {
			return;
		}

		if(this.isPending) {
			if(this.animation) {
				this.animation.cancel();
			}
		} else if(this.detail.open) {
			// cancel the click because we want to wait to remove [open] until after the animation
			event.preventDefault();
			this.close();
		} else {
			this.open();
		}
	}
}

class DetailsUtils extends HTMLElement {
	constructor() {
		super();

		this.attrs = {
			animate: "animate",
			closeEsc: "close-esc",
			closeClickOutside: "close-click-outside",
			forceStateClose: "force-close",
			forceStateOpen: "force-open",
			forceStateRestore: "force-restore",
			toggleDocumentClass: "toggle-document-class",
			closeClickOutsideButton: "data-du-close-click",
		};

		this.options = {};

		this._connect();
	}

	getAttributeValue(name) {
		let value = this.getAttribute(name);
		if(value === undefined || value === "") {
			return true;
		} else if(value) {
			return value;
		}
		return false;
	}

	connectedCallback() {
		this._connect();
	}

	_connect() {
		if (this.children.length) {
			this._init();
			return;
		}

		// not yet available, watch it for init
		this._observer = new MutationObserver(this._init.bind(this));
		this._observer.observe(this, { childList: true });
	}

	_init() {
		if(this.initialized) {
			return;
		}
		this.initialized = true;

		this.options.closeClickOutside = this.getAttributeValue(this.attrs.closeClickOutside);
		this.options.closeEsc = this.getAttributeValue(this.attrs.closeEsc);
		this.options.forceStateClose = this.getAttributeValue(this.attrs.forceStateClose);
		this.options.forceStateOpen = this.getAttributeValue(this.attrs.forceStateOpen);
		this.options.forceStateRestore = this.getAttributeValue(this.attrs.forceStateRestore);

		// TODO support nesting <details-utils>
		let details = Array.from(this.querySelectorAll(`:scope details`));
		for(let detail of details) {
			// override initial state based on viewport (if needed)
			let fs = new DetailsUtilsForceState(detail, this.options);
			fs.init();

			if(this.hasAttribute(this.attrs.animate)) {
				// animate the menus
				new DetailsUtilsAnimateDetails(detail);
			}
		}

		this.bindCloseOnEsc(details);
		this.bindClickoutToClose(details);

		this.toggleDocumentClassName = this.getAttribute(this.attrs.toggleDocumentClass);
		if(this.toggleDocumentClassName) {
			this.bindToggleDocumentClass(details);
		}
	}

	bindCloseOnEsc(details) {
		if(!this.options.closeEsc) {
			return;
		}

		document.documentElement.addEventListener("keydown", event => {
			if(event.keyCode === 27) {
				for(let detail of details) {
					if (detail.open) {
						let fs = new DetailsUtilsForceState(detail, this.options);
						let mm = fs.getMatchMedia(detail, this.options.closeEsc);
						if(!mm || mm && mm.matches) {
							fs.toggle();
						}
					}
				}
			}
		}, false);
	}

	isChildOfParent(target, parent) {
		while(target && target.parentNode) {
			if(target.parentNode === parent) {
				return true;
			}
			target = target.parentNode;
		}
		return false;
	}

	onClickoutToClose(detail, event) {
		let fs = new DetailsUtilsForceState(detail, this.options);
		let mm = fs.getMatchMedia(detail, this.options.closeClickOutside);
		if(mm && !mm.matches) {
			// don’t close if has a media query but it doesn’t match current viewport size
			// useful for viewport navigation that must stay open (e.g. list of horizontal links)
			return;
		}

		let isCloseButton = event.target.hasAttribute(this.attrs.closeClickOutsideButton);
		if((isCloseButton || !this.isChildOfParent(event.target, detail)) && detail.open) {
			fs.triggerClickToClose(detail);
		}
	}

	bindClickoutToClose(details) {
		// Note: Scoped to document
		document.documentElement.addEventListener("mousedown", event => {
			for(let detail of details) {
				this.onClickoutToClose(detail, event);
			}
		}, false);

		// Note: Scoped to this element only
		this.addEventListener("keypress", event => {
			if(event.which === 13 || event.which === 32) { // enter, space
				for(let detail of details) {
					this.onClickoutToClose(detail, event);
				}
			}
		}, false);
	}

	bindToggleDocumentClass(details) {
		for(let detail of details) {
			detail.addEventListener("toggle", (event) => {
				document.documentElement.classList.toggle( this.toggleDocumentClassName, event.target.open );
			});
		}
	}
}

if(typeof window !== "undefined" && ("customElements" in window)) {
	window.customElements.define("details-utils", DetailsUtils);
}

