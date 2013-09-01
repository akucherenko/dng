function FileCollector() {
    return this;
}
FileCollector.prototype.newObserver = function () {
    return this;
}
FileCollector.prototype.notify = function (file) {
    console.debug("FileCollector received new file.");

    if (!file.type || file.type != "image/x-adobe-dng") {
        console.error("Invalid file type.");
    } else {
        console.debug("Got DNG file.");
    }
}