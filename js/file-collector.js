function FileCollector() {
    this.parsers = {};
    return this;
}
FileCollector.prototype.newObserver = function () {
    return this;
}
FileCollector.prototype.notify = function (file) {
    console.debug("FileCollector received new file.");

    if (!file.type || file.type != "image/x-adobe-dng") {
        console.error("Invalid file type.");
        return;
    } else {
        console.debug("Got DNG file.");
    }

    if (file.type in this.parsers) {
        console.debug("Starting parser...");

        var reader = new FileReader();

        reader.onloadend = function (event) {
            var byteOrderBuff = event.originalTarget.result.slice(0,2),
                byteOrder = new DataView(byteOrderBuff);
            if (byteOrder.getInt16(0) == 0x4949) {
                console.debug("The file has little-endian byte order.");
            } else if (byteOrder.getInt16(0) == 0x4d4d) {
                console.debug("The file has big-endian byte order.");
            } else {
                console.error("Invalid file format.");
            }
        };

        reader.readAsArrayBuffer(file);
    }
}
FileCollector.prototype.setMetadataParser = function (type, parser) {
    this.parsers[type] = parser;
}
