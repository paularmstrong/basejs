// super simple CSS selector. select only by ID or single class name
var $ = function(selector) {
    if(typeof document.querySelectorAll !== 'function') {
        return document.querySelectorAll(selector);
    } else {
        if(selector.indexOf('#') == 0) {
            return [document.getElementById(selector.replace('#', ''))];
        } else if(selector.indexOf('.') == 0) {
            return document.getElementsByClassName(selector.replace(/\./, ''));
        }
    }
};

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

Ajax.Request = function(url, options) {
    this.options = new Ajax(options);

    this.transport = new XMLHttpRequest();
    
    if(this.options.method.toLowerCase() == 'get') {
        url += (this.url.indexOf('?') >= 0) ? '&' : '?' + params;
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
};
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
        	var response = new Ajax.Response(this.transport, this.options.format, this.options.sanitizeJSON)

        	// if complete, check for onFailure or onSuccess and fire function if available
            if(this.options.onFailure || this.options.onSuccess) {
                try {
                    (this.options['on'+Ajax.Request.Events[this.getSuccessCode()]] || function() {} )(response);
                } catch(e) { /* fail silently */ }
            }

        	// if onEvent function is available for this state
            try {
        	    (this.options['on'+Ajax.Request.Events[state]] || function() {})(response);
            } catch(e) { /* fail silently */ }

            // kill that object. we don't need it.
            delete response;
    	} else {
    	    try {
    			(this.options['on'+Ajax.Request.Events[state]] || function() {})();
    	    } catch(e) { /* fail silently */ }
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
            /* Force "Connection: close" for older Mozilla browsers to work
             * around a bug where XMLHttpRequest sends an incorrect
             * Content-length header. See Mozilla Bugzilla #246651.
             */
            //headers['Content-length'] = this.options.params.length;
            //headers['Connection'] = 'close';
        }

        for(var name in headers) {
            if(typeof headers[name] != 'function') {
                this.transport.setRequestHeader(name, headers[name]);
            }
        }
    }
});

Ajax.Response = function(response, format, sanitize) {
	this.response = response;
	this.format = format;
	this.sanitizeJSON = sanitize;

    try {
    	return this.getResponse();
    } catch(e) {
        return null;
    }
};
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

var Element = function(type, atts) {
    this.el = document.createElement(type);

    for(attr in atts) {
        this.el.setAttribute(attr, atts[attr]);
    }
    
    return this.el;
};

