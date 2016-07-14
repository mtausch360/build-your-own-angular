import {setupModuleLoader} from '../src/loader';
import {createInjector} from '../src/injector';

describe('injector', ()=>{

  beforeEach(()=>{
    delete window.angular;
    setupModuleLoader(window);
  });

  it('can be created', ()=>{
    var injector = createInjector([]);
    expect(injector).toBeDefined();
  });

  //registering a constant
  it('has a constant that has been registered to a module', ()=>{
    var module = window.angular.module('myModule', []);
    module.constant('aConstant', 42);
    var injector = createInjector(['myModule']);
    expect(injector.has('aConstant')).toBe(true);
  });

  it('does not have a constant that is not there', ()=>{
    var module = window.angular.module('myMod', []);
    var injector = createInjector(['myMod']);
    expect(injector.has('aConstant')).toBe(false);
  });

  it('does not allow a constant called hasOwnProperty', ()=>{
    let module = window.angular.module('myMod', []);
    module.constant('hasOwnProperty', false);
    expect(()=>{
      createInjector(['myMod']);
    }).toThrow();
  });

  it('can return a registered constant', ()=>{
    var module = window.angular.module('myMod', []);
    module.constant('it', 42);
    var injector = createInjector(['myMod']);
    expect( injector.get('it') ).toBe(42);
  });

  // requiring other modules
  it('loads multiple modules', ()=>{
    let mod1 = window.angular.module('mod1', []);
    let mod2 = window.angular.module('mod2', []);
    mod1.constant('a', 42);
    mod2.constant('b', 43);
    let injector = createInjector(['mod1', 'mod2']);
    expect( injector.has('a')).toBe(true);
    expect(injector.has('b')).toBe(true);
  });

  it('loads the required modules of a module', ()=>{
    let mod1 = window.angular.module('mod1', []);
    let mod2 = window.angular.module('mod2', ['mod1']);
    mod1.constant('a', 42);
    mod2.constant('b', 43);
    let injector = createInjector(['mod2']);
    expect(injector.has('a')).toBe(true);
    expect(injector.has('b')).toBe(true);
  });

  it('loads the transitively required modules of a module', ()=>{
    let mod1 = window.angular.module('mod1', []);
    let mod2 = window.angular.module('mod2', ['mod1']);
    let mod3 = window.angular.module('mod3', ['mod2']);
    mod1.constant('a', 32);
    mod2.constant('b', 342);
    mod3.constant('c', 2342);
    let injector = createInjector(['mod3']);
    expect(injector.has('a')).toBe(true);
    expect(injector.has('b')).toBe(true);
    expect(injector.has('c')).toBe(true);
  });

  it('loads each module only once', ()=>{
    let mod1 = window.angular.module('mod1', ['mod2']);
    let mod2 = window.angular.module('mod2', ['mod1']);

    createInjector(['mod1']);
  });
});
