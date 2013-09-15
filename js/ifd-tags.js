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
    "254": {
        "tag": 254,
        "name": "NewSubfileType",
        "type": "LONG"
    },
    "255": {
        "tag": 255,
        "name": "SubfileType",
        "type": "SHORT",
        "values": [1, 2, 3],
        "values_desc": ["full-resolution image data", "reduced-resolution image data", "a single page of a multi-page image"]
    },
    "256": {
        "tag": 256,
        "name": "ImageWidth",
        "type": "SHORT or LONG"
    },
    "257": {
        "tag": 257,
        "name": "ImageLength",
        "type": "SHORT or LONG"
    },
    "258": {
        "tag": 258,
        "name": "BitsPerSample",
        "type": "SHORT"
    },
    "259": {
        "tag": 259,
        "name": "Compression",
        "type": "SHORT",
        "values": [1, 2, 3, 4, 32773],
        "values_desc": ["No compression", "CCITT Group 3 1-Dimensional Modified Huffman run length encoding", "T4-encoding", "T6-encoding", "PackBits compression"]
    },
    "262": {
        "tag": 262,
        "name": "PhotometricInterpretation",
        "type": "SHORT",
        "values": [0, 1, 2, 3, 4],
        "values_desc": ["WhiteIsZero", "BlackIsZero", "RGB", "Palette-color", "Transparency Mask"]
    },
    "263": {
        "tag": 263,
        "name": "Threshholding",
        "type": "SHORT",
        "values": [1, 2, 3]
    },
    "264": {
        "tag": 264,
        "name": "CellWidth",
        "type": "SHORT"
    },
    "265": {
        "tag": 265,
        "name": "CellLength",
        "type": "SHORT"
    },
    "266": {
        "tag": 266,
        "name": "FillOrder",
        "type": "SHORT",
        "values": [1, 2]
    },
    "269": {
        "tag": 269,
        "name": "DocumentName",
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
    "272": {
        "tag": 272,
        "name": "Model",
        "type": "ASCII"
    },
    "273": {
        "tag": 273,
        "name": "StripOffsets",
        "type": "SHORT or LONG"
    },
    "274": {
        "tag": 274,
        "name": "Orientation",
        "type": "SHORT",
        "values": [1,3,6,8,9],
        "values_desc": ["horizontal", "horizontal", "vartical", "vertical", "unknown"]
    },
    "277": {
        "tag": 277,
        "name": "SamplesPerPixel",
        "type": "SHORT"
    },
    "278": {
        "tag": 278,
        "name": "RowsPerStrip",
        "type": "SHORT or LONG"
    },
    "279": {
        "tag": 279,
        "name": "StripByteCounts",
        "type": "SHORT or LONG"
    },
    "280": {
        "tag": 280,
        "name": "MinSampleValue",
        "type": "SHORT"
    },
    "281": {
        "tag": 281,
        "name": "MaxSampleValue",
        "type": "SHORT"
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
    "284": {
        "tag": 284,
        "name": "PlanarConfiguration",
        "type": "SHORT",
        "values": [1, 2],
        "values_desc": ["Chunky", "Planar"]
    },
    "285": {
        "tag": 285,
        "name": "PageName",
        "type": "ASCII"
    },
    "288": {
        "tag": 288,
        "name": "FreeOffsets",
        "type": "LONG"
    },
    "289": {
        "tag": 289,
        "name": "FreeByteCounts",
        "type": "LONG"
    },
    "290": {
        "tag": 290,
        "name": "GrayResponseUnit",
        "type": "SHORT"
    },
    "291": {
        "tag": 291,
        "name": "GrayResponseCurve",
        "type": "SHORT"
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
    "296": {
        "tag": 296,
        "name": "ResolutionUnit",
        "type": "SHORT",
        "values": [1, 2, 3],
        "values_desc": ["No absolute unit of measurement", "Inch", "Cantimeter"],
        "default": 2
    },
    "297": {
        "tag": 297,
        "name": "PageNumber",
        "type": "SHORT"
    },
    "305": {
        "tag": 305,
        "name": "Software",
        "type": "ASCII"
    },
    "306": {
        "tag": 306,
        "name": "DateTime",
        "type": "ASCII"
    },
    "315": {
        "tag": 315,
        "name": "Artist",
        "type": "ASCII"
    },
    "316": {
        "tag": 316,
        "name": "HostComputer",
        "type": "ASCII"
    },
    "317": {
        "tag": 317,
        "name": "Predictor",
        "type": "SHORT",
        "values": [1, 2],
        "values_desc": ["No prediction scheme", "Horizontal differencing"]
    },
    "320": {
        "tag": 320,
        "name": "ColorMap",
        "type": "SHORT"
    },
    "330": {
        "tag": 330,
        "name": "SubIFDs",
        "type": "LONG"
    },
    "338": {
        "tag": 338,
        "name": "ExtraSamples",
        "type": "SHORT",
        "values": [0, 1, 2],
        "values_desc": ["Unspecified data", "Associated alpha data", "Unassociated alpha data"]
    },
    "347": {
        "tag": 347,
        "name": "JPEGTables",
        "type": "UNDEFINED"
    },
    "529": {
        "tag": 529,
        "name": "YCbCrCoefficients",
        "type": "RATIONAL"
    },
    "530": {
        "tag": 530,
        "name": "YCbCrSubSampling",
        "type": "SHORT"
    },
    "531": {
        "tag": 531,
        "name": "YcbCrPositioning",
        "type": "SHORT"
    },
    "532": {
        "tag": 532,
        "name": "ReferenceBlackWhite",
        "type": "RATIONAL"
    },
    "33421": {
        "tag": 33421,
        "name": "CFARepeatPatternDim",
        "type": "SHORT",
        "values": [1, 2],
        "values_desc": ["No prediction scheme", "Horizontal differencing"]
    },
    "33422": {
        "tag": 33422,
        "name": "CFAPattern",
        "type": "BYTE"
    },
    "33423": {
        "tag": 33423,
        "name": "BatteryLevel",
        "type": "RATIONAL or ASCII"
    },
    "33432": {
        "tag": 33432,
        "name": "Copyright",
        "type": "ASCII"
    },
    "33434": {
        "tag": 33434,
        "name": "ExposureTime",
        "type": "RATIONAL"
    },
    "33437": {
        "tag": 33437,
        "name": "FNumber",
        "type": "RATIONAL"
    },
    "33723": {
        "tag": 33723,
        "name": "IPTC/NAA",
        "type": "LONG or ASCII"
    },
    "34675": {
        "tag": 34675,
        "name": "InterColorProfile",
        "type": "UNDEFINED"
    },
    "34850": {
        "tag": 34850,
        "name": "ExposureProgram",
        "type": "SHORT"
    },
    "34852": {
        "tag": 34852,
        "name": "SpectralSensitivity",
        "type": "ASCII"
    },
    "34853": {
        "tag": 34853,
        "name": "GPSInfo",
        "type": "LONG"
    },
    "34855": {
        "tag": 34855,
        "name": "ISOSpeedRatings",
        "type": "SHORT"
    },
    "34856": {
        "tag": 34856,
        "name": "OECF",
        "type": "UNDEFINED"
    },
    "34857": {
        "tag": 34857,
        "name": "Interlace",
        "type": "SHORT"
    },
    "34858": {
        "tag": 34858,
        "name": "TimeZoneOffset",
        "type": "SSHORT"
    },
    "34859": {
        "tag": 34859,
        "name": "SelfTimerMode",
        "type": "SHORT"
    },
    "36867": {
        "tag": 36867,
        "name": "DateTimeOriginal",
        "type": "ASCII"
    },
    "37122": {
        "tag": 37122,
        "name": "CompressedBitsPerPixel",
        "type": "RATIONAL"
    },
    "37377": {
        "tag": 37377,
        "name": "ShutterSpeedValue",
        "type": "RATIONAL"
    },
    "37378": {
        "tag": 37378,
        "name": "ApertureValue",
        "type": "RATIONAL"
    },
    "37379": {
        "tag": 37379,
        "name": "BrightnessValue",
        "type": "SRATIONAL"
    },
    "37380": {
        "tag": 37380,
        "name": "ExposureBiasValue",
        "type": "SRATIONAL"
    },
    "37381": {
        "tag": 37381,
        "name": "MaxApertureValue",
        "type": "RATIONAL"
    },
    "37382": {
        "tag": 37382,
        "name": "SubjectDistance",
        "type": "SRATIONAL"
    },
    "37383": {
        "tag": 37383,
        "name": "MeteringMode",
        "type": "SHORT"
    },
    "37384": {
        "tag": 37384,
        "name": "LightSource",
        "type": "SHORT"
    },
    "37385": {
        "tag": 37385,
        "name": "Flash",
        "type": "SHORT"
    },
    "37386": {
        "tag": 37386,
        "name": "FocalLength",
        "type": "RATIONAL"
    },
    "37387": {
        "tag": 37387,
        "name": "FlashEnergy",
        "type": "RATIONAL"
    },
    "37388": {
        "tag": 37388,
        "name": "SpatialFrequencyResponse",
        "type": "UNDEFINED"
    },
    "37389": {
        "tag": 37389,
        "name": "Noise",
        "type": "UNDEFINED"
    },
    "37390": {
        "tag": 37390,
        "name": "FocalPlaneXResolution",
        "type": "RATIONAL"
    },
    "37391": {
        "tag": 37391,
        "name": "FocalPlaneYResolution",
        "type": "RATIONAL"
    },
    "37392": {
        "tag": 37392,
        "name": "FocalPlaneResolutionUnit",
        "type": "SHORT"
    },
    "37393": {
        "tag": 37393,
        "name": "ImageNumber",
        "type": "LONG"
    },
    "37394": {
        "tag": 37394,
        "name": "SecurityClassification",
        "type": "ASCII"
    },
    "37395": {
        "tag": 37395,
        "name": "ImageHistory",
        "type": "ASCII"
    },
    "37396": {
        "tag": 37396,
        "name": "SubjectLocation",
        "type": "SHORT"
    },
    "37397": {
        "tag": 37397,
        "name": "ExposureIndex",
        "type": "RATIONAL"
    },
    "37398": {
        "tag": 37398,
        "name": "TIFF/EPStandardID",
        "type": "BYTE"
    },
    "37399": {
        "tag": 37399,
        "name": "SensingMethod",
        "type": "SHORT"
    },
    "50706": {
        "tag": 50706,
        "name": "DNGVersion",
        "type": "BYTE"
    }
};
