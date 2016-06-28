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

});
