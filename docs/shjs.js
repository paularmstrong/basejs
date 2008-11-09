/*
SHJS - Syntax Highlighting in JavaScript
Copyright (C) 2007, 2008 gnombat@users.sourceforge.net
License: http://shjs.sourceforge.net/doc/license.html
*/

if (! this.sh_languages) {
  this.sh_languages = {};
}
var sh_requests = {};

function sh_highlightString(inputString, language, builder) {
  var patternStack = {
    _stack: [],
    getLength: function() {
      return this._stack.length;
    },
    getTop: function() {
      var stack = this._stack;
      var length = stack.length;
      if (length === 0) {
        return undefined;
      }
      return stack[length - 1];
    },
    push: function(state) {
      this._stack.push(state);
    },
    pop: function() {
      if (this._stack.length === 0) {
        throw "pop on empty stack";
      }
      this._stack.pop();
    }
  };

  // the current position within inputString
  var pos = 0;

  // the name of the current style, or undefined if there is no current style
  var currentStyle = undefined;

  var output = function(s, style) {
    var length = s.length;
    // this is more than just an optimization - we don't want to output empty <span></span> elements
    if (length === 0) {
      return;
    }
    if (! style) {
      var pattern = patternStack.getTop();
      if (pattern !== undefined && !('state' in pattern)) {
        style = pattern.style;
      }
    }
    if (currentStyle !== style) {
      if (currentStyle) {
        builder.endElement();
      }
      if (style) {
        builder.startElement(style);
      }
    }
    builder.text(s);
    pos += length;
    currentStyle = style;
  };

  var endOfLinePattern = /\r\n|\r|\n/g;
  endOfLinePattern.lastIndex = 0;
  var inputStringLength = inputString.length;
  while (pos < inputStringLength) {
    var start = pos;
    var end;
    var startOfNextLine;
    var endOfLineMatch = endOfLinePattern.exec(inputString);
    if (endOfLineMatch === null) {
      end = inputStringLength;
      startOfNextLine = inputStringLength;
    }
    else {
      end = endOfLineMatch.index;
      startOfNextLine = endOfLinePattern.lastIndex;
    }

    var line = inputString.substring(start, end);

    var matchCache = null;
    var matchCacheState = -1;
    for (;;) {
      var posWithinLine = pos - start;
      var pattern = patternStack.getTop();
      var stateIndex = pattern === undefined? 0: pattern.next;
      var state = language[stateIndex];
      var numPatterns = state.length;
      if (stateIndex !== matchCacheState) {
        matchCache = [];
      }
      var bestMatch = null;
      var bestMatchIndex = -1;
      for (var i = 0; i < numPatterns; i++) {
        var match;
        if (stateIndex === matchCacheState && (matchCache[i] === null || posWithinLine <= matchCache[i].index)) {
          match = matchCache[i];
        }
        else {
          var regex = state[i].regex;
          regex.lastIndex = posWithinLine;
          match = regex.exec(line);
          matchCache[i] = match;
        }
        if (match !== null && (bestMatch === null || match.index < bestMatch.index)) {
          bestMatch = match;
          bestMatchIndex = i;
        }
      }
      matchCacheState = stateIndex;

      if (bestMatch === null) {
        output(line.substring(posWithinLine), null);
        break;
      }
      else {
        // got a match
        if (bestMatch.index > posWithinLine) {
          output(line.substring(posWithinLine, bestMatch.index), null);
        }

        pattern = state[bestMatchIndex];

        var newStyle = pattern.style;
        var matchedString;
        if (newStyle instanceof Array) {
          for (var subexpression = 0; subexpression < newStyle.length; subexpression++) {
            matchedString = bestMatch[subexpression + 1];
            output(matchedString, newStyle[subexpression]);
          }
        }
        else {
          matchedString = bestMatch[0];
          output(matchedString, newStyle);
        }

        if ('next' in pattern) {
          // this was the start of a delimited pattern or a state/environment
          patternStack.push(pattern);
        }
        else {
          // this was an ordinary pattern
          if ('exit' in pattern) {
            patternStack.pop();
          }
          if ('exitall' in pattern) {
            while (patternStack.getLength() > 0) {
              patternStack.pop();
            }
          }
        }
      }
    }

    // end of the line
    if (currentStyle) {
      builder.endElement();
    }
    currentStyle = undefined;
    if (endOfLineMatch) {
      builder.text(endOfLineMatch[0]);
    }
    pos = startOfNextLine;
  }
}

////////////////////////////////////////////////////////////////////////////////
// DOM-dependent functions

function sh_getClasses(element) {
  var result = [];
  var htmlClass = element.className;
  if (htmlClass && htmlClass.length > 0) {
    var htmlClasses = htmlClass.split(" ");
    for (var i = 0; i < htmlClasses.length; i++) {
      if (htmlClasses[i].length > 0) {
        result.push(htmlClasses[i]);
      }
    }
  }
  return result;
}

function sh_addClass(element, name) {
  var htmlClasses = sh_getClasses(element);
  for (var i = 0; i < htmlClasses.length; i++) {
    if (name.toLowerCase() === htmlClasses[i].toLowerCase()) {
      return;
    }
  }
  htmlClasses.push(name);
  element.className = htmlClasses.join(" ");
}

/**
Extracts the text of an element.
@param  element  a DOM <pre> element
@return  the element's text
*/
function sh_getText(element) {
// only works in some browsers
//   if (element.nodeType === element.TEXT_NODE ||
//       element.nodeType === element.CDATA_SECTION_NODE) {
  if (element.nodeType === 3 ||
      element.nodeType === 4) {
    return element.data;
  }
  else if (element.nodeType === 1 && element.tagName === "BR") {
    return "\n";
  }
  else if (element.childNodes.length === 1) {
    return sh_getText(element.firstChild);
  }
  else {
    var result = '';
    for (var i = 0; i < element.childNodes.length; i++) {
      result += sh_getText(element.childNodes.item(i));
    }
    return result;
  }
}

function sh_isEmailAddress(url) {
  if (/^mailto:/.test(url)) {
    return false;
  }
  return url.indexOf('@') !== -1;
}

var sh_builder = {
  init: function(htmlDocument, element) {
    while (element.hasChildNodes()) {
      element.removeChild(element.firstChild);
    }
    this._document = htmlDocument;
    this._element = element;
    this._currentText = null;
    // we use a DocumentFragment because it is faster to build a DOM "offline"
    this._documentFragment = htmlDocument.createDocumentFragment();
    this._currentParent = this._documentFragment;
    // it is faster to clone an existing element than to create from scratch
    this._span = htmlDocument.createElement("span");
    this._a = htmlDocument.createElement("a");
  },
  startElement: function(style) {
//    this._appendText();
    if (this._currentText !== null) {
      this._currentParent.appendChild(this._document.createTextNode(this._currentText));
      this._currentText = null;
    }
    var span = this._span.cloneNode(true);
    span.className = style;
    this._currentParent.appendChild(span);
    this._currentParent = span;
  },
  endElement: function() {
//    this._appendText();
    if (this._currentText !== null) {
      if (this._currentParent.className === 'sh_url') {
        var a = this._a.cloneNode(true);
        a.className = 'sh_url';
        var url = this._currentText;
        if (url.length > 0 && url.charAt(0) === '<' && url.charAt(url.length - 1) === '>') {
          url = url.substr(1, url.length - 2);
        }
        if (sh_isEmailAddress(url)) {
          url = 'mailto:' + url;
        }
        a.setAttribute('href', url);
        a.appendChild(this._document.createTextNode(this._currentText));
        this._currentParent.appendChild(a);
      }
      else {
        this._currentParent.appendChild(this._document.createTextNode(this._currentText));
      }
      this._currentText = null;
    }
    this._currentParent = this._currentParent.parentNode;
  },
  text: function(s) {
    if (this._currentText === null) {
      this._currentText = s;
    }
    else {
      this._currentText += s;
    }
  },
/*
  _appendText: function() {
    if (this._currentText !== null) {
      this._currentParent.appendChild(this._document.createTextNode(this._currentText));
      this._currentText = null;
    }
  },
*/
  close: function() {
//    this._appendText();
    if (this._currentText !== null) {
      this._currentParent.appendChild(this._document.createTextNode(this._currentText));
      this._currentText = null;
    }
    this._element.appendChild(this._documentFragment);
  }
};

/**
Highlights an element containing source code.  Upon completion of this function,
the element will have been placed in the "sh_sourceCode" class.
@param  element  a DOM <pre> element containing the source code to be highlighted
@param  language  a language definition object
*/
function sh_highlightElement(htmlDocument, element, language) {
  sh_addClass(element, "sh_sourceCode");
  var inputString;
  if (element.childNodes.length === 0) {
    return;
  }
  else {
    inputString = sh_getText(element);
  }

  sh_builder.init(htmlDocument, element);
  sh_highlightString(inputString, language, sh_builder);
  sh_builder.close();
}

function sh_getXMLHttpRequest() {
  if (window.ActiveXObject) {
    return new ActiveXObject("Msxml2.XMLHTTP");
  }
  else if (window.XMLHttpRequest) {
    return new XMLHttpRequest();
  }
  throw "No XMLHttpRequest implementation available";
}

function sh_load(language, prefix, suffix) {
  if (language in sh_requests) {
    return;
  }
  sh_requests[language] = 1;
  var request = sh_getXMLHttpRequest();
  var url = prefix + 'sh_' + language + suffix;
  request.open('GET', url, true);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      try {
        if (request.status === 0 || request.status === 200) {
          eval(request.responseText);
          var nodeList = document.getElementsByTagName("pre");
          for (var i = 0; i < nodeList.length; i++) {
            var element = nodeList.item(i);
            var htmlClasses = sh_getClasses(element);
            for (var j = 0; j < htmlClasses.length; j++) {
              var htmlClass = htmlClasses[j].toLowerCase();
              if (htmlClass === "sh_sourcecode") {
                continue;
              }
              if (htmlClass === "sh_" + language) {
                sh_highlightElement(document, element, sh_languages[language]);
                break;
              }
            }
          }
        }
        else {
          throw "HTTP error: status " + request.status;
        }
      }
      finally {
        request = null;
      }
    }
  };
  request.send(null);
}

/**
Highlights all elements containing source code on the current page. Elements
containing source code must be "pre" elements with a "class" attribute of
"sh_LANGUAGE", where LANGUAGE is a valid language identifier; e.g., "sh_java"
identifies the element as containing "java" language source code.
*/
function sh_highlightHTMLDocument(htmlDocument, prefix, suffix) {
  var nodeList = htmlDocument.getElementsByTagName("pre");
  for (var i = 0; i < nodeList.length; i++) {
    var element = nodeList.item(i);
    var htmlClasses = sh_getClasses(element);
    for (var j = 0; j < htmlClasses.length; j++) {
      var htmlClass = htmlClasses[j].toLowerCase();
      if (htmlClass === "sh_sourcecode") {
        continue;
      }
      if (htmlClass.substr(0, 3) === "sh_") {
        var language = htmlClass.substring(3);
        if (language in sh_languages) {
          sh_highlightElement(htmlDocument, element, sh_languages[language]);
        }
        else if (typeof(prefix) === 'string' && typeof(suffix) === 'string') {
          sh_load(language, prefix, suffix);
        }
        else {
          throw "Found <pre> element with class='" + htmlClass + "', but no such language exists";
        }
        break;
      }
    }
  }
}

/**
The current page is specified via the "document" property of the global object.
*/
function sh_highlightDocument(prefix, suffix) {
  sh_highlightHTMLDocument(document, prefix, suffix);
}

if (! this.sh_languages) {
  this.sh_languages = {};
}
sh_languages['javascript'] = [
  [
    {
      'next': 1,
      'regex': /\/\/\//g,
      'style': 'sh_comment'
    },
    {
      'next': 7,
      'regex': /\/\//g,
      'style': 'sh_comment'
    },
    {
      'next': 8,
      'regex': /\/\*\*/g,
      'style': 'sh_comment'
    },
    {
      'next': 14,
      'regex': /\/\*/g,
      'style': 'sh_comment'
    },
    {
      'regex': /\/(?:\\.|[^\\\/])+\/[gim]*(?![*\/])/g,
      'style': 'sh_regexp'
    },
    {
      'regex': /\b[+-]?(?:(?:0x[A-Fa-f0-9]+)|(?:(?:[\d]*\.)?[\d]+(?:[eE][+-]?[\d]+)?))u?(?:(?:int(?:8|16|32|64))|L)?\b/g,
      'style': 'sh_number'
    },
    {
      'next': 15,
      'regex': /"/g,
      'style': 'sh_string'
    },
    {
      'next': 16,
      'regex': /'/g,
      'style': 'sh_string'
    },
    {
      'regex': /\b(?:abstract|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|final|finally|for|function|goto|if|implements|in|instanceof|interface|native|new|null|private|protected|public|return|static|super|switch|synchronized|throw|throws|this|transient|true|try|typeof|var|volatile|while|with)\b/g,
      'style': 'sh_keyword'
    },
    {
      'regex': /\b(?:int|byte|boolean|char|long|float|double|short|void)\b/g,
      'style': 'sh_type'
    },
    {
      'regex': /~|!|%|\^|\*|\(|\)|-|\+|=|\[|\]|\\|:|;|,|\.|\/|\?|&|<|>|\|/g,
      'style': 'sh_symbol'
    },
    {
      'regex': /\{|\}/g,
      'style': 'sh_cbracket'
    },
    {
      'regex': /(?:[A-Za-z]|_|\$)[A-Za-z0-9_\$]*[ \t]*(?=\()/g,
      'style': 'sh_function'
    }
  ],
  [
    {
      'exit': true,
      'regex': /$/g
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_\.\/\-_]+@[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'next': 2,
      'regex': /<!DOCTYPE/g,
      'state': 1,
      'style': 'sh_preproc'
    },
    {
      'next': 4,
      'regex': /<!--/g,
      'style': 'sh_comment'
    },
    {
      'regex': /<(?:\/)?[A-Za-z][A-Za-z0-9]*(?:\/)?>/g,
      'style': 'sh_keyword'
    },
    {
      'next': 5,
      'regex': /<(?:\/)?[A-Za-z][A-Za-z0-9]*/g,
      'state': 1,
      'style': 'sh_keyword'
    },
    {
      'regex': /&(?:[A-Za-z0-9]+);/g,
      'style': 'sh_preproc'
    },
    {
      'regex': /@[A-Za-z]+/g,
      'style': 'sh_type'
    },
    {
      'regex': /(?:TODO|FIXME)(?:[:]?)/g,
      'style': 'sh_todo'
    }
  ],
  [
    {
      'exit': true,
      'regex': />/g,
      'style': 'sh_preproc'
    },
    {
      'next': 3,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'regex': /\\(?:\\|")/g
    },
    {
      'exit': true,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'exit': true,
      'regex': /-->/g,
      'style': 'sh_comment'
    },
    {
      'next': 4,
      'regex': /<!--/g,
      'style': 'sh_comment'
    }
  ],
  [
    {
      'exit': true,
      'regex': /(?:\/)?>/g,
      'style': 'sh_keyword'
    },
    {
      'regex': /[^=" \t>]+/g,
      'style': 'sh_type'
    },
    {
      'regex': /=/g,
      'style': 'sh_symbol'
    },
    {
      'next': 6,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'regex': /\\(?:\\|")/g
    },
    {
      'exit': true,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'exit': true,
      'regex': /$/g
    }
  ],
  [
    {
      'exit': true,
      'regex': /\*\//g,
      'style': 'sh_comment'
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_\.\/\-_]+@[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'next': 9,
      'regex': /<!DOCTYPE/g,
      'state': 1,
      'style': 'sh_preproc'
    },
    {
      'next': 11,
      'regex': /<!--/g,
      'style': 'sh_comment'
    },
    {
      'regex': /<(?:\/)?[A-Za-z][A-Za-z0-9]*(?:\/)?>/g,
      'style': 'sh_keyword'
    },
    {
      'next': 12,
      'regex': /<(?:\/)?[A-Za-z][A-Za-z0-9]*/g,
      'state': 1,
      'style': 'sh_keyword'
    },
    {
      'regex': /&(?:[A-Za-z0-9]+);/g,
      'style': 'sh_preproc'
    },
    {
      'regex': /@[A-Za-z]+/g,
      'style': 'sh_type'
    },
    {
      'regex': /(?:TODO|FIXME)(?:[:]?)/g,
      'style': 'sh_todo'
    }
  ],
  [
    {
      'exit': true,
      'regex': />/g,
      'style': 'sh_preproc'
    },
    {
      'next': 10,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'regex': /\\(?:\\|")/g
    },
    {
      'exit': true,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'exit': true,
      'regex': /-->/g,
      'style': 'sh_comment'
    },
    {
      'next': 11,
      'regex': /<!--/g,
      'style': 'sh_comment'
    }
  ],
  [
    {
      'exit': true,
      'regex': /(?:\/)?>/g,
      'style': 'sh_keyword'
    },
    {
      'regex': /[^=" \t>]+/g,
      'style': 'sh_type'
    },
    {
      'regex': /=/g,
      'style': 'sh_symbol'
    },
    {
      'next': 13,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'regex': /\\(?:\\|")/g
    },
    {
      'exit': true,
      'regex': /"/g,
      'style': 'sh_string'
    }
  ],
  [
    {
      'exit': true,
      'regex': /\*\//g,
      'style': 'sh_comment'
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_\.\/\-_]+@[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'regex': /(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_]+(?:>?)/g,
      'style': 'sh_url'
    },
    {
      'regex': /(?:TODO|FIXME)(?:[:]?)/g,
      'style': 'sh_todo'
    }
  ],
  [
    {
      'exit': true,
      'regex': /"/g,
      'style': 'sh_string'
    },
    {
      'regex': /\\./g,
      'style': 'sh_specialchar'
    }
  ],
  [
    {
      'exit': true,
      'regex': /'/g,
      'style': 'sh_string'
    },
    {
      'regex': /\\./g,
      'style': 'sh_specialchar'
    }
  ]
];