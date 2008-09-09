Object.extend = function(destination, source) {
  for(var property in source) {
      destination[property] = source[property];
  }
  return destination;
};

Object.prototype.addMethods = function(methods) {
    for(var method in methods) {
        this.prototype[method] = methods[method];
    }
    return this;
};

Object.addMethods({
    isArray: function(object) {
        return (object != null && typeof object == "object" && 'splice' in object && 'join' in object);
    },
    toQueryString: function() {
        var params = []
        for(key in this) {
            var str = '';
            if(typeof this[key] != 'function') {
                str = encodeURIComponent(key)+'=';
                var value = (Object.isArray(this[key])) ? this[key].join(',') : this[key];
                str += encodeURIComponent(value);
                params.push(str)
            }
        }
        return params.join('&');
    },
    each: function(iterator, context) {
        iterator = iterator.bind(context);
        try {
            var c = this.length, i = 0;
            while(i<c) { iterator(this[i]); i++ }
        } catch(e) { throw e; }
        return this;
    }
});

Function.addMethods({
    bindAsEventListener: function() {
        var __method = this, object = arguments[0];
        return function(event) {
            return __method.apply(object, [event || window.event].concat(arguments));
        }
    },
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
		format: '',
		sanitizeJSON: false
    };
    
    Object.extend(this.options, options || {});
    this.options.method = this.options.method.toLowerCase();
    
    return this.options;
};
Object.extend(Ajax, {
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

var Element = function(type, atts) {
    this.el = document.createElement(type);

    for(attr in atts) {
        if(typeof this.el[attr] !== 'function') {
            this.el.setAttribute(attr, atts[attr]);
        }
    }
    return this.el;
};

// Create our magic query selector. Load in Sizzle if necessary.
(function() {
    if(typeof document.querySelectorAll === 'function') {
        window.$ = function(selector) {
            return document.querySelectorAll(selector);
        }
    } else {
        // note that at this time, Sizzle is not Internet Explorer compatible
        console.warn('Falling back on Sizzle query selector.');
        new Ajax.Request('sizzle.min.js', {
            method: 'get',
            format: 'text',
            onSuccess: function(o) {
                eval(o); // FF3 < 50ms, Safari3 < 5ms
                // $(selector) is now available
            },
            onFailure: function(o) {
                console.error('horrible failure getting sizzle')
            }
        });
    }
})();