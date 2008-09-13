/**
 * Add properties to an object
 * @param destination   {Object}        The object to add the property to.
 * @param source        {Object}        Object of keys and values to add to the destination.
 */
Object.extend = function(destination, source) {
    for(var property in source) {
        destination[property] = source[property];
    }
    return destination;
};

/**
 * Helper to add methods to an Object. Just makes code easier on the eyes.
 * @param methods       {Object}        
 */
Object.prototype.addMethods = function(methods) {
    for(var method in methods) {
        this.prototype[method] = methods[method];
    }
    return this;
};

Object.addMethods({
    /**
     * Check if the object is an array instance.
     */
    isArray: function(object) {
        return (object != null && typeof object == "object" && 'splice' in object && 'join' in object);
    },
    /**
     * Generate a URL-safe query string from the object.
     */
    toQueryString: function() {
        var params = [];
        this.each(function(key) {
            var str = '';
            if(typeof this[key] != 'function') {
                str = encodeURIComponent(key)+'=';
                var value = (Object.isArray(this[key])) ? this[key].join(',') : this[key];
                str += encodeURIComponent(value);
                params.push(str)
            }
        }, this);
        return params.join('&');
    },
    /**
     * Iterate each key in the object
     * @param iterator      {Function}      Function to run on each object key
     * @param context       {Object}        Scope override (optional)
     */
    each: function(iterator, context) {
        iterator = iterator.bind(context);
        try {
            var c = this.length, i = 0;
            while(i<c) { iterator(this[i]); i++ }
        } catch(e) { throw e; }
        return this;
    },
    /**
     * iterate each key in the object after specified interval
     * @param iterator      {Function}      Function to run on each object key
     * @param interval      {Number}        Number of milliseconds before each iteration is run (default 1000)
     * @param context       {Object}        Scope override (optional)
     */
    eachAfter: function(iterator, interval, context) {
        iterator = iterator.bind(context);
        var c = this.length, i = 0;
        try {
            var eachIterator = setInterval(function() {
                if(i === c) { clearInterval(eachIterator); } else {
                    iterator(this[i]);
                    i++;
                }
            }.bind(this), (interval || 1000));
        } catch(e) { throw e; }
        return this;
    },
    /**
     * Create and fire custom events
     * @param eventName     {string}        Name of the event
     * @param memo          {Object}        Memo parameters for the event (optional)
     */
    fire: function(eventName, memo) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent(eventName, true, true);
        event.memo = memo || {};
     
        this.dispatchEvent(event);
    }
});

Function.addMethods({
    /**
     * Override scope of a callback function on an event.
     */
    bindAsEventListener: function() {
        var __method = this, object = arguments[0];
        return function(event) {
            return __method.apply(object, [event || window.event].concat(arguments));
        }
    },
    /**
     * Override scope of a function.
     */
    bind: function() {
        if (arguments.length < 2 && !arguments[0]) return this;
        var __method = this,  object = arguments[0];
        return function() {
            return __method.apply(object, arguments);
        }
    }
});

var Ajax = function(options) {
    this.options = {
        method: 'post', 
        asynchronous: true,
        contentType: 'application/x-www-form-urlencoded',
        encoding: 'UTF-8',
        params: {},
		format: 'text',
		sanitizeJSON: false
    };
    
    Object.extend(this.options, options || {});
    this.options.method = this.options.method.toLowerCase();
    
    return this.options;
};
Object.extend(Ajax, {
    /**
     * Ajax.Request makes a new XHR object request
     * @param url           {string}        location to access
     * @param options       {Object}        (optional)
     *      @param method           {string}        post or get form method
     *      @param asynchronous     {Boolean}       Only true supported at this time.
     *      @param contentType      {string}        Content mime type to send.
     *      @param encoding         {string}        Content encoding.
     *      @param params           {Object}        Object of header parameters to send with the request.
     *      @param format           {Object}        Response type assumption: 'text', 'json', 'object', 'xml'
     *      @param sanitizeJSON     {Boolean}       Whether the JSON needs to be sanitized.
     *      @param onUninitialized  {Function}      Ready state callback.
     *      @param onConnected      {Function}      Ready state callback.
     *      @param onRequested      {Function}      Ready state callback.
     *      @param onProcessing     {Function}      Ready state callback.
     *      @param onComplete       {Function}      Ready state callback. Includes response object.
     *      @param onFailure        {Function}      Ready state callback. Includes response object. (recommended)
     *      @param onSuccess        {Function}      Ready state callback. Includes response object. (recommended)
     */
    Request: function(url, options) {
        this.options = new Ajax(options);
        this.url = url;

        this.transport = new XMLHttpRequest();

        if(this.options.method.toLowerCase() == 'get') {
            this.url += (this.url.indexOf('?') >= 0) ? '&' : '?' + params;
        }

        try {
            this.transport.open(this.options.method, url, this.options.asynchronous);

            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();

            var params = this.options.params.toQueryString();

            this.body = this.options.method.toLowerCase() == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this.body);
        } catch(e) {
            console.error('request error', e)
        }
    },
    /**
     * Ajax.Response filters through an Ajax.Request response object to give most concise information possible.
     * @param response      {Object}        The XMLHttpRequest object.
     * @param format        {string}        Type to respond with: 'text', 'json', 'object', 'xml'
     * @param sanitize      {Boolean}       Whether the JSON needs to be sanitized.
     */
    Response: function(response, format, sanitize) {
    	this.response = response;
    	this.format = format;
    	this.sanitizeJSON = sanitize;
    }
});

Object.extend(Ajax.Request, {
    Events: ['Uninitialized', 'Connected', 'Requested', 'Processing', 'Complete', 'Failure', 'Success']
});
Ajax.Request.addMethods({
    onStateChange: function() {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete)) {
            this.respondToReadyState(this.transport.readyState);
        }
    },
    respondToReadyState: function(state) {
        this._complete = (state === 4) ? true : false;

    	if(this._complete) {
        	var res = (new Ajax.Response(this.transport, this.options.format, this.options.sanitizeJSON)).getResponse();

        	// if complete, check for onFailure or onSuccess and fire function if available
            if(this.options.onFailure || this.options.onSuccess) {
                (this.options['on'+Ajax.Request.Events[this.getSuccessCode()]] || function() {} )(res);
            }

        	// if onEvent function is available for this state
        	(this.options['on'+Ajax.Request.Events[state]] || function() {})(res);
    	} else {
    		(this.options['on'+Ajax.Request.Events[state]] || function() {})();
    	}
    },
    getSuccessCode: function() {
        var successCode = (!this.transport.status) ? 5 : (this.transport.status >= 200 && this.transport.status < 300) ? 6 : 5;
        return successCode;
    },
    setRequestHeaders: function() {
        var headers = {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };

        if(this.options.method == 'post') {
            headers['Content-type'] = this.options.contentType+(this.options.encoding ? '; charset='+this.options.encoding : '');
        }

        for(var name in headers) {
            if(typeof headers[name] != 'function') {
                this.transport.setRequestHeader(name, headers[name]);
            }
        }
    }
});
Ajax.Response.addMethods({
    getResponse: function() {
    	switch(this.format.toLowerCase()) {
    		case 'xml':
    		    var xml = (this.response.responseXML) ? this.response.responseXML : new String('');
    			return xml;
    		break;
    		case 'json':
    			return this.evalJSON();
    		break;
    		case 'object':
    			return eval('('+this.response.responseText+')');
    		break;
    		case 'text':
    		    return this.response.responseText;
    		break
    	}
    },
    isJSON: function() {
    	str = this.response.responseText.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    	return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
    },
    evalJSON: function() {
    	var json = this.response.responseText;
    	if(this.sanitizeJSON) { json = json.sub(/^\/\*-secure-([\s\S]*)\*\/\s*$/, '#{1}'); }

    	try {
    		if(this.isJSON(json)) {
    			return eval('('+json+')');
    		}
    	} catch(e) {
    		console.error('json eval error', e);
    	}
    }
});

/**
 * Simplified element creation function
 * @param type      {string}        The type of element to create.
 * @param atts      {Object}        Attributes to attached to the HTMLElement.
 */
var Element = function(type, atts) {
    this.el = document.createElement(type);

    for(attr in atts) {
        if(typeof this.el[attr] !== 'function') {
            this.el.setAttribute(attr, atts[attr]);
        }
    }
    return this.el;
};

String.addMethods({
    /**
     * trim trailing whitespace from a string
     */
    trim: function() {
        var re = new RegExp(/\s+?/);
        return this.replace(re, '');
    }
});

HTMLElement.addMethods({
    /**
     * Add a className to an element
     * @param className     {string}        Name of the class to add.
     */
    addClass: function(className) {
        if(!this.hasClass(className)) {
            this.className += ' '+className.trim();
        }
        return this;
    },
    /**
     * Check if element has a given class name
     * @param className     {string}        Name of the class to test against.
     */
    hasClass: function(className) {
        var re = new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)');
        return re.test(this.className);
    },
    /**
     * Remove a className from an element
     * @param className     {string}        Name of the class to remove.
     */
    removeClass: function(className) {
        if(this.hasClass(className)) {
            var re = new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)');
            this.className = this.className.replace(re, ' ');

            // iterate through in case of multiple adjacent classes
            if(this.hasClass(className)) { this.removeClass(className); } else {
                this.className = this.className.trim();
            }
        }
        return this;
    },
    /**
     * Toggle a className on an element
     * @param className     {string}        Name of the class to remove.
     */
    toggleClass: function(className) {
        if(this.hasClass(className)) {
            this.removeClass(className);
        } else {
            this.addClass(className);
        }
    },
    /**
     * Calculate the cumulative offset from the left and top of the document.
     * Accessible as array [x, y] or objects x||y
     */
    getXY: function() {
        var valueX = 0, valueY = 0;
        var element = this;
        do {
            valueY += element.offsetTop  || 0;
            valueX += element.offsetLeft || 0;
            element = element.offsetParent;
        } while (element);
        var offset = [valueX, valueY];
        offset.x = valueX, offset.y = valueY;
        
        return offset;
    }
});

/**
 * Fire a custom 'dom:loaded' event using DOMContentLoaded if available, else use fallback
 * Safari has had native implementation since WebKit 525+
 *
 * Clear console calls if there is no console
 *
 * Create our magic query selector. Load in Sizzle if necessary.
 * $(selector) returns a NodeList
 * @param selector  {string}        CSS query of selectors
 */
(function() {
    // fire the custom dom:loaded event
    var timer;
    function fireContentLoaded() {
        if(!document.loaded) {
            if(timer) { window.clearInterval(timer); }
        }
        document.fire('dom:loaded');
        document.loaded = true;
    }

    if(
        /AppleWebKit/.test(navigator.appVersion) && 
        parseInt(navigator.appVersion.match(/AppleWebKit\/(\d+)/)[1]) < 525
    ) {
        console.info('DOMContentLoaded not available. Falling back on document.readyState.')
        timer = window.setInterval(function() {
            if(/loaded|complete/.test(document.readyState)) {
                fireContentLoaded();
            }
        }, 0);
    } else {
        document.addEventListener('DOMContentLoaded', fireContentLoaded, false); 
    }
    
    // make any failed console calls silent
    if(typeof console !== 'object') {
        console = { 
            log: function() {}, alert: function() {}, warn: function() {}, info: function() {},
            time: function() {}, timeEnd: function() {}, error: function() {}
        };
    }
    if(typeof document.querySelectorAll === 'function') {
        window.$ = function(selector) {
            return document.querySelectorAll(selector);
        }
    } else {
        // note that at this time, Sizzle is not Internet Explorer compatible
        console.warn('Selectors API not available. Falling back on Sizzle query selector.');
        new Ajax.Request('sizzle.min.js', {
            method: 'get',
            format: 'text',
            onSuccess: function(o) {
                eval(o); // FF2,FF3 < 10ms
                // $(selector) is now available
            },
            onFailure: function(o) {
                console.error('Horrible failure getting Sizzle. That sucks.')
            }
        });
    }
})();
