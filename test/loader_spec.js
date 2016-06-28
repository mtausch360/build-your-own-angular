import {setupModuleLoader} from '../src/loader';

describe('setupModuleLoader', ()=>{

  beforeEach(()=>{
    delete window.angular;
  });

  it("exposes angular on the window", ()=>{
    setupModuleLoader(window);
    expect(window.angular).toBeDefined();
  });

  it('creates angular just once', ()=>{
    setupModuleLoader(window);
    const ng = window.angular;
    setupModuleLoader(window);
    expect(window.angular).toBe(ng);
  });

  //module method
  it('exposes the angular module function', ()=>{
    setupModuleLoader(window);
    expect(window.angular.module).toBeDefined();
  });

  it('exposes the angular module function just once', ()=>{
    setupModuleLoader(window);
    const mod = window.angular.module;
    setupModuleLoader(window);
    expect(window.angular.module).toBe(mod);
  });

  describe('modules', ()=>{

    beforeEach(()=>{
      setupModuleLoader(window);
    });

    it('allows registering a module', ()=>{
      let myModule = window.angular.module('myModule', []);
      expect(myModule).toBeDefined();
      expect(myModule.name).toEqual('myModule');
    });

    it('replaces a module of the same name again', ()=>{
      let myModule = window.angular.module('myModule', []);
      let myNewModule = window.angular.module('myModule', []);
      expect(myNewModule).not.toBe(myModule);
    });

    it('attaches the requires array to the registered module', ()=>{
      let requires = [];
      let myModule = window.angular.module('myModule', requires);
      expect(myModule.requires).toBe(requires);
    });

    it('allows getting a module', ()=>{
      let myMod = window.angular.module('myMod', []);
      let gotModule = window.angular.module('myMod');
      expect(myMod).toBe(gotModule);
    });

    it('throws when getting nonexistent module', ()=>{
      expect(()=>window.angular.module('myMod')).toThrow();
    });

    it('does not allow a module called hasOwnProperty', ()=>{
      expect(()=>window.angular.module('hasOwnProperty', [])).toThrow();
    });
    

  });

});