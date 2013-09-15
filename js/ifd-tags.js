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
        try {
            value.push(valueSeeker());
        } catch (e) {
            console.error("Failed resolve value on offset " + valueOffset + "; tag #" + tagCode);
            return null;
        }
    }

    console.debug("IFD tag #" + tagCode + " of type " + type + "; number of values: " + valueCount + ", offset: " + valueOffset);

    return new IFDTag.create(tagCode, value);
}

function IFDTag() {
    this.code  = 0;
    this.name  = '';
    this.value = [];
}

IFDTag.create = function (code, value) {
    var tag = new IFDTag;

    tag.code = code;
    tag.value = value;

    if (code in IFDTagFactory.tagMap) {
        var tagMeta = IFDTagFactory.tagMap[code];
        tag.name = tagMeta.name;
        if (tagMeta.values) {
            for (var i = 0; i < value.length; i ++) {
                var subval = value[i],
                    found = null;
                for (var j = 0; j < tagMeta.values.length; j ++) {
                    if (tagMeta.values[j] == subval) {
                        found = j;
                        break;
                    }
                }
                if (found === null) {
                    console.error("Unknown value for tag #" + code + "; value = " + subval);
                } else if (tagMeta.values_desc && found in tagMeta.values_desc) {
                    tag.value[i] = tagMeta.values_desc[found];
                }
            }
        }
    }

    return tag;
}

IFDTagFactory.tagMap = {
    "262": {
        "tag": 262,
        "name": "PhotometricInterpretation",
        "type": "SHORT",
        "values": [0, 1, 2, 3, 4],
        "values_desc": ["WhiteIsZero", "BlackIsZero", "RGB", "Palette-color", "Transparency Mask"]
    },
    "259": {
        "tag": 259,
        "name": "Compression",
        "type": "SHORT",
        "values": [1, 2, 3, 4, 32773],
        "values_desc": ["No compression", "CCITT Group 3 1-Dimensional Modified Huffman run length encoding", "T4-encoding", "T6-encoding", "PackBits compression"]
    },
    "257": {
        "tag": 257,
        "name": "ImageLength",
        "type": "SHORT or LONG"
    },
    "256": {
        "tag": 256,
        "name": "ImageWidth",
        "type": "SHORT or LONG"
    },
    "296": {
        "tag": 296,
        "name": "ResolutionUnit",
        "type": "SHORT",
        "values": [1, 2, 3],
        "values_desc": ["No absolute unit of measurement", "Inch", "Cantimeter"],
        "default": 2
    },
    "282": {
        "tag": 282,
        "name": "XResolution",
        "type": "RATIONAL"
    },
    "283": {
        "tag": 283,
        "name": "YResolution",
        "type": "RATIONAL"
    },
    "278": {
        "tag": 278,
        "name": "RowsPerStrip",
        "type": "SHORT or LONG"
    },
    "273": {
        "tag": 273,
        "name": "StripOffsets",
        "type": "SHORT or LONG"
    },
    "279": {
        "tag": 279,
        "name": "StripByteCounts",
        "type": "SHORT or LONG"
    },
    "258": {
        "tag": 258,
        "name": "BitsPerSample",
        "type": "SHORT"
    },
    "320": {
        "tag": 320,
        "name": "ColorMap",
        "type": "SHORT"
    },
    "277": {
        "tag": 277,
        "name": "SamplesPerPixel",
        "type": "SHORT"
    },
    "315": {
        "tag": 315,
        "name": "Artist",
        "type": "ASCII"
    },
    "265": {
        "tag": 265,
        "name": "CellLength",
        "type": "SHORT"
    },
    "264": {
        "tag": 264,
        "name": "CellWidth",
        "type": "SHORT"
    },
    "33432": {
        "tag": 33432,
        "name": "Copyright",
        "type": "ASCII"
    },
    "306": {
        "tag": 306,
        "name": "DateTime",
        "type": "ASCII"
    },
    "338": {
        "tag": 338,
        "name": "ExtraSamples",
        "type": "SHORT",
        "values": [0, 1, 2],
        "values_desc": ["Unspecified data", "Associated alpha data", "Unassociated alpha data"]
    },
    "266": {
        "tag": 266,
        "name": "FillOrder",
        "type": "SHORT",
        "values": [1, 2]
    },
    "289": {
        "tag": 289,
        "name": "FreeByteCounts",
        "type": "LONG"
    },
    "288": {
        "tag": 288,
        "name": "FreeOffsets",
        "type": "LONG"
    },
    "291": {
        "tag": 291,
        "name": "GrayResponseCurve",
        "type": "SHORT"
    },
    "290": {
        "tag": 290,
        "name": "GrayResponseUnit",
        "type": "SHORT"
    },
    "316": {
        "tag": 316,
        "name": "HostComputer",
        "type": "ASCII"
    },
    "270": {
        "tag": 270,
        "name": "ImageDescription",
        "type": "ASCII"
    },
    "271": {
        "tag": 271,
        "name": "Make",
        "type": "ASCII"
    },
    "281": {
        "tag": 281,
        "name": "MaxSampleValue",
        "type": "SHORT"
    },
    "280": {
        "tag": 280,
        "name": "MinSampleValue",
        "type": "SHORT"
    },
    "272": {
        "tag": 272,
        "name": "Model",
        "type": "ASCII"
    },
    "305": {
        "tag": 305,
        "name": "Software",
        "type": "ASCII"
    },
    "254": {
        "tag": 254,
        "name": "NewSubfileType",
        "type": "LONG"
    },
    "274": {
        "tag": 274,
        "name": "Orientation",
        "type": "SHORT"
    },
    "284": {
        "tag": 284,
        "name": "PlanarConfiguration",
        "type": "SHORT",
        "values": [1, 2],
        "values_desc": ["Chunky", "Planar"]
    },
    "255": {
        "tag": 255,
        "name": "SubfileType",
        "type": "SHORT",
        "values": [1, 2, 3],
        "values_desc": ["full-resolution image data", "reduced-resolution image data", "a single page of a multi-page image"]
    },
    "263": {
        "tag": 263,
        "name": "Threshholding",
        "type": "SHORT",
        "values": [1, 2, 3]
    },
    "292": {
        "tag": 292,
        "name": "T4Options",
        "type": "LONG"
    },
    "293": {
        "tag": 293,
        "name": "T6Options",
        "type": "LONG"
    },
    "269": {
        "tag": 269,
        "name": "DocumentName",
        "type": "ASCII"
    },
    "285": {
        "tag": 285,
        "name": "PageName",
        "type": "ASCII"
    },
    "297": {
        "tag": 297,
        "name": "PageNumber",
        "type": "SHORT"
    },
    "317": {
        "tag": 317,
        "name": "Predictor",
        "type": "SHORT",
        "values": [1, 2],
        "values_desc": ["No prediction scheme", "Horizontal differencing"]
    }
};
