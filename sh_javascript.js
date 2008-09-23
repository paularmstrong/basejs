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