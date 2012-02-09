if (!Function.prototype.bind) {
Function.prototype.bind = function (oThis) {

  // closest thing possible to the ECMAScript 5 internal IsCallable
  // function 
  if (typeof this !== "function")
  throw new TypeError(
    "Function.prototype.bind - what is trying to be fBound is not callable"
  );

  var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply( this instanceof fNOP ? this : oThis || window,
               aArgs.concat(Array.prototype.slice.call(arguments)));
      };

  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();

  return fBound;
};
}

var $ = (HTMLElement.prototype.$ = function(aQuery) {
return this.querySelector(aQuery);
}).bind(document);

var $$ = (HTMLElement.prototype.$$ = function(aQuery) {
return this.querySelectorAll(aQuery);
}).bind(document);

NodeList.prototype.forEach = function(fun) {
if (typeof fun !== "function") throw new TypeError();
for (var i = 0; i < this.length; i++) {
  fun.call(this, this[i]);
}
}
