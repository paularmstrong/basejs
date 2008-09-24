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
        var target = $(id);
        var container = target[0].parentNode;
        
        var subNav = $('ul', container)[0];
        if(!subNav || subNav.parentNode == $('#nav')[0]) { return; }
        
        this.currentlist = new Element('ul', {}, subNav.innerHTML);
        
        e.target.parentNode.appendChild(this.currentlist);
    },
    removeOldNavs: function() {
        if(!!this.currentlist && !!this.currentlist.parentNode) {
            this.currentlist.parentNode.removeChild(this.currentlist);
        }
    }
});

var navItem = function(el) {
    this.id = el.href.match(/#\S+/);
    this.container = $(this.id[0]).parentNode;
    this.subNav = '<ul>'+$('ul', this.container)[0].innerHTML+'</ul>';
        
    return this.subNav;
};

var docFxs = function() {
    this.navigation = new navigation();
    sh_highlightDocument();
};


document.addEventListener('dom:loaded', function() { docFxs.instance = new docFxs(); }, true);