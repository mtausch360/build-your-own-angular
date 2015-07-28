

function Scope(){
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
}

//standard initial watcher value for comparison
function initWatchVal(){}
/*
 $watch

  watchFn: should return the piece of data whose changes
          we are interested in
  listenerFn:to be called whenever the data changes
 */
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq){

  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
    valueEq: !!valueEq,
    last: initWatchVal
  };

  this.$$watchers.push(watcher);

  this.$$lastDirtyWatch = null;
};


/*
  $digest - checks if specified elements to watch have
            changed values. If so call listnerFn provided in watcher
 */
 Scope.prototype.$digest = function(){
   var dirty, ttl = 10;
   this.$$lastDirtyWatch = null;

   do{
     dirty = this.$$digestOnce();
     if(dirty && !(ttl--))
       throw "10 digest iterations reached";
   } while(dirty);

 };

Scope.prototype.$$digestOnce = function(){

  var self = this, newValue, oldValue, dirty = false;

  _.forEach(this.$$watchers, function(watcher){
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if(!self.$$areEqual(newValue, oldValue, watcher.valueEq)){

      //set last dirty watcher
      self.$$lastDirtyWatch = watcher;

      //update new value in watcher
      watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);

      //call listener function if updated with old,new values and scope
      watcher.listenerFn(
        newValue,
        //if old value was inital value pass in new value
        //as argument to listener function instead of initWatchVal
        oldValue === initWatchVal ? newValue : oldValue,
        self);
      dirty = true;
    }
    else if(self.$$lastDirtyWatch === watcher){
      return false;
    }

  });

  return dirty;
};


Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq){
  if(valueEq)
    return _.isEqual(newValue, oldValue);
  else
    return newValue === oldValue ||
          (typeof newValue === 'number' && typeof oldValue === 'number' &&
            isNaN(newValue) && isNaN(oldValue));
};

/*
  $eval

 */
Scope.prototype.$eval = function(expr, locals){
  return expr(this, locals);
};

/*
  $apply

 */
Scope.prototype.$apply = function(expr){

  try{
    return this.$eval(expr);
  } finally {
    this.$digest();
  }
};