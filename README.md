# sequelize-external-methods
- Utilities for defining Model methods (proto, getter, setter, static) external to the Model definition file.
- Defining methods externally helps clean up the Model definition
- Defining methods externally helps make testing easier as each method is independent of Sequelize / a Model so its dependency on them can be easily mocked

Cut to the chase and see an example usage [in the example/ directory](/example)

## How to define Sequelize models as directories instead of files
- A predicate to defining external methods (while keeping the code organized) is to keep Model and method definitions in a directory rather than a single file
- To do this requires a slight modification to the default (`sequelize init`) `models/index.js` file
- This modification is backwards compatible and supports both Model files and directories
  - A model directory should have its name as the Model and its Model definition exported in its `index.js` file

`models/index.js`
```js
'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';
var config     = require(__dirname + '/../config/config.js')[env];
var db        = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => file !== basename)
  .forEach(file => {
    const isDirectory = file.slice(-3) !== '.js';
    const importPath = isDirectory ? [__dirname, file, 'index.js'] : [__dirname, file];
    
    var model = sequelize['import'](path.join(...importPath));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

Here is the modified portion if you want to add it to a `models/index.js` exporter that you have already customized by other means:

```js
fs
  .readdirSync(__dirname)
  .filter(file => file !== basename)
  .forEach(file => {
    const isDirectory = file.slice(-3) !== '.js';
    const importPath = isDirectory ? [__dirname, file, 'index.js'] : [__dirname, file];
    
    var model = sequelize['import'](path.join(...importPath));
    db[model.name] = model;
  });
```

### Example
Say we have the follow structure to our `models/` dir:
- our `user.js` file holds the User Model definition (standard practice)
- our `payment/` dir holds its Payment Model definition in its underlying `payment/index.js` file
- using the modified `models/index.js` file above - both model definitions are correctly loaded

```sh
/models
  index.js <--- modified version (above)
  user.js <--- standard Model def file
  payment/
    index.js <--- directory based Model def file
    methods/ <--- directory to compartmentalize methods from the Model def
      index.js
```

## Defining external methods
Using the modified `models/` structure and `models/index.js` loader file we can move onto defining our Model methods externally.
- note that the naming convention of the external method file names is completely arbitrary
  - I organize them this way so it's easy to isolate methods by Model name and purpose
- the only important part that requires a naming convention are the exports from `methods/index.js` (detailed below)

```sh
/models
  index.js <--- modified version (above)
  user.js <--- standard Model def file
  payment/
    index.js <--- directory based Model def file
    methods/ <--- directory to compartmentalize methods from the Model def
      index.js <--- collects and exports method definitions
      payment.statics.js
      payment.getters.js
      payment.setters.js
      payment.prototypes.js
      tests/ <--- testing dir
        payment.statics.test.js <--- corresponding method def testing files
        payment.getters.test.js
        payment.setters.test.js
        payment.prototypes.test.js
```

**To use the `loadExternalMethods` utility from this package you must export the method objects with these exact names**
- the file name(s) and method names in their exported objects are arbitrary
- all that is required is that each method file exports an object with named methods inside of it

You can include / exclude any of the named method objects. Whichever ones are exported from `methods/index.js` will be loaded onto the Model by `loadExternalMethods`.

`models/modelName/methods/index.js`
```js
const staticMethods = require('');
const getterMethods = require('');
const setterMethods = require('');
const prototypeMethods = require('');

module.exports = {
  staticMethods,
  getterMethods,
  setterMethods,
  prototypeMethods,
};
```

Method Objects
- `staticMethods`: loaded directly onto the Model def (**static methods**)
  - accessing the method: `Model.staticMethodName`
  - Sequelize equivalent: `Model.staticMethodName = function() {...}`
- `prototypeMethods`: loaded into the Model.prototype (**instance methods**)
  - accessing the method: `modelInstance.prototypeMethodName`
  - Sequelize equivalent: `Model.prototype.prototypeMethodName = function() {...}`
- `getterMethods`: loaded into the Model def `getterMethods` (**instance methods**)
  - these are standard property getters / virtual getters
  - they are defined as methods but used as normal properties to get property values
  - note: these are accessed as properties on the instance
  - accessing the "method" (get property value): `modelInstance.getterMethodName`
- `setterMethods`: loaded into the Model def `setterMethods`. (**instance methods**) 
  - these are standard property seters / virtual setters
  - they are defined as methods but used as normal properties to set property values
  - note: these are accessed as properties on the instance
  - accessing the "method" (set property value): `modelInstance.setterMethodName = someNewValue`

Sequelize equivalent for `getter`/`setterMethods`:
- [read about getters/setters here](http://docs.sequelizejs.com/manual/tutorial/models-definition.html#getters-setters)

`models/modelName/index.js`
```js
module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    'Model',
    { ...attributes },
    {
      ...options,
      getterMethods: {
        getterMethodName: function() {...}
      },
      setterMethods: {
        setterMethodName: function() {...}
      }
    }
  );
}
```

### Backwards compatibility
You can still define methods directly on the Model following standard Sequelize syntax (see equivalents above). Or you can mix and match to leave shorter methods defined directly and more complex methods / methods you are migrating out of the Model def in external files.
- `loadExternalMethods` will merge with whatever methods exist on the Model at the time of calling
- if there is a naming conflict between a pre-defined method and an externally-loaded method a `console.warn` message will be emitted
  - warning shape: `Existing [<location>] method [<method name>] overridden by loadExternalMethods`
  - possible `location` values: `getterMethods, setterMethods, prototype, static`
- recommended: call `loadExternalMethods` at the end of the Model def file to ensure warnings are provided for naming conflicts

`models/modelName/index.js`
```js
const methods = require('./methods'); // { staticMethods, prototypeMethods, ... }
const { loadExternalMethods } = require('sequelize-external-methods');

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    'Model',
    { ...attributes },
    {
      ...options,
      getterMethods: { // optionally define using standard Sequelize syntax
        getterMethodName: function() {...}
      },
      setterMethods: { // optionally define using standard Sequelize syntax
        setterMethodName: function() {...}
      }
    }
  );

  // optionally define other method definitions / associations up here

  // last call before returning the Model def to ensure warnings are emitted for naming conflicts
  loadExternalMethods(Model, methods);

  // or to suppress override warnings (for whatever insane reason you have)
  loadExternalMethods(Model, methods, false);
  return Model;
}
```

# `loadExternalMethods` and utilities
I actually don't know how to publish a package yet so here are the actual utility functions lol. Or you can clone the `lib/index.js` file. They have all been tested in the `/tests/` dir if you want to see more about their usage (beyond the included JSDocs). 

You can use them individually but the recommended usage is with `loadExternalMethods` itself since you can load as many or as few external methods as you'd like with it.

## Usage
Follow the examples above on structuring and exporting the method objects. Then in the Model definition import the utility. As explained above you can mix and match Sequelize and externally defined methods. Below is an example of the simplest usage:

```js
const methods = require('./methods'); // { staticMethods, prototypeMethods, ... }
const { loadExternalMethods } = require('sequelize-external-methods');

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    'Model',
    { ...attributes },
    { ...options },
  );

  loadExternalMethods(Model, methods);

  return Model;
}
```

### Technical details
Sequelize converts `options.getterMethods` and `options.setterMethods` from the `sequelize.define(name, attributes, options)` call in special sub-properties of the Model prototype object. I only know this because I'm insane and insisted on getting this to work - their docs nor code lists this anywhere.

`options.getterMethods`
- stored in `Model.prototype._customGetters`
- counted by `Model.prototype._hasCustomGetters`

`options.setterMethods`
- stored in `Model.prototype._customSetters`
- counted by `Model.prototype._hasCustomSetters`

`loadGetters`, `loadSetters`, and the composer function `loadExternalMethods` takes care of managing the loading locations and counters automatically.

### Utilities

`loadExternalMethods`
```js
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
```

`loadGetters`
```js
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
  for (const [getterName, method] of Object.entries(getterMethods)) {
    const methodWillOverride = getterName in Model.prototype._customGetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('getterMethods', getterName));
    }
    
    Model.prototype._customGetters[getterName] = method;
    if (!methodWillOverride) ++Model.prototype._hasCustomGetters;
  }
};
```

`loadSetters`
```js
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
  for (const [setterName, method] of Object.entries(setterMethods)) {
    const methodWillOverride = setterName in Model.prototype._customSetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('setterMethods', setterName));
    }

    Model.prototype._customSetters[setterName] = method;
    if (!methodWillOverride) ++Model.prototype._hasCustomSetters;
  }
};
```

`loadStatics`
```js
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
}
```

`loadPrototypes`
```js
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
    Model.prototype[prototypeName] = method;
  }
}
```

`overrideWarning`
```js
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
const overrideWarning = (
  location,
  methodName,
) => `Existing [${location}] method [${methodName}] overridden by loadExternalMethods`;
```

