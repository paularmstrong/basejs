Element = function(type, atts) {
    this.el = document.createElement(type);

    for(attr in atts) {
        this.el.setAttribute(attr, atts[attr]);
    }
    
    return this.el;
};

Function.prototype.bindAsEventListener = function() {
    var __method = this, object = arguments[0];
    return function(event) {
      return __method.apply(object, [event || window.event].concat(arguments));
    }
};

Function.prototype.bind = function() {
    if (arguments.length < 2 && !arguments[0]) return this;
    var __method = this,  object = arguments[0];
    return function() {
      return __method.apply(object, arguments);
    }
}

HTMLElement.prototype.setStyle = function(styles) {
    for(cssStyle in styles) {
        this.style[cssStyle] = styles[cssStyle];
    }
    return this;
};

var $ = function(selector) {
    if(typeof document.querySelector === 'function') {
        var all = document.querySelectorAll(selector);
        if(all != null && all.length > 1) {
            return all;
        } else {
            return document.querySelector(selector);
        }
    } else {
        //var cascade = selector.split(' ');
        //var context;
        //
        //for(var i = 0; i < cascade.length; i++) {
        //    if(cascade[i].indexOf('#') != -1) {
        //        context = document.getElementById(cascade[i].split('#')[1]);
        //    }
        //}
        //
        //if((/^\w/).test(selector)) {
        //    return document.getElementById(selector);
        //} else if((/^\./).test(selector)) {
        //    
        //}
        //if(selector.match(/^[ A-Za-z0-9]+/)) {
        //    if(!document.getElementById(selector)) {
        //        return document.querySelector(selector);
        //    } else {
        //        return document.getElementById(selector);
        //    }
        //} else {
        //    return document.querySelector(selector);
        //}
    }
};

/*
var Ajax = function(type, url, params) {
    this.req = new XMLHttpRequest();
    this.type = type;
    this.url = url;
    this.params = params;
    
    this.req.open(this.type, this.url, true);
    this.req.onreadystatechange = function() {
        console.log('change', this.req.readyState, this.req.status, this.req.responseText)
    }.bind(this);
    this.req.send(this.params);
};
*/
// jacked from prototype
Object.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};
Function.prototype.curry = function() {
    if (!arguments.length) return this;
    var __method = this;
    return function() {
      return __method.apply(this, arguments);
    }
};
Function.prototype.delay = function() {
    var __method = this, args = arguments, timeout = args[0] * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
};
Function.prototype.defer = Function.prototype.delay.curry(0.01);

var Ajax = function(options) {
    this.options = {
        method: 'post', 
        asynchronous: true,
        contentType:  'application/x-www-form-urlencoded',
        encoding:     'UTF-8',
        parameters:   '',
    };
    
    Object.extend(this.options, options || {});
    this.options.method = this.options.method.toLowerCase();
    
    return this.options;
};

Ajax.Request = function(url, options) {
    this.options = new Ajax(options);
    
    this.transport = new XMLHttpRequest();
    
    try {
        this.transport.open(this.options.method, url, this.options.asynchronous);
        
        this.transport.onreadystatechange = this.onStateChange.bind(this);

        this.transport.send();

    } catch(e) {
        console.error(e)
    }
    
};

Ajax.Request.prototype.onStateChange = function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete)) {
        this.respondToReadyState(this.transport.readyState);
    }
};

Ajax.Request.prototype.respondToReadyState = function(state) {
    this._complete = (state === 4) ? true : false;
    //console.log(state, this.transport.status, this.transport.responseText, this._complete)
};
