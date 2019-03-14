/**
 * Creates a warning message for an overridden method
 * - used when a Model method is overridden during loading
 * - issued by console.warn()
 * - shape: Existing [<location>] method [<method name>] overridden by loadExternalMethods
 * - locations: getterMethods, setterMethods, prototype, static
 * @param {string} location Model location of method
 * @param {string} methodName method that has been overridden
 * @returns {string} method override warning message
 * @example
 * // static method findById overridden
 * // output: Existing [static] method [findById] overridden by loadExternalMethods
 */
const overrideWarning = (location, methodName) =>
  `Existing [${location}] method [${methodName}] overridden by loadExternalMethods`;

/**
 * Loads virtual getter methods onto the Model
 * - same as setting in model options.getterMethods of sequelize.define()
 *  - merges with any methods defined in options.getterMethods
 * - emits console.warn if a getter method is overridden during merging
 *  - disable with warn false (default - true)
 * - mutates:
 *  - Model.prototype._customGetters (merges with each method from getterMethods arg)
 *  - Model.prototype._hasCustomGetters (increments for each non-override method added)
 * @param {object} Model Model to add prototype getter methods
 * @param {object} getterMethods { methodName: function() { ... }, ... }
 * @param {boolean} warn [true] set false to suppress merge override warning
 */
const loadGetters = (Model, getterMethods, warn = true) => {
  for (const getterName of Object.keys(getterMethods)) {
    const methodWillOverride = getterName in Model.prototype._customGetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('getterMethods', getterName));
    }
  }
  Model.options.getterMethods = {
    ...Model.options.getterMethods,
    ...getterMethods,
  };
  Model.refreshAttributes();
};

/**
 * Loads virtual setter methods onto the Model
 * - same as setting in options.setterMethods of sequelize.define()
 *  - merges with any methods defined in options.setterMethods
 * - emits console.warn if a setter method is overridden during merging
 *  - disable with warn false (default - true)
 * - mutates:
 *  - Model.prototype._customSetters (merges with each method from setterMethods arg)
 *  - Model.prototype._hasCustomSetters (increments for each non-override method added)
 * @param {object} Model Model to add prototype setter methods
 * @param {object} setterMethods { methodName: function() { ... }, ... }
 * @param {boolean} warn [true] set false to suppress merge override warning
 */
const loadSetters = (Model, setterMethods, warn = true) => {
  for (const setterName of Object.keys(setterMethods)) {
    const methodWillOverride = setterName in Model.prototype._customSetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('setterMethods', setterName));
    }
  }
  Model.options.setterMethods = {
    ...Model.options.setterMethods,
    ...setterMethods,
  };
  Model.refreshAttributes();
};

/**
 * Loads prototype (instance) methods onto the Model
 * - merges with any methods defined in Model.prototype
 * - emits console.warn if a prototype method is overridden during merging
 *  - disable with warn false (default - true)
 * - mutates:
 *  - Model.prototype (merges with each method from prototypeMethods arg)
 * @param {object} Model Model to add prototype methods
 * @param {object} prototypeMethods { methodName: function() { ... }, ... }
 * @param {boolean} warn [true] set false to suppress merge override warning
 */
const loadPrototypes = (Model, prototypeMethods, warn = true) => {
  for (const [prototypeName, method] of Object.entries(prototypeMethods)) {
    if (prototypeName in Model.prototype) {
      warn && console.warn(overrideWarning('prototype', prototypeName));
    }
    Object.defineProperty(Model.prototype, prototypeName, { value: method });
  }
};

/**
 * Loads static methods onto the Model
 * - merges with any methods defined directly on Model
 * - emits console.warn if a static method is overridden during merging
 *  - disable with warn false (default - true)
 * - mutates:
 *  - Model (merges)
 * @param {object} Model Model to add static methods
 * @param {object} staticMethods { methodName: function() { ... }, ... }
 * @param {boolean} warn [true] set false to suppress merge override warning
 */
const loadStatics = (Model, staticMethods, warn = true) => {
  for (const [staticName, method] of Object.entries(staticMethods)) {
    if (staticName in Model) {
      warn && console.warn(overrideWarning('static', staticName));
    }
    Model[staticName] = method;
  }
};

/**
 * Loads externally defined methods onto the Model
 * - ! mutates Model object !
 * - issues console warning if a method is overridden during merging
 * - merging behavior
 *   - methods.staticMethods merged directly onto Model
 *   - methods.prototypeMethods merged with Model.prototype
 *   - methods.getterMethods merged with options.getterMethods
 *   - methods.setterMethods merged with options.setterMethods
 *    - options are Model options, 3rd arg in sequelize.define() [see example]
 * @param {object} Model Model object to load methods into
 * @param {object} methods externally defined methods
 * @param {object} methods.staticMethods Model (static) methods
 * @param {object} methods.getterMethods getter (instance) methods
 * @param {object} methods.setterMethods setter (instance) methods
 * @param {object} methods.prototypeMethods prototype (instance) methods
 * @param {boolean} warn [default = true] emit console warning on method override
 * @example
 * const Model = sequelize.define(
 *  'ModelName',
 *  { ...columnDefs },
 *  { ...options, getterMethods: {}, setterMethods: {} },
 * );
 */
const loadExternalMethods = (Model, methods, warn = true) => {
  const {
    staticMethods = {},
    getterMethods = {},
    setterMethods = {},
    prototypeMethods = {},
  } = methods;

  // -- GETTERS (INSTANCE) -- //
  loadGetters(Model, getterMethods, warn);

  // -- SETTERS (INSTANCE) -- //
  loadSetters(Model, setterMethods, warn);

  // -- PROTOTYPE (INSTANCE) -- //
  loadPrototypes(Model, prototypeMethods, warn);

  // -- STATICS (MODEL) -- //
  loadStatics(Model, staticMethods, warn);
};

module.exports = {
  overrideWarning,
  loadGetters,
  loadSetters,
  loadPrototypes,
  loadStatics,
  loadExternalMethods,
};
