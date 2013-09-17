function IFDTagFactory() {
    return this;
}
IFDTagFactory.prototype.readTag = function(fileData, tagOffset) {
    var tagCode = fileData.getUint16(tagOffset),
        type = fileData.getUint16(tagOffset + 2),
        valueCount = fileData.getInt32(tagOffset + 4),
        valueOffset = tagOffset + 8,
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
            valueSeeker = function () { 
                var bytes = [];
                for (var i = 0; i < valueCount; i ++) {
                    bytes.push(String.fromCharCode(fileData.getUint8(valueOffset + i)));
                }
                valueCount = 1;
                return bytes.join("");
            };
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
            valueSize = 8;
            valueSeeker = function () { return [fileData.getInt32(valueOffset), fileData.getInt32(valueOffset + 4)]; };
        case 11:    // float, 4b
            valueSize = 4;
            valueSeeker = function () { return fileData.getFloat32(valueOffset); };
            break;
        case 12:    // double, 8b
            valueSize = 8;
            valueSeeker = function () { return fileData.getFloat64(valueOffset); };
            break;
        default:
            console.error("Unknown IFD tag: " + type + ", offset: " + tagOffset);
    }

    valueOffset = fitInFourBytes(valueSize) ? valueOffset : fileData.getUint32(valueOffset);

    for (var i = 0; i < valueCount; i ++) {
        try {
            value.push(valueSeeker());
        } catch (e) {
            console.error("Failed resolve value on offset " + valueOffset + "; tag #" + tagCode + "; err: " + e);
            return null;
        }
        valueOffset += valueSize;
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
        "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 32803, 34892],
        "values_desc": ["WhiteIsZero", "BlackIsZero", "RGB", 
                        "Palette-color", "Transparency Mask",
                        "Seperated", "YCbCr", "CIE L*a*b*",
                        "CIE L*a*b* (ICC L*a*b*)", "CIE L*a*b* (ITU L*a*b*)",
                        "CFA (Color Filter Array)", "LinearRaw"]
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
    "301": {
        "tag": 301,
        "name": "TransferFunction",
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
    "318": {
        "tag": 318,
        "name": "WhitePoint",
        "type": "RATIONAL"
    },
    "319": {
        "tag": 319,
        "name": "PrimaryChromaticities",
        "type": "RATIONAL"
    },
    "320": {
        "tag": 320,
        "name": "ColorMap",
        "type": "SHORT"
    },
    "321": {
        "tag": 321,
        "name": "HalftoneHints",
        "type": "SHORT"
    },
    "322": {
        "tag": 322,
        "name": "TileWidth",
        "type": "SHORT"
    },
    "323": {
        "tag": 323,
        "name": "TileLength",
        "type": "SHORT"
    },
    "324": {
        "tag": 324,
        "name": "TileOffsets",
        "type": "SHORT"
    },
    "325": {
        "tag": 325,
        "name": "TileByteCounts",
        "type": "SHORT"
    },
    "330": {
        "tag": 330,
        "name": "SubIFDs",
        "type": "LONG"
    },
    "332": {
        "tag": 332,
        "name": "InkSet",
        "type": "SHORT"
    },
    "333": {
        "tag": 333,
        "name": "InkNames",
        "type": "ASCII"
    },
    "334": {
        "tag": 334,
        "name": "NumberOfInks",
        "type": "SHORT"
    },
    "336": {
        "tag": 336,
        "name": "DotRange",
        "type": "BYTE"
    },
    "337": {
        "tag": 337,
        "name": "TargetPrinter",
        "type": "ASCII"
    },
    "338": {
        "tag": 338,
        "name": "ExtraSamples",
        "type": "SHORT",
        "values": [0, 1, 2],
        "values_desc": ["Unspecified data", "Associated alpha data", "Unassociated alpha data"]
    },
    "339": {
        "tag": 339,
        "name": "SampleFormat",
        "type": "SHORT"
    },
    "340": {
        "tag": 340,
        "name": "SMinSampleValue",
        "type": "SHORT"
    },
    "341": {
        "tag": 341,
        "name": "SMaxSampleValue",
        "type": "SHORT"
    },
    "342": {
        "tag": 342,
        "name": "TransferRange",
        "type": "SHORT"
    },
    "343": {
        "tag": 343,
        "name": "ClipPath",
        "type": "BYTE"
    },
    "344": {
        "tag": 344,
        "name": "XClipPathUnits",
        "type": "SSHORT"
    },
    "345": {
        "tag": 345,
        "name": "YClipPathUnits",
        "type": "SSHORT"
    },
    "346": {
        "tag": 346,
        "name": "Indexed",
        "type": "SHORT"
    },
    "347": {
        "tag": 347,
        "name": "JPEGTables",
        "type": "UNDEFINED"
    },
    "351": {
        "tag": 351,
        "name": "OPIProxy",
        "type": "SHORT"
    },
    "512": {
        "tag": 512,
        "name": "JPEGProc",
        "type": "LONG"
    },
    "513": {
        "tag": 513,
        "name": "JPEGInterchangeFormat",
        "type": "LONG"
    },
    "514": {
        "tag": 514,
        "name": "JPEGInterchangeFormatLength",
        "type": "LONG"
    },
    "515": {
        "tag": 515,
        "name": "JPEGRestartInterval",
        "type": "SHORT"
    },
    "517": {
        "tag": 517,
        "name": "JPEGLosslessPredictors",
        "type": "SHORT"
    },
    "518": {
        "tag": 518,
        "name": "JPEGPointTransforms",
        "type": "SHORT"
    },
    "519": {
        "tag": 519,
        "name": "JPEGQTables",
        "type": "LONG"
    },
    "520": {
        "tag": 520,
        "name": "JPEGDCTables",
        "type": "LONG"
    },
    "521": {
        "tag": 521,
        "name": "JPEGACTables",
        "type": "LONG"
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
    "700": {
        "tag": 700,
        "name": "XMLPacket",
        "type": "BYTE"
    },
    "18246": {
        "tag": 18246,
        "name": "Rating",
        "type": "SHORT"
    },
    "18249": {
        "tag": 18249,
        "name": "RatingPercent",
        "type": "SHORT"
    },
    "32781": {
        "tag": 32781,
        "name": "ImageID",
        "type": "ASCII"
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
    "34377": {
        "tag": 34377,
        "name": "ImageResources",
        "type": "BYTE"
    },
    "34665": {
        "tag": 34665,
        "name": "ExifTag",
        "type": "LONG"
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
    "40091": {
        "tag": 40091,
        "name": "XPTitle",
        "type": "BYTE"
    },
    "40092": {
        "tag": 40092,
        "name": "XPComment",
        "type": "BYTE"
    },
    "40093": {
        "tag": 40093,
        "name": "XPAuthor",
        "type": "BYTE"
    },
    "40094": {
        "tag": 40094,
        "name": "XPKeywords",
        "type": "BYTE"
    },
    "40095": {
        "tag": 40095,
        "name": "XPSubject",
        "type": "BYTE"
    },
    "50341": {
        "tag": 50341,
        "name": "PrintImageMatching",
        "type": "UNDEFINED"
    },
    "50706": {
        "tag": 50706,
        "name": "DNGVersion",
        "type": "BYTE"
    },
    "50707": {
        "tag": 50707,
        "name": "DNGBackwardVersion",
        "type": "BYTE"
    },
    "50708": {
        "tag": 50708,
        "name": "UniqueCameraModel",
        "type": "ASCII"
    },
    "50709": {
        "tag": 50709,
        "name": "LocalizedCameraModel",
        "type": "BYTE"
    },
    "50710": {
        "tag": 50710,
        "name": "CFAPlaneColor",
        "type": "BYTE"
    },
    "50711": {
        "tag": 50711,
        "name": "CFALayout",
        "type": "SHORT"
    },
    "50712": {
        "tag": 50712,
        "name": "LinearizationTable",
        "type": "SHORT"
    },
    "50713": {
        "tag": 50713,
        "name": "BlackLevelRepeatDim",
        "type": "SHORT"
    },
    "50714": {
        "tag": 50714,
        "name": "BlackLevel",
        "type": "RATIONAL"
    },
    "50715": {
        "tag": 50715,
        "name": "BlackLevelDeltaH",
        "type": "SRATIONAL"
    },
    "50716": {
        "tag": 50716,
        "name": "BlackLevelDeltaV",
        "type": "SRATIONAL"
    },
    "50717": {
        "tag": 50717,
        "name": "WhiteLevel",
        "type": "SHORT"
    },
    "50718": {
        "tag": 50718,
        "name": "DefaultScale",
        "type": "RATIONAL"
    },
    "50719": {
        "tag": 50719,
        "name": "DefaultCropOrigin",
        "type": "SHORT"
    },
    "50720": {
        "tag": 50720,
        "name": "DefaultCropSize",
        "type": "SHORT"
    },
    "50721": {
        "tag": 50721,
        "name": "ColorMatrix1",
        "type": "SRATIONAL"
    },
    "50722": {
        "tag": 50722,
        "name": "ColorMatrix2",
        "type": "SRATIONAL"
    },
    "50723": {
        "tag": 50723,
        "name": "CameraCalibration1",
        "type": "SRATIONAL"
    },
    "50724": {
        "tag": 50724,
        "name": "CameraCalibration2",
        "type": "SRATIONAL"
    },
    "50725": {
        "tag": 50725,
        "name": "ReductionMatrix1",
        "type": "SRATIONAL"
    },
    "50726": {
        "tag": 50726,
        "name": "ReductionMatrix2",
        "type": "SRATIONAL"
    },
    "50727": {
        "tag": 50727,
        "name": "AnalogBalance",
        "type": "RATIONAL"
    },
    "50728": {
        "tag": 50728,
        "name": "AsShotNeutral",
        "type": "SHORT"
    },
    "50729": {
        "tag": 50729,
        "name": "AsShotWhiteXY",
        "type": "RATIONAL"
    },
    "50730": {
        "tag": 50730,
        "name": "BaselineExposure",
        "type": "SRATIONAL"
    },
    "50731": {
        "tag": 50731,
        "name": "BaselineNoise",
        "type": "RATIONAL"
    },
    "50732": {
        "tag": 50732,
        "name": "BaselineSharpness",
        "type": "RATIONAL"
    },
    "50733": {
        "tag": 50733,
        "name": "BayerGreenSplit",
        "type": "LONG"
    },
    "50734": {
        "tag": 50734,
        "name": "LinearResponseLimit",
        "type": "RATIONAL"
    },
    "50735": {
        "tag": 50735,
        "name": "CameraSerialNumber",
        "type": "ASCII"
    },
    "50736": {
        "tag": 50736,
        "name": "LensInfo",
        "type": "RATIONAL"
    },
    "50737": {
        "tag": 50737,
        "name": "ChromaBlurRadius",
        "type": "RATIONAL"
    },
    "50738": {
        "tag": 50738,
        "name": "AntiAliasStrength",
        "type": "RATIONAL"
    },
    "50739": {
        "tag": 50739,
        "name": "ShadowScale",
        "type": "SRATIONAL"
    },
    "50740": {
        "tag": 50740,
        "name": "DNGPrivateData",
        "type": "BYTE"
    },
    "50741": {
        "tag": 50741,
        "name": "MakerNoteSafety",
        "type": "SHORT"
    },
    "50778": {
        "tag": 50778,
        "name": "CalibrationIlluminant1",
        "type": "SHORT"
    },
    "50779": {
        "tag": 50779,
        "name": "CalibrationIlluminant2",
        "type": "SHORT"
    },
    "50780": {
        "tag": 50780,
        "name": "BestQualityScale",
        "type": "RATIONAL"
    },
    "50781": {
        "tag": 50781,
        "name": "RawDataUniqueID",
        "type": "BYTE"
    },
    "50827": {
        "tag": 50827,
        "name": "OriginalRawFileName",
        "type": "BYTE"
    },
    "50828": {
        "tag": 50828,
        "name": "OriginalRawFileData",
        "type": "UNDEFINED"
    },
    "50829": {
        "tag": 50829,
        "name": "ActiveArea",
        "type": "SHORT"
    },
    "50830": {
        "tag": 50830,
        "name": "MaskedAreas",
        "type": "SHORT"
    },
    "50831": {
        "tag": 50831,
        "name": "AsShotICCProfile",
        "type": "UNDEFINED"
    },
    "50832": {
        "tag": 50832,
        "name": "AsShotPreProfileMatrix",
        "type": "SRATIONAL"
    },
    "50833": {
        "tag": 50833,
        "name": "CurrentICCProfile",
        "type": "UNDEFINED"
    },
    "50834": {
        "tag": 50834,
        "name": "CurrentPreProfileMatrix",
        "type": "SRATIONAL"
    },
    "50879": {
        "tag": 50879,
        "name": "ColorimetricReference",
        "type": "SHORT"
    },
    "50931": {
        "tag": 50931,
        "name": "CameraCalibrationSignature",
        "type": "BYTE"
    },
    "50932": {
        "tag": 50932,
        "name": "ProfileCalibrationSignature",
        "type": "BYTE"
    },
    "50934": {
        "tag": 50934,
        "name": "AsShotProfileName",
        "type": "BYTE"
    },
    "50935": {
        "tag": 50935,
        "name": "NoiseReductionApplied",
        "type": "RATIONAL"
    },
    "50936": {
        "tag": 50936,
        "name": "ProfileName",
        "type": "BYTE"
    },
    "50937": {
        "tag": 50937,
        "name": "ProfileHueSatMapDims",
        "type": "LONG"
    },
    "50938": {
        "tag": 50938,
        "name": "ProfileHueSatMapData1",
        "type": "FLOAT"
    },
    "50939": {
        "tag": 50939,
        "name": "ProfileHueSatMapData2",
        "type": "FLOAT"
    },
    "50940": {
        "tag": 50940,
        "name": "ProfileToneCurve",
        "type": "FLOAT"
    },
    "50941": {
        "tag": 50941,
        "name": "ProfileEmbedPolicy",
        "type": "LONG"
    },
    "50942": {
        "tag": 50942,
        "name": "ProfileCopyright",
        "type": "BYTE"
    },
    "50964": {
        "tag": 50964,
        "name": "ForwardMatrix1",
        "type": "SRATIONAL"
    },
    "50965": {
        "tag": 50965,
        "name": "ForwardMatrix2",
        "type": "SRATIONAL"
    },
    "50966": {
        "tag": 50966,
        "name": "PreviewApplicationName",
        "type": "BYTE"
    },
    "50967": {
        "tag": 50967,
        "name": "PreviewApplicationVersion",
        "type": "BYTE"
    },
    "50968": {
        "tag": 50968,
        "name": "PreviewSettingsName",
        "type": "BYTE"
    },
    "50969": {
        "tag": 50969,
        "name": "PreviewSettingsDigest",
        "type": "BYTE"
    },
    "50970": {
        "tag": 50970,
        "name": "PreviewColorSpace",
        "type": "LONG"
    },
    "50971": {
        "tag": 50971,
        "name": "PreviewDateTime",
        "type": "ASCII"
    },
    "50972": {
        "tag": 50972,
        "name": "RawImageDigest",
        "type": "UNDEFINED"
    },
    "50973": {
        "tag": 50973,
        "name": "OriginalRawFileDigest",
        "type": "UNDEFINED"
    },
    "50974": {
        "tag": 50974,
        "name": "SubTileBlockSize",
        "type": "LONG"
    },
    "50975": {
        "tag": 50975,
        "name": "RowInterleaveFactor",
        "type": "LONG"
    },
    "50981": {
        "tag": 50981,
        "name": "ProfileLookTableDims",
        "type": "LONG"
    },
    "50982": {
        "tag": 50982,
        "name": "ProfileLookTableData",
        "type": "FLOAT"
    },
    "51008": {
        "tag": 51008,
        "name": "OpcodeList1",
        "type": "UNDEFINED"
    },
    "51009": {
        "tag": 51009,
        "name": "OpcodeList2",
        "type": "UNDEFINED"
    },
    "51022": {
        "tag": 51022,
        "name": "OpcodeList3",
        "type": "UNDEFINED"
    },
    "51041": {
        "tag": 51041,
        "name": "NoiseProfile",
        "type": "DOUBLE"
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
    "34864": {
        "tag": 34864,
        "name": "SensitivityType",
        "type": "SHORT"
    },
    "34865": {
        "tag": 34865,
        "name": "StandardOutputSensitivity",
        "type": "LONG"
    },
    "34866": {
        "tag": 34866,
        "name": "RecommendedExposureIndex",
        "type": "LONG"
    },
    "34867": {
        "tag": 34867,
        "name": "ISOSpeed",
        "type": "LONG"
    },
    "34868": {
        "tag": 34868,
        "name": "ISOSpeedLatitudeyyy",
        "type": "LONG"
    },
    "34869": {
        "tag": 34869,
        "name": "ISOSpeedLatitudezzz",
        "type": "LONG"
    },
    "36864": {
        "tag": 36864,
        "name": "ExifVersion",
        "type": "UNDEFINED"
    },
    "36867": {
        "tag": 36867,
        "name": "DateTimeOriginal",
        "type": "ASCII"
    },
    "36868": {
        "tag": 36868,
        "name": "DateTimeDigitized",
        "type": "ASCII"
    },
    "37121": {
        "tag": 37121,
        "name": "ComponentsConfiguration",
        "type": "UNDEFINED"
    },
    "37122": {
        "tag": 37122,
        "name": "CompressedBitsPerPixel",
        "type": "RATIONAL"
    },
    "37377": {
        "tag": 37377,
        "name": "ShutterSpeedValue",
        "type": "SRATIONAL"
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
        "type": "RATIONAL"
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
    "37396": {
        "tag": 37396,
        "name": "SubjectArea",
        "type": "SHORT"
    },
    "37500": {
        "tag": 37500,
        "name": "MakerNote",
        "type": "UNDEFINED"
    },
    "37510": {
        "tag": 37510,
        "name": "UserComment",
        "type": "COMMENT"
    },
    "37520": {
        "tag": 37520,
        "name": "SubSecTime",
        "type": "ASCII"
    },
    "37521": {
        "tag": 37521,
        "name": "SubSecTimeOriginal",
        "type": "ASCII"
    },
    "37522": {
        "tag": 37522,
        "name": "SubSecTimeDigitized",
        "type": "ASCII"
    },
    "40960": {
        "tag": 40960,
        "name": "FlashpixVersion",
        "type": "UNDEFINED"
    },
    "40961": {
        "tag": 40961,
        "name": "ColorSpace",
        "type": "SHORT"
    },
    "40962": {
        "tag": 40962,
        "name": "PixelXDimension",
        "type": "LONG"
    },
    "40963": {
        "tag": 40963,
        "name": "PixelYDimension",
        "type": "LONG"
    },
    "40964": {
        "tag": 40964,
        "name": "RelatedSoundFile",
        "type": "ASCII"
    },
    "40965": {
        "tag": 40965,
        "name": "InteroperabilityTag",
        "type": "LONG"
    },
    "41483": {
        "tag": 41483,
        "name": "FlashEnergy",
        "type": "RATIONAL"
    },
    "41484": {
        "tag": 41484,
        "name": "SpatialFrequencyResponse",
        "type": "UNDEFINED"
    },
    "41486": {
        "tag": 41486,
        "name": "FocalPlaneXResolution",
        "type": "RATIONAL"
    },
    "41487": {
        "tag": 41487,
        "name": "FocalPlaneYResolution",
        "type": "RATIONAL"
    },
    "41488": {
        "tag": 41488,
        "name": "FocalPlaneResolutionUnit",
        "type": "SHORT"
    },
    "41492": {
        "tag": 41492,
        "name": "SubjectLocation",
        "type": "SHORT"
    },
    "41493": {
        "tag": 41493,
        "name": "ExposureIndex",
        "type": "RATIONAL"
    },
    "41495": {
        "tag": 41495,
        "name": "SensingMethod",
        "type": "SHORT"
    },
    "41728": {
        "tag": 41728,
        "name": "FileSource",
        "type": "UNDEFINED"
    },
    "41729": {
        "tag": 41729,
        "name": "SceneType",
        "type": "UNDEFINED"
    },
    "41730": {
        "tag": 41730,
        "name": "CFAPattern",
        "type": "UNDEFINED"
    },
    "41985": {
        "tag": 41985,
        "name": "CustomRendered",
        "type": "SHORT"
    },
    "41986": {
        "tag": 41986,
        "name": "ExposureMode",
        "type": "SHORT"
    },
    "41987": {
        "tag": 41987,
        "name": "WhiteBalance",
        "type": "SHORT"
    },
    "41988": {
        "tag": 41988,
        "name": "DigitalZoomRatio",
        "type": "RATIONAL"
    },
    "41989": {
        "tag": 41989,
        "name": "FocalLengthIn35mmFilm",
        "type": "SHORT"
    },
    "41990": {
        "tag": 41990,
        "name": "SceneCaptureType",
        "type": "SHORT"
    },
    "41991": {
        "tag": 41991,
        "name": "GainControl",
        "type": "SHORT"
    },
    "41992": {
        "tag": 41992,
        "name": "Contrast",
        "type": "SHORT"
    },
    "41993": {
        "tag": 41993,
        "name": "Saturation",
        "type": "SHORT"
    },
    "41994": {
        "tag": 41994,
        "name": "Sharpness",
        "type": "SHORT"
    },
    "41995": {
        "tag": 41995,
        "name": "DeviceSettingDescription",
        "type": "UNDEFINED"
    },
    "41996": {
        "tag": 41996,
        "name": "SubjectDistanceRange",
        "type": "SHORT"
    },
    "42016": {
        "tag": 42016,
        "name": "ImageUniqueID",
        "type": "ASCII"
    },
    "42032": {
        "tag": 42032,
        "name": "CameraOwnerName",
        "type": "ASCII"
    },
    "42033": {
        "tag": 42033,
        "name": "BodySerialNumber",
        "type": "ASCII"
    },
    "42034": {
        "tag": 42034,
        "name": "LensSpecification",
        "type": "RATIONAL"
    },
    "42035": {
        "tag": 42035,
        "name": "LensMake",
        "type": "ASCII"
    },
    "42036": {
        "tag": 42036,
        "name": "LensModel",
        "type": "ASCII"
    },
    "42037": {
        "tag": 42037,
        "name": "LensSerialNumber",
        "type": "ASCII"
    }
};
