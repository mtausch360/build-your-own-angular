import {setupModuleLoader} from '../src/loader';

describe('setupModuleLoader', ()=>{

  it("exposes angular on the window", ()=>{
    setupModuleLoader(window);
    expect(window.angular).toBeDefined();
  });

});