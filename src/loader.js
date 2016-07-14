function setupModuleLoader (window) {
  //only want to load angular once, and any extraneous calls should not replace the original angular object
  let angular = ensure(window, 'angular', Object);

  let module = ensure(angular, 'module', ()=>{
    let moduleStore = {};
    return (name, requires)=>{
      if(requires){
        return createModule(name, requires, moduleStore);
      } else {
        return getModule(name, moduleStore);
      }
    };
  });

  /**
   * [createModule description]
   * @param  {[type]} name     [description]
   * @param  {array} requires [description]
   * @param  {obj} moduleStore [comes from main execute block]
   * @return {obj}          [description]
   */
  function createModule(name, requires, moduleStore){
    if( name === 'hasOwnProperty')
      throw 'Invalid Module Name: ' + name;

    let _invokeQueue = [];
    let constant = (key, val)=>{
      _invokeQueue.push( ['constant', [key, val]] );
    };

    const moduleInstance = {
      name,
      requires,
      constant,
      _invokeQueue
    };

    moduleStore[name] = moduleInstance;

    return moduleInstance;
  }

  /**
   * [getModule description]
   * @param  {[type]} name   [description]
   * @param  {[type]} moduleStore [description]
   * @return {[type]}        [description]
   */
  function getModule(name, moduleStore){
    if( moduleStore.hasOwnProperty(name))
      return moduleStore[name];
    else
      throw 'Module ' + name + ' doesn\'t exist';
  }

  /**
   * creates a property in the given object with the given factory or returns already existing object
   * @param  {[type]} obj     [description]
   * @param  {[type]} name    [description]
   * @param  {[type]} factory [description]
   * @return {[type]}         [description]
   */
  function ensure(obj, name, factory){
    return obj[name] || ( obj[name] = factory() );
  }
}

export { setupModuleLoader };