
describe('parse', function() {

  it("can parse an integer", function() {
    var fn = parse('42');

    console.log(fn.toString());
    expect(fn).toBeDefined();
    expect(fn()).toBe(42);
    /*
    LOG LOG: Object{type: 'Program', body: Object{type: 'Literal', value: 42}}
    LOG LOG: 'function anonymous() { return 42;}'
     */
  });


  //floating points
  it("can parse a floating point number", function() {
    var fn = parse('4.2');
    expect(fn()).toBe(4.2);
  });

  it("can parse a floating point number without an integer part", function() {
    var fn = parse('.42');
    expect(fn()).toBe(0.42);
  });


  //scientific notation
  it("can parse a number in scientific notation", function() {
    var fn = parse('42e3');
    expect(fn()).toBe(42000);
  });

  it("can parse scientific notation with a float coefficient", function() {
    var fn = parse('.42e2');
    expect(fn()).toBe(42);
  });

  it("can parse scientific notation with negative exponents", function() {
    var fn = parse('4200e-2');
    expect(fn()).toBe(42);
  });

  it("can parse scientific notation with the + sign", function() {
    var fn = parse('.42e+2');
    expect(fn()).toBe(42);
  });

  it("can parse upper case scientific notation", function() {
    var fn = parse('.42E2');
    expect(fn()).toBe(42);
  });

  it("will not parse invalid scientific notation", function() {
    expect(function() {
      parse('42e-');
    }).toThrow();
    expect(function() {
      parse('42e-a');
    }).toThrow();
  });


  //strings
  it("can parse a string in single quotes", function() {
    var fn = parse("'abc'");
    expect(fn()).toEqual('abc');
  });

  it("can parse a string in double quotes", function() {
    var fn = parse('"abc"');
    expect(fn()).toEqual('abc');
  });

  it("will not parse a string with mismatching quotes", function() {
    expect(function() {
      parse('"abc\'');
    }).toThrow();
  });

  it('can parse a string with single quotes inside', function() {
    var fn = parse("'a\\\'b'");
    expect(fn()).toEqual('a\'b');
  });

  it('can parse a string with a double quotes inside', function() {
    var fn = parse('"a\\\"b"');
    expect(fn()).toEqual('a\"b');
  });

  it("will parse a string with unicode escapes", function() {
    var fn = parse('"\\u00A0"');
    expect(fn()).toEqual('\u00A0');
  });

  it("will not parse a string with invalid unicode escapes", function() {
    //invalid unicode
    expect(function() {
      parse('"\\u00T0"');
    }).toThrow();
  });


  //true, false, null
  it("will parse null", function() {
    var fn = parse('null');
    expect(fn()).toBe(null);
  });

  it("will parse true", function() {
    var fn = parse('true');
    expect(fn()).toBe(true);
  });

  it("will parse false", function() {
    var fn = parse('false');
    expect(fn()).toBe(false);
  });


  //whitespace
  it('ignores whitespace', function() {
    var fn = parse(' \n42 ');
    expect(fn()).toEqual(42);
  });


  //arrays
  it("will parse an empty array", function() {
    var fn = parse('[]');
    expect(fn()).toEqual([]);
  });

  it("will parse a non-empty array", function() {
    var fn = parse('[1, "two", [3], true]');
    expect(fn()).toEqual([1, 'two', [3], true]);
  });

  it("will parse an array with trailing commas", function() {
    var fn = parse('[1,2,3,]');
    expect(fn()).toEqual([1, 2, 3]);
  });


  //objects
  it("will parse an empty object", function() {
    var fn = parse('{}');
    expect(fn()).toEqual({});
  });

  it("will parse a nonempty object", function() {
    var fn = parse('{"a key": 1, \'another key\': 2 }');
    expect(fn()).toEqual({
      'a key': 1,
      'another key': 2
    });

  });

  it("will parse an object with identifier keys", function() {
    var fn = parse('{a: 1, b: [2,3],  c: {d: 4} }');
    expect(fn()).toEqual({
      a: 1,
      b: [2, 3],
      c: {
        d: 4
      }
    });
  });

  //simple attribute lookup
  it('looks up an attribute from the scope', function() {
    var fn = parse('aKey');
    expect(fn({
      aKey: 42
    })).toBe(42);
    expect(fn({})).toBeUndefined();
  });

  it('returns undefined when looking up attribute from undefined', function() {
    var fn = parse('aKey');
    expect(fn()).toBeUndefined();
  });
  //this
  it('will parse this', function() {
    //create a parsing function with the keyword this
    var fn = parse('this');

    var scope = {};
    //call that function on the variable created above
    expect(fn(scope)).toBe(scope);
    expect(fn()).toBeUndefined();
  });

  //non-computed attribute lookup
  it('looks up a 2-part identifier path from the scope', function() {
    var fn = parse('aKey.anotherKey');
    expect(fn({
      aKey: {
        anotherKey: 42
      }
    })).toBe(42);
    expect(fn({
      aKey: {}
    })).toBeUndefined();
    expect(fn()).toBeUndefined();
  });

  it('looks up a member from an object', function() {
    //parser can take literals and perform lookup on literals
    var fn = parse('{aKey: 42}.aKey');
    expect(fn()).toBe(42);
  });

  it('looks up a 4-part identifier path from scope', function() {

    var fn = parse('key.one.two.three.four');

    expect(fn({
      key: {
        one: {
          two: {
            three: {
              four: 42
            }
          }
        }
      }
    })).toBe(42);

    expect(fn({
      key: {
        one: {
          two: {
            three: {}
          }
        }
      }
    })).toBeUndefined();

    expect(fn({
      key: {}
    })).toBeUndefined();

    expect(fn()).toBeUndefined();
  });

  //locals
  it('uses locals instaed of scope when there is a matching key', function() {

    var fn = parse('key');

    var scope = {
      key: 42
    };

    var locals = {
      key: 43
    };

    expect(fn(scope, locals)).toBe(43);

  });

  it('does not use locals instead of scope when no matching key', function() {

    var fn = parse('key');

    var scope = {
      key: 42
    };

    var locals = {
      otherkey: 42
    };

    expect(fn(scope, locals)).toBe(42);

  });


  it('uses locals instead of scope when the first part matches', function(){
    var fn = parse( 'key.otherKey' ),
      scope = { key: { otherKey: 42 } },
      locals = { key: {} };

    expect( fn(scope, locals) ).toBeUndefined();

  });


  it('handles a simple lookup', function(){
    var fn = parse('key');
    expect( fn( {key: 42} ) ).toBe(42);
  });
  it('parses a simple computed property access', function(){
    var fn = parse('key["otherKey"]');
    expect( fn( { key: { otherKey : 42} } ) ).toBe(42);
  });

  it('parses a computed numeric array access', function(){
    var fn = parse('anArray[1]');
    expect( fn( { anArray: [1,2,3] } ) ).toBe(2);
  });

  it('parses a computed access with another key as property', function(){
    var fn = parse('lock[key]');
    expect( fn( { key: 'thekey', lock: {thekey: 42} } ) ).toBe(42);
  });

  it('parses computed access with another access as property', function(){
    var fn = parse('lock[keys["key"]]');
    expect( fn ( { keys: {key: 'key'}, lock: { key: 42 } } ) ).toBe(42);
  });

  //functions

  it('parses a function call', function(){
    var fn = parse('aFunction()');
    expect( fn( { aFunction: function() { return 42; } } ) ).toBe(42);
  });

  it('parses a function call with a single number argument', function(){
    var fn = parse('aFunction(42)');
    expect( fn( { aFunction: function(n) { return n; } } ) ).toBe(42);
  });

  it('parses a function call with a single identifier argument', function(){

    var fn = parse('aFunction(n)');
    expect( fn( { n: 42, aFunction: function(arg){ return arg; } } ) ).toBe(42);

  });

  it('parses a function call with multiple arguments', function(){
    var fn = parse('aFunction(37, n, argFn() )');
    expect(fn({
      n: 3,
      argFn: _.constant(2),
      aFunction: function(a, b, c){ return a + b + c; }
    })).toBe(42);
  });

  //method calls
  it('calls methods accessed as computed properties', function(){
    var scope = {
      anObject: {
        aMember: 42,
        aFunction: function(){
          return this.aMember;
        }
      }
    };
    var fn = parse('anObject["aFunction"]()');
    expect( fn(scope) ).toBe(42);

  });

  it('calls methods accessed as non-computed properties', function(){
    var scope = {
      anObject: {
        aMember: 42,
        aFunction: function(){
          return this.aMember;
        }
      }
    };
    var fn = parse('anObject.aFunction()');
    expect( fn(scope) ).toBe(42);
  });

  it('binds bare functions to the scope', function(){
    var scope = {};
    var locals = {
      aFunction: function(){
        return this;
      }
    };
    var fn = parse('aFunction()');
    expect( fn(scope, locals) ).toBe(locals);
  });
  
});





































