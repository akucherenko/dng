function IFDTagFactory() {
    return this;
}
IFDTagFactory.prototype.readTag = function(fileData, tagOffset) {
    var tagCode = fileData.getUint16(tagOffset),
        type = fileData.getUint16(tagOffset + 2),
        valueCount = fileData.getInt32(tagOffset + 4),
        valueOffset = tagOffset + 12,
        valueSize = 0,
        value = [],
        valueSeeker = function () { return null; },
        fitInFourBytes = function (size) { return (size * valueCount) <= 4; };

    switch (type) {
        case 1:     // byte, 1b
            valueSize = 1;
            valueSeeker = function () { return fileData.getUint8(valueOffset); };
            break;
        case 2:     // ascii, 1b
            valueSize = 1;
            valueSeeker = function () { return fileData.getUint8(valueOffset); };
            break;
        case 3:     // short, 2b
            valueSize = 2;
            valueSeeker = function () { return fileData.getUint16(valueOffset); };
            break;
        case 4:     // long, 4b
            valueSize = 4;
            valueSeeker = function () { return fileData.getUint32(valueOffset); };
            break;
        case 5:     // rational, 8b
            valueSize = 8;
            valueSeeker = function () { return [fileData.getUint32(valueOffset), fileData.getUint32(valueOffset + 4)]; };
        case 6:     // sbyte, 1b
            valueSize = 1;
            valueSeeker = function () { return fileData.getInt8(valueOffset); };
            break;
        case 7:     // undefined, 1b
            valueSize = 1;
            valueSeeker = function () { return fileData.getUint8(valueOffset); };
            break;
        case 8:     // sshort, 2b
            valueSize = 2;
            valueSeeker = function () { return fileData.getInt16(valueOffset); };
            break;
        case 9:     // slong, 4b
            valueSize = 4;
            valueSeeker = function () { return fileData.getInt32(valueOffset); };
            break;
        case 10:    // srational, 8b
            valueSize = 4;
            valueSeeker = function () { return [fileData.getInt32(valueOffset), fileData.getInt32(valueOffset + 4)]; };
        case 11:    // float, 4b
            valueSize = 4;
            valueSeeker = function () { return fileData.getFloat16(valueOffset); };
            break;
        case 12:    // double, 8b
            valueSize = 8;
            valueSeeker = function () { return fileData.getFloat32(valueOffset); };
            break;
        default:
            console.error("Unknown IFD tag: " + type + ", offset: " + tagOffset);
    }

    valueOffset = fitInFourBytes(valueSize) ? valueOffset : fileData.getUint32(valueOffset);

    for (var i = 0; i < valueCount; i ++) {
        valueOffset += valueSize;
        value.push(valueSeeker());
    }

    console.log("IFD tag #" + tagCode + " of type " + type + "; number of values: " + valueCount + ", offset: " + valueOffset);

    return new IFDTag(tagCode, value);
}

function IFDTag(code, value) {
    this.code = code;
    this.value = value;
}
