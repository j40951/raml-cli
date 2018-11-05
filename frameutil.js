"use strict";

function format_number(format) {
    if (format == null) {
        return "float32";
    }
    switch (format) {
        case "int8":
            return "int8";
        case "int16":
            return "int16";
        case "int":
        case "int32":
            return "int32";
        case "long":
        case "int64":
            return "int64";
        case "float":
            return "float32";
        case "double":
            return "float64";
    }

    return "float32";
}

function format_integer(format) {
    if (format == null) {
        return "int32"
    }

    switch (format) {
        case "int8":
            return "int8";
        case "int16":
            return "int16";
        case "int":
        case "int32":
            return "int32";
        case "long":
        case "int64":
            return "int64"
    }

    return "int32";
}

var first_letter_upper = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

var first_letter_lower = function(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

module.exports = {
    format_number: format_number,
    format_integer: format_integer,
    first_letter_upper: first_letter_upper,
    first_letter_lower: first_letter_lower
};
