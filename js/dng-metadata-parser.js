function DngMetadataParser(tagFactory) {
    this.tagFactory = tagFactory;
    this.fileData   = null;
    this.callback   = function(tags) {};
    return this;
}
DngMetadataParser.prototype.setFile = function(byteData) {
    this.fileData = byteData;
}
DngMetadataParser.prototype.readMetadata = function() {
    var ifdOffset = this.fileData.getInt32(4),
        ifdRecordCount = this.fileData.getUint16(ifdOffset),
        tags = [];

    console.debug(this.fileData.getInt8(ifdOffset));
    console.debug("IFD record count: ", ifdRecordCount);

    for (var i = 0, offset = ifdOffset + 2; i < ifdRecordCount; i ++) {
        var tag = this.tagFactory.readTag(this.fileData, offset);
        offset += 12;
        if (tag) {
            tags.push(tag);
        }
    }

    this.callback(tags);
}
DngMetadataParser.prototype.whenReady = function(callback) {
    this.callback = callback;
}
