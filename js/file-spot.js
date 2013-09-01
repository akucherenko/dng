function FileSpot() {
    console.debug("File spot created.");
    this.spot  = null;
    this.obsrv = [];
    return this;
}
FileSpot.prototype.setOn = function(target) {
    console.debug("File spot set on:", target);
    var that = this;
    this.spot = target;
    target.ondragover  = function (e) { that.activate(); e.preventDefault(); };
    target.ondragleave = function (e) { that.deactivate(); e.preventDefault(); };
    target.ondrop      = function (e) { that.deactivate(); that.catchFile(e.dataTransfer.files[0]); e.preventDefault(); };
}
FileSpot.prototype.activate = function() {
    this.spot.style.background = "#cccccc";
}
FileSpot.prototype.deactivate = function() {
    this.spot.style.background = "#ffffff";
}
FileSpot.prototype.catchFile = function(file) {
    console.debug("New file spotted: ", file);
    for (var i = this.obsrv.length - 1; i >= 0; i--) {
        this.obsrv[i].notify(file);
    };
}
FileSpot.prototype.attachObserver = function(observer) {
    this.obsrv.push(observer);
}
