var navigation = function() {
    this.navs = [];
    this.links = $('#nav a');
    this.links.each(function(el) {
        el.addEventListener('click', function(e) {
            this.removeOldNavs(e);
            this.addSubNav(e);
        }.bindAsEventListener(this), true);
    }, this);
};

base.extend(navigation.prototype, {
    addSubNav: function(e) {
        var id = e.target.href.match(/#\S+$/)+'';
        var container = $(id)[0].parentNode;
        var subNav = $('ul', container)[0];
        if(subNav.parentNode == $('#nav')[0]) { return; }
        
        var list = new Element('ul', {}, subNav.innerHTML);

        e.target.parentNode.appendChild(list);
    },
    removeOldNavs: function() {
        var navs = $('#nav ul ul');
        navs.each(function(sub) {
            sub.parentNode.removeChild(sub);
        });
    }
});

var navItem = function(el) {
    this.id = el.href.match(/#\S+/);
    this.container = $(this.id[0]).parentNode;
    this.subNav = '<ul>'+$('ul', this.container)[0].innerHTML+'</ul>';
        
    return this.subNav;
};

var hashLink = function(el) {
    this.el = el;
    this.id = this.el.id;
    this.el.addEventListener('click', this.handleClick.bindAsEventListener(this), false);
};

base.extend(hashLink.prototype, {
    handleClick: function(e) {
        window.location.hash = '#'+this.id;
    }
})

var hashLinkManager = function() {
    this.hashLinks = [];
    this.createHashLinks();
    return this.hashLinks;
};

base.extend(hashLinkManager.prototype, {
    createHashLinks: function() {
        $('h2, h3, h4, h5, h6').each(function(el) {
            if(!el.id.blank()) {
                this.hashLinks.push(new hashLink(el));
            }
        }, this);
    }
});

var docFxs = function() {
    this.hashLinkManager = new hashLinkManager();
    this.navigation = new navigation();
};


document.addEventListener('dom:loaded', function() { docFxs.instance = new docFxs(); }, true);