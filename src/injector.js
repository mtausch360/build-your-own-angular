function createInjector(modulesToLoad){
  let cache = {};

  let constant = (key, val)=>{
    if( key === 'hasOwnProperty' )
      throw 'hasOwnProperty is not a valid constant name';

    cache[key] = val;
  };

  let $provide = {
    constant
  };

  modulesToLoad.forEach((moduleName, i)=>{
    let module = window.angular.module(moduleName);

    module._invokeQueue.forEach((invokeArgs)=>{
      let method = invokeArgs[0];
      let args = invokeArgs[1];
      $provide[method].apply($provide, args);
    });
  });

  return {
    has,
    get
  };

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