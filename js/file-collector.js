function FileCollector() {
    this.parsers = {};
    return this;
}
FileCollector.prototype.newObserver = function () {
    return this;
}
FileCollector.prototype.notify = function (file) {
    console.debug("FileCollector received new file.");

    if (!file.type || !(file.type in this.parsers)) {
        console.error("Invalid file type.");
        return;
    } else {
        console.debug("Got valid file.");
    }

    console.debug("Reading file...");

    var reader = new FileReader(),
        parser = this.parsers[file.type];

    reader.onloadend = function (event) {
        console.debug(event.originalTarget.result.bytesLength + " bytes read.");

        var byteData = new DataView(event.originalTarget.result);

        if (byteData.getInt16(0) == 0x4d4d) {
            console.debug("The file has big-endian byte order.");
        } else {
            console.error("Invalid file format.");
            return;
        }

        console.debug("Starting parser...");


        parser.readMetadata(byteData);
    };

    reader.readAsArrayBuffer(file);
}
FileCollector.prototype.setMetadataParser = function (type, parser) {
    this.parsers[type] = parser;
}
