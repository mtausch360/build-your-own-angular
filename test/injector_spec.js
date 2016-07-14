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

});
