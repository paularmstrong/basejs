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
})



document.addEventListener('dom:loaded', function() { hashLinkManager.instance = new hashLinkManager(); }, true);