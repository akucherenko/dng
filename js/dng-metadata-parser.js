function DngMetadataParser() {
    return this;
}
DngMetadataParser.prototype.readMetadata = function(byteData) {
    var ifdOffset = byteData.getInt32(4),
        ifdRecordCount = byteData.getUint16(ifdOffset);

    console.debug(byteData.getInt8(ifdOffset));
    console.debug("IFD record count: ", ifdRecordCount);

    for (var i = 0, offset = ifdOffset + 2; i < ifdRecordCount; i ++) {
        var tag = byteData.getUint16(offset),
            type = byteData.getUint16(offset + 2).toString(16),
            count = byteData.getInt32(offset + 4),
            valueOffset = byteData.getInt32(offset + 12);
        console.log("IFD tag #" + tag + " of type " + type + "; number of values: " + count + ", offset: " + valueOffset);
        offset += 12;
    }
}
