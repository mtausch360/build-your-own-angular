/**
 * [createInjector description]
 * @param  {Array of strings} modulesToLoad [description]
 * @return {[type]}               [description]
 */
function createInjector(modulesToLoad){
  let cache = {};
  let loadedModules = {};

  let constant = (key, val)=>{
    if( key === 'hasOwnProperty' )
      throw 'hasOwnProperty is not a valid constant name';

    cache[key] = val;
  };

  let $provide = {
    constant
  };

  modulesToLoad.forEach(function loadModule(moduleName, i){

    if( !loadedModules[moduleName] ){
      loadedModules[moduleName] = true;

      let module = window.angular.module(moduleName);

      module.requires.forEach(loadModule);

      module._invokeQueue.forEach((invokeArgs)=>{
        let method = invokeArgs[0];
        let args = invokeArgs[1];
        $provide[method].apply($provide, args);
      });
    }
  });

  return {
    has,
    get,
    invoke
  };

  /**
   * invokes given function with injected properties
   * @param  {Function} fn [description]
   * @return {[type]}      [description]
   */
  function invoke(fn){
    let args = fn.$inject.map( (token) => cache[token] );
    return fn.apply(null, args);
  }

  /**
   * [has description]
   * @param  {[type]}  key [description]
   * @return {Boolean}     [description]
   */
  function has(key){
    return cache.hasOwnProperty(key);
  }

  /**
   * [get description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  function get(key){
    return cache[key];
  }
}

export {createInjector};