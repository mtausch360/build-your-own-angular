/*

    Scope object

 */

function Scope() {

  this.$$watchers = [];

  this.$$lastDirtyWatch = null;

  this.$$postDigestQueue = [];

  this.$$asyncQueue = [];

  this.$$applyAsyncQueue = [];

  this.$$applyAsyncId = null;

  this.$$phase = null;

}

//standard initial watcher value for comparison
function initWatchVal() {}


/*
 $watch

  watchFn: should return the piece of data whose changes
          we are interested in
  listenerFn:to be called whenever the data changes
 */
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {

  var watcher = {

    watchFn: watchFn,

    listenerFn: listenerFn || function() {},

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
Scope.prototype.$digest = function() {
  var dirty, ttl = 10;

  this.$$lastDirtyWatch = null;

  this.$beginPhase("$digest");

  if(this.$$applyAsyncId){

    clearTimeout(this.$$applyAsyncId);

    this.$$flushApplyAsync();

  }

  do {

    while (this.$$asyncQueue.length) {

      try{

        var asyncTask = this.$$asyncQueue.shift();

        asyncTask.scope.$eval(asyncTask.expression);

      }
      catch (e) {
        console.error(e);
      }

    }

    dirty = this.$$digestOnce();

    //if digest is dirty or async operations in queue and 10 iterations reached
    if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
      this.$clearPhase();
      throw "10 digest iterations reached";
    }
  } while (dirty || this.$$asyncQueue.length);

  this.$clearPhase();

  while(this.$$postDigestQueue.length){

    try {

      this.$$postDigestQueue.shift()();

    }
    catch (e) {
      console.error(e);
    }

  }

};


/*
  $eval - evaluates expression with current scope and locals

 */
Scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};


/*
    $evalAsync - schedules evaluation of expression in same digest cycle that it's run in

 */
Scope.prototype.$evalAsync = function(expr) {

  var self = this;

  if (!self.$$phase && !self.$$asyncQueue.length) {

    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$digest();
      }
    }, 0);

  }

  this.$$asyncQueue.push({

    scope: this,

    expression: expr

  });

};


/*
  $apply - returns evaluated expression. then schedules digest

 */
Scope.prototype.$apply = function(expr) {

  try {

    this.$beginPhase("$apply");

    return this.$eval(expr);

  } finally {

    this.$clearPhase();

    this.$digest();

  }

};
/*
    $applyAsync - evaluates expression and schedules digest asynchronously

 */

Scope.prototype.$applyAsync = function(expr) {

  var self = this;

  self.$$applyAsyncQueue.push(function(){
    self.$eval(expr);
  });

  if (self.$$applyAsyncId === null){

    self.$$applyAsyncId = setTimeout(function(){

      self.$apply(_.bind(self.$$flushApplyAsync, self));

    }, 0);

  }

};

/*
    $beginPhase - 

 */
Scope.prototype.$beginPhase = function(phase) {

  if (this.$$phase) {

    throw this.$$phase + ' already in progress.';

  }

  this.$$phase = phase;
};


/*
    $clearPhase - 

 */
Scope.prototype.$clearPhase = function() {
  this.$$phase = null;
};




//    Internal Scope Values 

Scope.prototype.$$digestOnce = function() {

  var self = this,
    newValue, oldValue, dirty = false;

  _.forEach(this.$$watchers, function(watcher) {
    try {

      newValue = watcher.watchFn(self);

      oldValue = watcher.last;

      if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {

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

      } else if (self.$$lastDirtyWatch === watcher) {

        return false;

      }

    }
    catch (e) {
      console.error(e);
    }

  });

  return dirty;
};


Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {

  if (valueEq)
    return _.isEqual(newValue, oldValue);

  else
    return newValue === oldValue ||
      (typeof newValue === 'number' && typeof oldValue === 'number' &&
        isNaN(newValue) && isNaN(oldValue));
};

Scope.prototype.$$flushApplyAsync = function() {

  while (this.$$applyAsyncQueue.length){

    //error handling for $applyAsync
    try{

      this.$$applyAsyncQueue.shift()();

    }
    catch (e) {
      console.error(e);
    }

  }

  this.$applyAsyncId = null;

};

Scope.prototype.$$postDigest = function(fn){
  this.$$postDigestQueue.push(fn);
};
