# sequelize-external-methods
- Utilities for defining Model methods (proto, getter, setter, static) external to the Model definition file.
  - helps clean up the Model definition file
  - helps make testing easier as each method is independent of Sequelize / a Model so its dependency on them can be easily mocked

# Usage
Cut to the chase and see a complete example usage [in the example/ directory](https://github.com/the-vampiire/sequelize-external-methods/tree/master/example) or follow the directions below:

- Define your methods in an external directory
  - You can define these directory(ies) anywhere you'd like. But I recommend you use the pattern [directory based Models](#How%20to%20define%20Sequelize%20models%20as%20directories%20instead%20of%20files) to have Model directories with `methods/` holding the methods for that model.
    - note: to use directory based Models requires a slightly modified `models/index.js` exporter file [see here](#How%20to%20define%20Sequelize%20models%20as%20directories%20instead%20of%20files)
  - You can name the method files anything you'd like
  - You can name the methods themselves anything you'd like

```sh
/models
  index.js <--- modified Sequelize Models exporter (above)
  user.js <--- standard Model def file
  payment/
    index.js <--- directory based Model def file
    methods/ <--- directory to compartmentalize methods from the Model def
      index.js <--- collects and exports Named Method Objects
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

- export the methods as [Named Method Objects](#Named%20Method%20Objects) from `models/index.js`
  - **they must be exported as Named Method Objects!**

`/methods/static-methods.js`
```js
// example of static methods
function doAStaticThing() {
  //
}

module.exports = {
  doAStaticThing,
};
```

`/methods/index.js`
```js
const staticMethods = require('./static-methods');
// other Named Method Objects here

module.exports = {
  staticMethods,
  // export any other Named Method Objects
};
```

- import the externally defined methods and the `loadExternalMethods` utility into your Model file
  - **note** call `loadExternalMethods(Model, methods);` _at the end of the model file_, just before the `return Model;`
    - this ensures that `console.warn` messages are emitted if any methods get overridden (in the case of mixing external and classic method definitions)

```js
const methods = require('./methods'); // { staticMethods, prototypeMethods, ... }
const { loadExternalMethods } = require('sequelize-external-methods');

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    'Model',
    { ...attributes },
    { ...options },
  );

  // associations

  // other method definitions

  loadExternalMethods(Model, methods);
  // suppress warnings: loadExternalMethods(Model, methods, false);

  return Model;
}
```

## Requirements
To use the `loadExternalMethods` utility from this package you must export the **[Named Method Objects](#Named%20Method%20Objects) from `methods/index.js`**
- the file name(s) and method names in their exported objects are arbitrary
- all that is required is that each method file exports an object with method definitions inside of it

You can include / exclude any of the Named Method Objects. Whichever ones are exported from `methods/index.js` will be loaded onto the Model by `loadExternalMethods`.

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

### Named Method Objects
- `staticMethods`: loaded directly onto the Model def (**static methods**)
  - accessing the method: `Model.staticMethodName`
  - Sequelize equivalent: `Model.staticMethodName = function() {...}`
- `prototypeMethods`: loaded into the Model.prototype (**instance methods**)
  - accessing the method: `modelInstance.prototypeMethodName`
  - Sequelize equivalent: `Model.prototype.prototypeMethodName = function() {...}`
- `getterMethods`: loaded into the Model def `getterMethods` (**instance methods**)
  - these are standard property getters / virtual getters
  - note: these are accessed as properties on the instance
  - accessing the "method" (get property value): `modelInstance.getterMethodName`
- `setterMethods`: loaded into the Model def `setterMethods`. (**instance methods**) 
  - these are standard property seters / virtual setters
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

## Backwards compatibility
You can still define methods directly on the Model following standard Sequelize syntax (see equivalents above). Or you can mix and match external with standard definitions.
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

# How to define Sequelize models as directories instead of files
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

## Example
Say we have the follow structure to our `models/` dir:
- our `user.js` file holds the User Model definition (standard practice)
- our `payment/` dir holds its Payment Model definition in its underlying `payment/index.js` file
- using the modified `models/index.js` file above - both model definitions are correctly loaded

```sh
/models
  index.js <--- modified Sequelize Models exporter (above)
  user.js <--- standard Model def file
  payment/
    index.js <--- directory based Model def file
    methods/ <--- directory to compartmentalize methods from the Model def
      index.js
```

# `loadExternalMethods` and utilities
You can use them individually but the recommended usage is with `loadExternalMethods` itself since you can load as many or as few external methods as you'd like with it. Whatever Named Method Objects it receives will be loaded onto the target Model. If you choose to only load a specific set you can use the following utilities.

## Utilities
`loadGetters`: only loads (instance) `getterMethods`
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
  for (const getterName of Object.keys(getterMethods)) {
    const methodWillOverride = getterName in Model.prototype._customGetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('getterMethods', getterName));
    }
  }
  Model.options.getterMethods = { ...Model.options.getterMethods, ...getterMethods };
  Model.refreshAttributes();
};
```

`loadSetters`: only loads (instance) `setterMethods`
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
  for (const setterName of Object.keys(setterMethods)) {
    const methodWillOverride = setterName in Model.prototype._customSetters;
    if (methodWillOverride) {
      warn && console.warn(overrideWarning('setterMethods', setterName));
    }
  }
  Model.options.setterMethods = { ...Model.options.setterMethods, ...setterMethods };
  Model.refreshAttributes();
};
```

`loadStatics`: only loads `static` (Model) methods
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

`loadPrototypes`: only loads `prototype` (instance) methods
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
    Object.defineProperty(Model.prototype, prototypeName, {
      value: method,
      enumerable: true,
    });
  }
}
```
