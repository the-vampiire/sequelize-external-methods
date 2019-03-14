const Sequelize = require('sequelize');
const {
  overrideWarning,
  loadGetters,
  loadSetters,
  loadStatics,
  loadPrototypes,
  loadExternalMethods
} = require('../lib');

// dialect required for instantiation but util works across all dialects
const sequelize = new Sequelize({ dialect: 'postgres' });

const methodDef = 'methodDef';
const methods = {
  staticMethods: { staticName: methodDef },
  getterMethods: { getterName: methodDef },
  setterMethods: { setterName: methodDef },
  prototypeMethods: { prototypeName: methodDef },
};

const consoleWarnSpy = jest.spyOn(global.console, 'warn');

describe('overrideWarning: produces a warning message when a method is overridden during loading', () => {
  const location = 'STATIC';
  const methodName = 'existingMethod';

  test('returns: Existing [<location>] method [<method name>] overridden by loadExternalMethods', () => {
    const output = overrideWarning(location, methodName);
    const expected = `Existing [${location}] method [${methodName}] overridden by loadExternalMethods`;
    expect(output).toBe(expected);
  });
});

describe('loadGetters: loads getterMethods onto a Model', () => {
  test('loads Model getter methods', () => {
    const modelMock = sequelize.define('Model');
    const getterMethods = { ...methods.getterMethods };

    loadGetters(modelMock, getterMethods);
    expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    expect(modelMock.prototype._hasCustomGetters).toBe(1);

    delete sequelize.models.Model;
  });

  test('merges with existing Model getter methods', () => {
    const existingDef = 'existingDef';
    const getterMethods = { ...methods.getterMethods };
    modelMock = sequelize.define('Model', {}, { getterMethods: { otherName: existingDef }});

    loadGetters(modelMock, getterMethods);
    expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    expect(modelMock.prototype._customGetters.otherName).toBe(existingDef);
    expect(modelMock.prototype._hasCustomGetters).toBe(2);

    delete sequelize.models.Model;
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const getterMethods = { ...methods.getterMethods };
    modelMock = sequelize.define('Model', {}, { getterMethods: { getterName: existingDef }});
    afterEach(() => jest.clearAllMocks());
    afterAll(() => { delete sequelize.models.Model; });

    test('emits console.warn', () => {
      loadGetters(modelMock, getterMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('getterMethods', 'getterName'));
      expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    });

    test('warn = false: does not emit console.warn', () => {
      loadGetters(modelMock, getterMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    });
  });
});

describe('loadSetters: loads setterMethods onto a Model', () => {
  test('loads Model setter methods', () => {
    const modelMock = sequelize.define('Model');
    const setterMethods = { ...methods.setterMethods };

    loadSetters(modelMock, setterMethods);
    expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    expect(modelMock.prototype._hasCustomSetters).toBe(1);

    delete sequelize.models.Model;
  });

  test('merges with existing Model setter methods', () => {
    const existingDef = 'existingDef';
    const setterMethods = { ...methods.setterMethods };
    modelMock = sequelize.define('Model', {}, { setterMethods: { otherName: existingDef }});

    loadSetters(modelMock, setterMethods);
    expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    expect(modelMock.prototype._customSetters.otherName).toBe(existingDef);
    expect(modelMock.prototype._hasCustomSetters).toBe(2);

    delete sequelize.models.Model;
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const setterMethods = { ...methods.setterMethods };
    modelMock = sequelize.define('Model', {}, { setterMethods: { setterName: existingDef }});
    afterEach(() => jest.clearAllMocks());
    afterAll(() => { delete sequelize.models.Model; });

    test('emits console.warn', () => {
      loadSetters(modelMock, setterMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('setterMethods', 'setterName'));
      expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    });

    test('warn = false: does not emit console.warn', () => {
      loadSetters(modelMock, setterMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    });
  });
});

describe('loadPrototypes: loads prototype methods onto a Model', () => {
  test('loads Model prototype methods', () => {
    const modelMock = sequelize.define('Model');
    const prototypeMethods = { ...methods.prototypeMethods };

    loadPrototypes(modelMock, prototypeMethods);
    expect(modelMock.prototype.prototypeName).toBe(methodDef);

    delete sequelize.models.Model;
  });

  test('merges with existing Model prototype methods', () => {
    const existingDef = 'existingDef';
    const prototypeMethods = { ...methods.prototypeMethods };

    const modelMock = sequelize.define('Model');
    modelMock.prototype.otherName = existingDef;

    loadPrototypes(modelMock, prototypeMethods);
    expect(modelMock.prototype.prototypeName).toBe(methodDef);
    expect(modelMock.prototype.otherName).toBe(existingDef);

    delete sequelize.models.Model;
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const prototypeMethods = { ...methods.prototypeMethods };
    
    const modelMock = sequelize.define('Model');
    modelMock.prototype.prototypeName = existingDef;
    
    afterEach(() => jest.clearAllMocks());
    afterAll(() => { delete sequelize.models.Model; });

    test('emits console.warn', () => {
      loadPrototypes(modelMock, prototypeMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('prototype', 'prototypeName'));
      expect(modelMock.prototype.prototypeName).toBe(methodDef);
    });

    test('warn = false: does not emit console.warn', () => {
      loadPrototypes(modelMock, prototypeMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.prototype.prototypeName).toBe(methodDef);
    });
  });
});

describe('loadStatics: loads static methods onto a Model', () => {
  test('loads Model static methods', () => {
    const modelMock = sequelize.define('Model');
    const staticMethods = { ...methods.staticMethods };

    loadStatics(modelMock, staticMethods);
    expect(modelMock.staticName).toBe(methodDef);

    delete sequelize.models.Model;
  });

  test('merges with existing Model static methods', () => {
    const existingDef = 'existingDef';
    const staticMethods = { ...methods.staticMethods };

    const modelMock = sequelize.define('Model');
    modelMock.otherName = existingDef;

    loadStatics(modelMock, staticMethods);
    expect(modelMock.staticName).toBe(methodDef);
    expect(modelMock.otherName).toBe(existingDef);

    delete sequelize.models.Model;
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const staticMethods = { ...methods.staticMethods };

    const modelMock = sequelize.define('Model');
    modelMock.staticName = existingDef;
    
    afterEach(() => jest.clearAllMocks());
    afterAll(() => { delete sequelize.models.Model; });

    test('emits console.warn', () => {
      loadStatics(modelMock, staticMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('static', 'staticName'));
      expect(modelMock.staticName).toBe(methodDef);
    });

    test('warn = false: does not emit console.warn', () => {
      loadStatics(modelMock, staticMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.staticName).toBe(methodDef);
    });
  });
});

describe('loadExternalMethods: loads external getter, setter, prototype, and static methods onto a Model', () => {
  const modelMock = sequelize.define('Model');
  
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => loadExternalMethods(modelMock, methods));

  test('loads Model static methods', () => {
    expect(modelMock.staticName).toBe(methodDef);
  });

  test('loads instance getter methods', () => {
    expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
  });

  test('loads instance setter methods', () => {
    expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
  });

  test('loads instance prototype methods', () => {
    expect(modelMock.prototype.prototypeName).toBe(methodDef);
  });

  describe('merging override behavior', () => {
    test('emits console.warn', () => {
      loadExternalMethods(modelMock, { staticMethods: { staticName: 'new val' } });
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('static', 'staticName'));
      expect(modelMock.staticName).toBe('new val');
    });

    test('warn = false: does not emit console.warn', () => {
      loadExternalMethods(modelMock, { staticMethods: { staticName: 'final val' } }, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.staticName).toBe('final val');
    });
  });
});
