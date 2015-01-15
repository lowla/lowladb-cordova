// Add Promise support to Jasmine 2.0. Based on https://github.com/geekytime/jasmine-then, modified
// by mark@lowla.io to a) integrate with Cordova and b) support mixed Promise/non-Promise tests.

var wrap = function(specFunc){
  var wrapped = function(done){
    var promise;
    
    try {
      promise = specFunc();
    }
    catch (error) {
      expect(error).toBeUndefined();
      done();
    }

    if (!promise || !(promise.then)){
      done();
    }
    else {
      promise
        .then(function () {
          done();
        })
        .catch(function (error) {
          expect(error).toBeUndefined();
          done();
        })
    }
  };
  return wrapped;
};

var JTSpec = function(spec){
  this.spec = spec;
};

//Defer to built-in jasmine functions, but pass them our wrapped
JTSpec.prototype.beforeEach = function(func){
  var wrappedSpec = wrap(func);
  this.spec.beforeEach(wrappedSpec);
 };

JTSpec.prototype.afterEach = function(func){
  var wrappedSpec = wrap(func);
  this.spec.afterEach(wrappedSpec);
};

JTSpec.prototype.it = function(description, func){
  var wrappedSpec = wrap(func);
  //Need to get `it` from global? Weird...
  window.it(description, wrappedSpec);
};

module.exports = {
  Spec: JTSpec
};
