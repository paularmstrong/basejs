/**
 * baseJS is a work-in-progress lightweight JavaScript library.
 * There is currently NO SUPPORT for Internet Explorer.
 * The original intention of this framework is to provide helper methods for iPhone 
 * development for all versions of the iPhone and iPod Touch Safari Browser.
 * Everything also is tested and works in Firefox 2+.
 *
 * Many of the methods and ideals in this document have been taken from Prototype, jQuery, and YUI.
 * Licensed under the Creative Commons Attribution-ShareAlike 3.0 United States.
 *
 * Written by Paul Armstrong
 * Contact: paul@paularmstrongdesigns.com
 * Site: http://paularmstrongdesigns.com/projects/basejs
 *
 * Internal methods and properties start with an underscore. You probably shouldn't use them.
 */
 
var userAgent = navigator.userAgent.toLowerCase();
var base = {
    /**
     * Add properties to an object
     * @param arguments         Last argument is the object of properties or methods 
     *                          to apply to the all preceding parameters.
     */
    extend: function() {
        function ext(destination, source) {
            for(var property in source) {
                destination[property] = source[property];
            }
        }
        if(arguments.length == 2) {
            ext(arguments[0], arguments[1])
        } else {
            var l = arguments.length, src = arguments[l-1], i = l-1;
            while(i--) { ext(arguments[i], src); }
        }
    },
    /**
     * Convenience browser checking. Thanks to prototype && jquery.
     * I will hopefully never really need this.
     */
    browser: {
    	version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
    	webkit: /webkit/.test(userAgent),
    	opera: /opera/.test(userAgent), // untested
    	msie: /msie/.test(userAgent) && !/opera/.test(userAgent), // not supported yet
    	mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent),
        msafari: /apple.*mobile.*safari/.test(userAgent)
    },
    /**
     * Check if the object is an array instance.
     * @param object    {object}    Object to check.
     */
    isArray: function(object) {
        return (object != null && typeof object == "object" && 'splice' in object && 'join' in object);
    },
    /**
     * Generate a URL-safe query string from the object.
     * @param object    {object}    Object to transcribe into a query string.
     */
    toQueryString: function(object) {
        var params = [];
        for(var key in object) {
            var str = encodeURIComponent(key)+'=';
            var value = (base.isArray(object[key])) ? object[key].join(',') : object[key];
            str += encodeURIComponent(value);
            params.push(str)
        }
        return params.join('&');
    },
    /**
     * Create and fire custom events
     * @param eventName     {string}        Name of the event
     * @param memo          {object}        Memo parameters for the event (optional)
     */
    _fire: function(element, eventName, memo) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent(eventName, true, true);
        event.memo = memo || {};
     
        element.dispatchEvent(event);
    },
    /**
     * Shortcut to preventDefault and stopPropagation on events.
     * @param e   {Event}     Event to stop
     */
    stopEvent: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },
    selectors: false
};

base.extend(Array.prototype, NodeList.prototype, {
    /**
     * Run a function on each item in the array
     * @param iterator      {function}      Function to run on each object key
     * @param context       {object}        Scope override (optional)
     */
    each: function(iterator, context) {
        iterator = (context) ? iterator.bind(context) : iterator;
        try {
            var c = this.length, i = 0;
            while(i<c) { 
                iterator(this[i]); i++ 
            }
        } catch(e) { throw e; }
        return this;
    },
    /**
     * Run a function on each item in the array after a specified interval
     * @param iterator      {function}      Function to run on each object key
     * @param interval      {Number}        Number of milliseconds before each iteration is run (default 1000)
     * @param dir           {Number}        -1, 1 or null. Negative gives reverse iteration. (optional)
     * @param context       {object}        Scope override (optional)
     * @param callback      {function}      Function to fire after each item has been iterated. (optional)
     */
    eachAfter: function(iterator, interval, dir, context, callback) {
        iterator = (context) ? iterator.bind(context) : iterator;
        callback = callback || function() {};
        var dir = dir || 1;
        var c = this.length, i = 0;
        if(dir < 0) {
            var t = c;
            c = i;
            i = (t == 0) ? 0 : t-1;
        }
        try {
            var eachIterator = setInterval(function() {
                if(i === c) { 
                    if(callback) { callback(); }
                    clearInterval(eachIterator);
                    return this;
                } else {
                    iterator(this[i]);
                    i = i+dir;
                }
            }.bind(this), (interval || 1000));
        } catch(e) { throw e; }
    }
});

base.extend(Function.prototype, {
    /**
     * Override scope of a function.
     * @param oScope     {object}      Object to override the scope of the function.
     * @param arguments  {*}           Any additional arguments to pass.
     */
    bind: function() {
		var method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
		return function() {
			return method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
		}
    },
    /**
     * Override scope of a callback function on an event.
     * @param oScope     {object}      Object to override the scope of the function.
     * @param arguments  {*}           Any additional arguments to pass.
     */
    bindAsEventListener: function() {
        var method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function(event) {
            return method.apply(object, [event || window.event].concat(Array.prototype.slice.call(arguments)));
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
    
    base.extend(this.options, options || {});
    this.options.method = this.options.method.toLowerCase();
    
    return this.options;
};
base.extend(Ajax, {
    /**
     * Ajax.Request makes a new XHR object request
     * @param url           {string}        location to access
     * @param options       {object}        (optional)
     *      @param method           {string}        post or get form method
     *      @param asynchronous     {boolean}       Only true supported at this time.
     *      @param contentType      {string}        Content mime type to send.
     *      @param encoding         {string}        Content encoding.
     *      @param params           {object}        Object of header parameters to send with the request.
     *      @param format           {object}        Response type assumption: 'text', 'json', 'object', 'xml'
     *      @param sanitizeJSON     {boolean}       Whether the JSON needs to be sanitized.
     *      @param onUninitialized  {function}      Ready state callback.
     *      @param onConnected      {function}      Ready state callback.
     *      @param onRequested      {function}      Ready state callback.
     *      @param onProcessing     {function}      Ready state callback.
     *      @param onComplete       {function}      Ready state callback. Includes response object.
     *      @param onFailure        {function}      Ready state callback. Includes response object. (recommended)
     *      @param onSuccess        {function}      Ready state callback. Includes response object. (recommended)
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

            this.transport.onreadystatechange = this._onStateChange.bind(this);
            this._setRequestHeaders();

            var params = base.toQueryString(this.options.params);

            this._body = this.options.method.toLowerCase() == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this._body);
        } catch(e) {
            console.error('request error', e)
        }
    },
    /**
     * Ajax.Response filters through an Ajax.Request response object to give most concise information possible.
     * @param response      {object}        The XMLHttpRequest object.
     * @param format        {string}        Type to respond with: 'text', 'json', 'object', 'xml'
     * @param sanitize      {boolean}       Whether the JSON needs to be sanitized.
     */
    Response: function(response, format, sanitize) {
    	this.response = response;
    	this.format = format;
    	this.sanitizeJSON = sanitize;
    }
});

base.extend(Ajax.Request, {
    Events: ['Uninitialized', 'Connected', 'Requested', 'Processing', 'Complete', 'Failure', 'Success']
});
base.extend(Ajax.Request.prototype, {
    _onStateChange: function() {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete)) {
            this._respondToReadyState(this.transport.readyState);
        }
    },
    _respondToReadyState: function(state) {
        this._complete = (state === 4) ? true : false;

    	if(this._complete) {
        	var res = (new Ajax.Response(this.transport, this.options.format, this.options.sanitizeJSON)).getResponse();

        	// if complete, check for onFailure or onSuccess and fire function if available
            if(this.options.onFailure || this.options.onSuccess) {
                (this.options['on'+Ajax.Request.Events[this._getSuccessCode()]] || function() {} )(res);
            }

        	// if onEvent function is available for this state
        	(this.options['on'+Ajax.Request.Events[state]] || function() {})(res);
    	} else {
    		(this.options['on'+Ajax.Request.Events[state]] || function() {})();
    	}
    },
    _getSuccessCode: function() {
        var successCode = (!this.transport.status) ? 5 : (this.transport.status >= 200 && this.transport.status < 300) ? 6 : 5;
        return successCode;
    },
    _setRequestHeaders: function() {
        var headers = {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };

        if(this.options.method == 'post') {
            headers['Content-type'] = this.options.contentType+(this.options.encoding ? '; charset='+this.options.encoding : '');
        }

        for(var name in headers) {
            this.transport.setRequestHeader(name, headers[name]);
        }
    }
});
base.extend(Ajax.Response.prototype, {
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
    		    try {
        			return eval('('+this.response.responseText+')');
    		    } catch(e) {
    		        throw new SyntaxError('Returned object is invalid.');
    		    }
    		break;
    		case 'text':
    		    return this.response.responseText;
    		break;
    		default:
    		    return this.response;
    		break;
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
 * HTML Templates that can be filled with object data.
 * @param template  {string}        The markup that will be used for the template.
 */
var Template = function(template) {
    this.template = template;
    return this.template;
}
base.extend(Template.prototype, {
    /**
     * Parse the data object into the template, replacing #{key} with key values.
     * @param object    {object}        Key/value pairs to parse into the template object.
     */
    parse: function(object) {
        this.data = object;
        this.output = this.template;
        // match every instance of #{key} and replace it with what's in the data object
        this.output = this.output.replace(/#\{(\w+)\}/g, this._replaceCallback.bind(this));
        return this.output;
    },
    /**
     * Private method for parsing the template.
     * @param match1    {string}        Matches #{key}
     * @param match2    {string}        Matches key
     */
    _replaceCallback: function(match1, match2) {
        return this.data[match2] || '';
    }
});

/**
 * Simplified element creation function
 * @param type      {string}        The type of element to create.
 * @param atts      {object}        Attributes to attached to the HTMLElement. (optional)
 * @param content   {string}        Set the innerHTML of the element. (optional)
 */
var Element = function(type, atts, content) {
    this.el = document.createElement(type);

    for(var attr in atts) {
        this.el.setAttribute(attr, atts[attr]);
    }
    
    this.el.innerHTML = content || '';
    return this.el;
};

base.extend(String.prototype, {
    /**
     * Check if the string is empty or whitespace only
     */
    blank: function() {
        return /^\s*$/.test(this);
    },
    /**
     * Convert a string into an HTML NodeList
     */
    toHTML: function() {
        var div = document.createElement('div');
        div.innerHTML = this;
        return div.childNodes;
    },
    /**
     * trim trailing whitespace or custom match from a string
     * @param match         {string}        Regular Expression string to trim. (optional)
     */
    trim: function(match) {
        var re = new RegExp(match) || new RegExp(/\s+?/);
        return this.replace(re, '');
    }
});

base.extend(HTMLElement.prototype, {
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
    },
    fire: function(eventName, memo) {
        base._fire(this, eventName, memo);
    }
});

base.extend(document, { 
    _loaded: false,
    fire: function(eventName, memo) {
        base._fire(this, eventName, memo);
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
 * @param selector  {string}        CSS query of selectors.
 * @param context   {HTMLElement}   Context for the query. Limits scope of query.
 */
(function() {
    // fire the custom dom:loaded event
    var timer;
    function fireContentLoaded() {
        if(!document._loaded) {
            if(timer) { window.clearInterval(timer); }
        }
        document.fire('dom:loaded');
        document._loaded = true;
    }
    
    // make any failed console calls silent
    if(typeof console !== 'object') {
        console = { 
            log: function() {}, alert: function() {}, warn: function() {}, info: function() {},
            time: function() {}, timeEnd: function() {}, error: function() {}
        };
    }
    if(typeof document.querySelectorAll === 'function') {
        window.$ = function(selector, context) {
            context = (!!context) ? context : document;
            base.selectors = true;
            return context.querySelectorAll(selector);
        }
        document.addEventListener('DOMContentLoaded', fireContentLoaded, false); 

    } else {
        // note that at this time, Sizzle is not Internet Explorer compatible
        console.warn('Selectors API not available. Falling back on Sizzle query selector.');
        new Ajax.Request('../source/sizzle.min.js', {
            method: 'get',
            format: 'text',
            onSuccess: function(o) {
                o += 'window.$ = Sizzle';
                eval(o); // FF2,FF3 < 10ms
                // $(selector) is now available
                if(
                    base.browser.webkit && 
                    parseInt(base.browser.version) < 525
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
            },
            onFailure: function(o) {
                console.error('Horrible failure getting Sizzle. That sucks.')
            }
        });
    }
})();
