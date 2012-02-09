var Dz = {
remoteWindows: [],
idx: -1,
step: 0,
slides: null,
params: {
  autoplay: "1"
}
};

Dz.init = function() {
document.body.className = "loaded";
this.slides = $$("body > section");
this.setupParams();
this.onhashchange();
this.setupTouchEvents();
this.onresize();
}

Dz.setupParams = function() {
var p = window.location.search.substr(1).split('&');
p.forEach(function(e, i, a) {
  var keyVal = e.split('=');
  Dz.params[keyVal[0]] = decodeURIComponent(keyVal[1]);
});
}

Dz.onkeydown = function(aEvent) {
// Don't intercept keyboard shortcuts
if (aEvent.altKey
  || aEvent.ctrlKey
  || aEvent.metaKey
  || aEvent.shiftKey) {
  return;
}
if ( aEvent.keyCode == 37 // left arrow
  || aEvent.keyCode == 38 // up arrow
  || aEvent.keyCode == 33 // page up
) {
  aEvent.preventDefault();
  this.back();
}
if ( aEvent.keyCode == 39 // right arrow
  || aEvent.keyCode == 40 // down arrow
  || aEvent.keyCode == 34 // page down
) {
  aEvent.preventDefault();
  this.forward();
}
if (aEvent.keyCode == 35) { // end
  aEvent.preventDefault();
  this.goEnd();
}
if (aEvent.keyCode == 36) { // home
  aEvent.preventDefault();
  this.goStart();
}
if (aEvent.keyCode == 32) { // space
  aEvent.preventDefault();
  this.toggleContent();
}
}

/* Touch Events */

Dz.setupTouchEvents = function() {
var orgX, newX;
var tracking = false;

var db = document.body;
db.addEventListener("touchstart", start.bind(this), false);
db.addEventListener("touchmove", move.bind(this), false);

function start(aEvent) {
  aEvent.preventDefault();
  tracking = true;
  orgX = aEvent.changedTouches[0].pageX;
}

function move(aEvent) {
  if (!tracking) return;
  newX = aEvent.changedTouches[0].pageX;
  if (orgX - newX > 100) {
    tracking = false;
    this.forward();
  } else {
    if (orgX - newX < -100) {
      tracking = false;
      this.back();
    }
  }
}
}

/* Adapt the size of the slides to the window */

Dz.onresize = function() {
var db = document.body;
var sx = db.clientWidth / window.innerWidth;
var sy = db.clientHeight / window.innerHeight;
var transform = "scale(" + (1/Math.max(sx, sy)) + ")";

db.style.MozTransform = transform;
db.style.WebkitTransform = transform;
db.style.OTransform = transform;
db.style.msTransform = transform;
db.style.transform = transform;
}


Dz.getDetails = function(aIdx) {
var s = $("section:nth-of-type(" + aIdx + ")");
var d = s.$("details");
return d ? d.innerHTML : "";
}

Dz.onmessage = function(aEvent) {
var argv = aEvent.data.split(" "), argc = argv.length;
argv.forEach(function(e, i, a) { a[i] = decodeURIComponent(e) });
var win = aEvent.source;
if (argv[0] === "REGISTER" && argc === 1) {
  this.remoteWindows.push(win);
  this.postMsg(win, "REGISTERED", document.title, this.slides.length);
  this.postMsg(win, "CURSOR", this.idx + "." + this.step);
  return;
}
if (argv[0] === "BACK" && argc === 1)
  this.back();
if (argv[0] === "FORWARD" && argc === 1)
  this.forward();
if (argv[0] === "START" && argc === 1)
  this.goStart();
if (argv[0] === "END" && argc === 1)
  this.goEnd();
if (argv[0] === "TOGGLE_CONTENT" && argc === 1)
  this.toggleContent();
if (argv[0] === "SET_CURSOR" && argc === 2)
  window.location.hash = "#" + argv[1];
if (argv[0] === "GET_CURSOR" && argc === 1)
  this.postMsg(win, "CURSOR", this.idx + "." + this.step);
if (argv[0] === "GET_NOTES" && argc === 1)
  this.postMsg(win, "NOTES", this.getDetails(this.idx));
}

Dz.toggleContent = function() {
// If a Video is present in this new slide, play it.
// If a Video is present in the previous slide, stop it.
var s = $("section[aria-selected]");
if (s) {
  var video = s.$("video");
  if (video) {
    if (video.ended || video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
}
}

Dz.setCursor = function(aIdx, aStep) {
// If the user change the slide number in the URL bar, jump
// to this slide.
aStep = (aStep != 0 && typeof aStep !== "undefined") ? "." + aStep : ".0";
window.location.hash = "#" + aIdx + aStep;
}

Dz.onhashchange = function() {
var cursor = window.location.hash.split("#"),
    newidx = 1,
    newstep = 0;
if (cursor.length == 2) {
  newidx = ~~cursor[1].split(".")[0];
  newstep = ~~cursor[1].split(".")[1];
  if (newstep > Dz.slides[newidx - 1].$$('.incremental > *').length) {
    newstep = 0;
    newidx++;
  }
}
if (newidx != this.idx) {
  this.setSlide(newidx);
}
if (newstep != this.step) {
  this.setIncremental(newstep);
}
for (var i = 0; i < this.remoteWindows.length; i++) {
  this.postMsg(this.remoteWindows[i], "CURSOR", this.idx + "." + this.step);
}
}

Dz.back = function() {
if (this.idx == 1 && this.step == 0) {
  return;
}
if (this.step == 0) {
  this.setCursor(this.idx - 1,
                 this.slides[this.idx - 2].$$('.incremental > *').length);
} else {
  this.setCursor(this.idx, this.step - 1);
}
}

Dz.forward = function() {
if (this.idx >= this.slides.length &&
    this.step >= this.slides[this.idx - 1].$$('.incremental > *').length) {
    return;
}
if (this.step >= this.slides[this.idx - 1].$$('.incremental > *').length) {
  this.setCursor(this.idx + 1, 0);
} else {
  this.setCursor(this.idx, this.step + 1);
}
}

Dz.goStart = function() {
this.setCursor(1, 0);
}

Dz.goEnd = function() {
var lastIdx = this.slides.length;
var lastStep = this.slides[lastIdx - 1].$$('.incremental > *').length;
this.setCursor(lastIdx, lastStep);
}

Dz.setSlide = function(aIdx) {
this.idx = aIdx;
var old = $("section[aria-selected]");
var next = $("section:nth-of-type("+ this.idx +")");
if (old) {
  old.removeAttribute("aria-selected");
  var video = old.$("video");
  if (video) {
    video.pause();
  }
}
if (next) {
  next.setAttribute("aria-selected", "true");
  var video = next.$("video");
  if (video && !!+this.params.autoplay) {
    video.play();
  }
} else {
  // That should not happen
  this.idx = -1;
  // console.warn("Slide doesn't exist.");
}
}

Dz.setIncremental = function(aStep) {
this.step = aStep;
var old = this.slides[this.idx - 1].$('.incremental > *[aria-selected]');
if (old) {
  old.removeAttribute('aria-selected');
}
var incrementals = this.slides[this.idx - 1].$$('.incremental');
if (this.step <= 0) {
  incrementals.forEach(function(aNode) {
    aNode.removeAttribute('active');
  });
  return;
}
var next = this.slides[this.idx - 1].$$('.incremental > *')[this.step - 1];
if (next) {
  next.setAttribute('aria-selected', true);
  next.parentNode.setAttribute('active', true);
  var found = false;
  incrementals.forEach(function(aNode) {
    if (aNode != next.parentNode)
      if (found)
        aNode.removeAttribute('active');
      else
        aNode.setAttribute('active', true);
    else
      found = true;
  });
} else {
  setCursor(this.idx, 0);
}
return next;
}

Dz.postMsg = function(aWin, aMsg) { // [arg0, [arg1...]]
aMsg = [aMsg];
for (var i = 2; i < arguments.length; i++)
  aMsg.push(encodeURIComponent(arguments[i]));
aWin.postMessage(aMsg.join(" "), "*");
}

window.onload = Dz.init.bind(Dz);
window.onkeydown = Dz.onkeydown.bind(Dz);
window.onresize = Dz.onresize.bind(Dz);
window.onhashchange = Dz.onhashchange.bind(Dz);
window.onmessage = Dz.onmessage.bind(Dz);