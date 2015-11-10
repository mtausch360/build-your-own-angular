/*

    Scope object

    rootScope constructor
 */

function Scope() {

  this.$$watchers = [];

  this.$$lastDirtyWatch = null;

  this.$$asyncQueue = [];

  this.$$applyAsyncQueue = [];

  this.$$applyAsyncId = null;

  this.$$postDigestQueue = [];

  this.$root = this;

  this.$$children = [];

  this.$$listeners = {};

  this.$$phase = null;

}

//standard initial watcher value for comparison
function initWatchVal() {}

/*
    $new - creates a new child scope for the current scope
 */

Scope.prototype.$new = function(isolated, parent) {
  var child;

  parent = parent || this;

  if (isolated) {

    child = new Scope();

    child.$root = parent.$root;

    child.$$asyncQueue = parent.$$asyncQueue;

    child.$$postDigestQueue = parent.$$postDigestQueue;

    child.$$applyAsyncQueue = parent.$$applyAsyncQueue;

  } else {

    var ChildScope = function() {};

    ChildScope.prototype = this;

    child = new ChildScope();

  }

  parent.$$children.push(child);

  child.$$watchers = [];

  child.$$children = [];

  child.$$listeners = {};

  child.$parent = parent;

  return child;

};

/*
    $destroy
 */


Scope.prototype.$destroy = function() {
  this.$broadcast('$destroy');
  if (this.$parent) {
    var siblings = this.$parent.$$children;
    var indexOfThis = siblings.indexOf(this);
    if (indexOfThis >= 0) {
      siblings.splice(indexOfThis, 1);
    }
  }
  this.$$watcher = null;
  this.$$listeners = {};
};


/*
 $watch

  watchFn: should return the piece of data whose changes
          we are interested in
  listenerFn:to be called whenever the data changes

  returns function closure to delete watch when invoked
 */

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
  var self = this;
  var watcher = {

    watchFn: watchFn,

    listenerFn: listenerFn || function() {},

    valueEq: !!valueEq,

    last: initWatchVal

  };

  this.$$watchers.unshift(watcher);

  this.$root.$$lastDirtyWatch = null;

  return function() {
    var index = self.$$watchers.indexOf(watcher);
    if (index >= 0) {

      self.$$watchers.splice(index, 1);

      self.$root.$$lastDirtyWatch = null;

    }
  };
};


/*
    $watchGroup - takes in multiple watch functions and only one listener
 */
Scope.prototype.$watchGroup = function(watchFns, listenerFn) {

  var self = this,
    newValues = new Array(watchFns.length),
    oldValues = new Array(watchFns.length);

  var changeReactionsScheduled = false;

  var firstRun = true;

  if (watchFns.length === 0) {

    var shouldCall = true;

    self.$evalAsync(function() {
      if (shouldCall)
        listenerFn(newValues, newValues, self);
    });

    return function() {
      shouldCall = false;
    };

  }

  var watchGroupListener = function() {

    if (firstRun) {

      firstRun = false;

      listenerFn(newValues, newValues, self);

    } else {
      listenerFn(newValues, oldValues, self);
    }

    changeReactionsScheduled = false;

  };

  var destroyFunctions = _.map(watchFns, function(watchFn, i) {

    return self.$watch(watchFn, function(newValue, oldValue) {

      newValues[i] = newValue;

      oldValues[i] = oldValue;

      if (!changeReactionsScheduled) {
        changeReactionsScheduled = true;
        self.$evalAsync(watchGroupListener);
      }

    });

  });

  return function() {
    _.forEach(destroyFunctions, function(destroyFunction) {
      destroyFunction();
    });
  };

};


/*

  $watchCollection

 */

Scope.prototype.$watchCollection = function(watchFn, listenerFn) {
  var self = this,
    changeCount = 0,
    newValue, oldValue, oldLength, veryOldValue,
    trackVeryOldValue = (listenerFn.length > 1),
    firstRun = true;

  var internalWatchFn = function(scope) {
    var newLength;
    newValue = watchFn(scope);

    if (_.isObject(newValue)) {

      if (_.isArrayLike(newValue)) {

        if (!_.isArray(oldValue)) {
          changeCount++;
          oldValue = [];
        }

        if (newValue.length !== oldValue.length) {
          changeCount++;
          oldValue.length = newValue.length;
        }

        _.forEach(newValue, function(newItem, i) {
          var bothNaN = _.isNaN(newItem) && _.isNaN(oldValue[i]);
          //if not both nan then there is a change
          //otherwise there has been a change
          if (!bothNaN && newItem !== oldValue[i]) {
            changeCount++;
            oldValue[i] = newItem;
          }
        });

      } else {

        if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
          changeCount++;
          oldValue = {};
          oldLength = 0;
        }

        newLength = 0;

        _.forOwn(newValue, function(newVal, key) {
          newLength++;
          if (oldValue.hasOwnProperty(key)) {
            var bothNaN = _.isNaN(newVal) && _.isNaN(oldValue[key]);
            if (!bothNaN && oldValue[key] !== newVal) {
              changeCount++;
              oldValue[key] = newVal;
            }
          } else {
            changeCount++;
            oldLength++;
            oldValue[key] = newVal;
          }
        });

        if (oldLength > newLength) {
          changeCount++;
          //if old object attributes no longer exist delete
          _.forOwn(oldValue, function(oldVal, key) {
            if (!newValue.hasOwnProperty(key)) {
              oldLength--;
              delete oldValue[key];
            }
          });
        }

      }
    } else {

      if (!self.$$areEqual(newValue, oldValue, false)) {
        changeCount++;
      }
      oldValue = newValue;
    }


    return changeCount;
  };

  var internalListenerFn = function() {
    if (firstRun) {
      listenerFn(newValue, newValue, self);
      firstRun = false;
    } else {
      listenerFn(newValue, veryOldValue, self);
    }

    if (trackVeryOldValue) {
      veryOldValue = _.clone(newValue);
    }
  };

  return this.$watch(internalWatchFn, internalListenerFn);
};


/*
  $digest - checks if specified elements to watch have
            changed values. If so call listnerFn provided in watcher
 */
Scope.prototype.$digest = function() {
  var dirty, ttl = 10;

  this.$root.$$lastDirtyWatch = null;

  this.$beginPhase("$digest");

  if (this.$root.$$applyAsyncId) {

    clearTimeout(this.$root.$$applyAsyncId);

    this.$$flushApplyAsync();

  }

  do {

    while (this.$$asyncQueue.length) {

      try {

        var asyncTask = this.$$asyncQueue.shift();

        asyncTask.scope.$eval(asyncTask.expression);

      } catch (e) {
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

  while (this.$$postDigestQueue.length) {

    try {

      this.$$postDigestQueue.shift()();

    } catch (e) {
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
        self.$root.$digest();
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

    this.$root.$digest();

  }

};
/*
    $applyAsync - evaluates expression and schedules digest asynchronously

 */

Scope.prototype.$applyAsync = function(expr) {

  var self = this;

  self.$$applyAsyncQueue.push(function() {
    self.$eval(expr);
  });

  if (self.$root.$$applyAsyncId === null) {

    self.$root.$$applyAsyncId = setTimeout(function() {

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

//    Internal Scope Values / helpers

Scope.prototype.$$digestOnce = function() {

  var dirty;

  var continueLoop = true;

  var self = this;

  this.$$everyScope(function(scope) {

    var newValue, oldValue;

    _.forEachRight(scope.$$watchers, function(watcher) {

      try {
        if (watcher) {

          newValue = watcher.watchFn(scope);

          oldValue = watcher.last;

          if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {

            //set last dirty watcher
            self.$root.$$lastDirtyWatch = watcher;

            //update new value in watcher
            watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);

            //call listener function if updated with old,new values and scope
            watcher.listenerFn(

              newValue,
              //if old value was inital value pass in new value
              //as argument to listener function instead of initWatchVal
              (oldValue === initWatchVal ? newValue : oldValue),

              scope);

            dirty = true;

          } else if (self.$root.$$lastDirtyWatch === watcher) {

            continueLoop = false;
            return false;

          }

        }

      } catch (e) {
        console.error(e);
      }

    });

    return continueLoop;
  });

  return dirty;
};


// angular event methods

Scope.prototype.$on = function(eventName, listener) {
  var listeners = this.$$listeners[eventName];

  if (!listeners) {
    this.$$listeners[eventName] = listeners = [];
  }

  listeners.push(listener);

  return function() {
    var index = listeners.indexOf(listener);
    if (index >= 0)
      listeners[index] = null;
  };
};

Scope.prototype.$emit = function(eventName) {
  var propagationStopped = false;

  var event = {
    name: eventName,
    targetScope: this,
    //halts event from going further up scope hierarchy
    stopPropagation: function() {
      propagationStopped = true;
    },
    preventDefault: function() {
      event.defaultPrevented = true;
    }
  };

  var listenerArgs = [event].concat(_.rest(arguments));
  var scope = this;
  do {
    event.currentScope = scope;
    scope.$$fireEventOnScope(eventName, listenerArgs);
    scope = scope.$parent;
  } while (scope && !propagationStopped);

  //current scope is meant to communicate the current status of event propogation
  event.currentScope = null;
  return event;

};

Scope.prototype.$broadcast = function(eventName) {
  var event = {
    name: eventName,
    targetScope: this,
    preventDefault: function() {
      event.defaultPrevented = true;
    }
  };
  var listenerArgs = [event].concat(_.rest(arguments));
  this.$$everyScope(function(scope) {
    event.currentScope = scope;
    scope.$$fireEventOnScope(eventName, listenerArgs);
    return true;
  });

  //current scope is meant to communicate the current status of event propogation
  event.currentScope = null;

  return event;
};


// internal angular functions

Scope.prototype.$$fireEventOnScope = function(eventName, listenerArgs) {

  var listeners = this.$$listeners[eventName] || [];
  var i = 0;
  while (i < listeners.length) {
    if (listeners[i] === null) {
      listeners.splice(i, 1);
    } else {
      //try catch block so events continue to propagate if error is thrown
      try {
        listeners[i].apply(null, listenerArgs);
      } catch (e) {
        console.error(e);
      }
      i++;
    }
  }

  return event;
};

Scope.prototype.$$everyScope = function(fn) {

  if (fn(this)) {

    return this.$$children.every(function(child) {
      return child.$$everyScope(fn);
    });

  } else {
    return false;
  }

};

//valueEq -flag to use value comparison
Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {

  if (valueEq)
    return _.isEqual(newValue, oldValue);

  else
  //values are equal
    return newValue === oldValue ||
    //including NaN
    (typeof newValue === 'number' && typeof oldValue === 'number' &&
      isNaN(newValue) && isNaN(oldValue));
};

Scope.prototype.$$flushApplyAsync = function() {

  while (this.$$applyAsyncQueue.length) {

    //error handling for $applyAsync
    try {

      this.$$applyAsyncQueue.shift()();

    } catch (e) {
      console.error(e);
    }

  }

  this.$root.$$applyAsyncId = null;

};

Scope.prototype.$$postDigest = function(fn) {
  this.$$postDigestQueue.push(fn);
};
