var assert = require('assert')
  , async = require('../async')
  , scheme = require('../scheme');

(function(scheme) {
  //console.log(typeof define !== 'function' && typeof require === 'function')
    var S = new scheme.Interpreter();

  S.eval_async( ["begin", 1, 2, 4], undefined, function(res){
    console.log(res);
  });

  S.eval_async( [function(x){ return x * 3; }, [ function(){ return 2; } ] ], undefined, function(res){
    console.log(res);
  });

  S.eval_async( [ "quote", "cool yo" ], undefined, function(res){
    console.log(res);
  });
})(scheme);