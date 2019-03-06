const {
  overrideWarning,
  loadGetters,
  loadSetters,
  loadStatics,
  loadPrototypes,
  loadExternalMethods
} = require('../lib');

const Model = {
  prototype: {
    // sequelize Model.prototype props
    _customGetters: {},
    _customSetters: {},
    _hasCustomGetters: 0,
    _hasCustomSetters: 0,
  },
};

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
  test('loads Model getter methods, increments prototype._hasCustomGetters', () => {
    const modelMock = { ...Model };
    const getterMethods = { ...methods.getterMethods };

    loadGetters(modelMock, getterMethods);
    expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    expect(modelMock.prototype._hasCustomGetters).toBe(1);
  });

  test('merges with existing Model getter methods, increments prototype._hasCustomGetters', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { _customGetters: { otherName: existingDef }, _hasCustomGetters: 1 } };
    const getterMethods = { ...methods.getterMethods };

    loadGetters(modelMock, getterMethods);
    expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
    expect(modelMock.prototype._customGetters.otherName).toBe(existingDef);
    expect(modelMock.prototype._hasCustomGetters).toBe(2);
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { _customGetters: { getterName: existingDef }, _hasCustomGetters: 1 } };
    const getterMethods = { ...methods.getterMethods };
    
    afterEach(() => jest.clearAllMocks());

    test('emits console.warn, does not increment prototype._hasCustomGetters', () => {
      loadGetters(modelMock, getterMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('getterMethods', 'getterName'));
      expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
      expect(modelMock.prototype._hasCustomGetters).toBe(1);
    });

    test('warn = false: does not emit console.warn, does not increment prototype._hasCustomGetters', () => {
      loadGetters(modelMock, getterMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.prototype._customGetters.getterName).toBe(methodDef);
      expect(modelMock.prototype._hasCustomGetters).toBe(1);
    });
  });
});

describe('loadSetters: loads setterMethods onto a Model', () => {
  test('loads Model setter methods, increments prototype._hasCustomSetters', () => {
    const modelMock = { ...Model };
    const setterMethods = { ...methods.setterMethods };

    loadSetters(modelMock, setterMethods);
    expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    expect(modelMock.prototype._hasCustomSetters).toBe(1);
  });

  test('merges with existing Model setter methods, increments prototype._hasCustomSetters', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { _customSetters: { otherName: existingDef }, _hasCustomSetters: 1 } };
    const setterMethods = { ...methods.setterMethods };

    loadSetters(modelMock, setterMethods);
    expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
    expect(modelMock.prototype._customSetters.otherName).toBe(existingDef);
    expect(modelMock.prototype._hasCustomSetters).toBe(2);
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { _customSetters: { setterName: existingDef }, _hasCustomSetters: 1 } };
    const setterMethods = { ...methods.setterMethods };
    
    afterEach(() => jest.clearAllMocks());

    test('emits console.warn, does not increment prototype._hasCustomSetters', () => {
      loadSetters(modelMock, setterMethods);
      expect(consoleWarnSpy).toBeCalledWith(overrideWarning('setterMethods', 'setterName'));
      expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
      expect(modelMock.prototype._hasCustomSetters).toBe(1);
    });

    test('warn = false: does not emit console.warn, does not increment prototype._hasCustomSetters', () => {
      loadSetters(modelMock, setterMethods, false);
      expect(consoleWarnSpy).not.toBeCalled();
      expect(modelMock.prototype._customSetters.setterName).toBe(methodDef);
      expect(modelMock.prototype._hasCustomSetters).toBe(1);
    });
  });
});

describe('loadPrototypes: loads prototype methods onto a Model', () => {
  test('loads Model prototype methods', () => {
    const modelMock = { ...Model };
    const prototypeMethods = { ...methods.prototypeMethods };

    loadPrototypes(modelMock, prototypeMethods);
    expect(modelMock.prototype.prototypeName).toBe(methodDef);
  });

  test('merges with existing Model prototype methods', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { otherName: existingDef } };
    const prototypeMethods = { ...methods.prototypeMethods };

    loadPrototypes(modelMock, prototypeMethods);
    expect(modelMock.prototype.prototypeName).toBe(methodDef);
    expect(modelMock.prototype.otherName).toBe(existingDef);
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const modelMock = { prototype: { prototypeName: existingDef } };
    const prototypeMethods = { ...methods.prototypeMethods };
    
    afterEach(() => jest.clearAllMocks());

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
    const modelMock = { ...Model };
    const staticMethods = { ...methods.staticMethods };

    loadStatics(modelMock, staticMethods);
    expect(modelMock.staticName).toBe(methodDef);
  });

  test('merges with existing Model static methods', () => {
    const existingDef = 'existingDef';
    const modelMock = { otherName: existingDef };
    const staticMethods = { ...methods.staticMethods };

    loadStatics(modelMock, staticMethods);
    expect(modelMock.staticName).toBe(methodDef);
    expect(modelMock.otherName).toBe(existingDef);
  });

  describe('method overriding behavior', () => {
    const existingDef = 'existingDef';
    const modelMock = { staticName: existingDef };
    const staticMethods = { ...methods.staticMethods };
    
    afterEach(() => jest.clearAllMocks());

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
  const modelMock = JSON.parse(JSON.stringify(Model)); // prevent mutation of referenced sub-property objects!
  const methodsMock = { ...methods };
  
  afterEach(() => jest.clearAllMocks());
  beforeAll(() => loadExternalMethods(modelMock, methodsMock));

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
    });

    test('warn = false: does not emit console.warn', () => {
      loadExternalMethods(modelMock, { staticMethods: { staticName: 'new val' } }, false);
      expect(consoleWarnSpy).not.toBeCalled();
    });
  });
});
