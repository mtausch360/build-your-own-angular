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


});
