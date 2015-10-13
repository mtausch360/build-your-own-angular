_.mixin({
  isArrayLike: function(obj) {
    if (_.isNull(obj) || _.isUndefined(obj)) {
      return false;
    }
    var length = obj.length;
    //to check whether or not an object with a length property also has a corresponding last element
    return length === 0 || (_.isNumber(length) && length > 0 && (length - 1) in obj);
  }
});
