"use strict";

var util = require('util');
var frameutil = require('./frameutil');

function genNewCode(name) {
    var codes = [];
    codes.push(util.format("// New%s new a %s object", name, name));
    codes.push(util.format("func New%s() *%s {", name, name));
    codes.push("\treturn &" + name + "{}");
    codes.push("}\n");
    return codes.join('\n');
}

function genArrayNewCode(name) {
    var codes = [];
    codes.push(util.format("// New%s new a %s object", name, name));
    codes.push(util.format("func New%s() *%s {", name, name));
    codes.push("\treturn &make(" + name + ", 0)");
    codes.push("}\n");
    return codes.join('\n');
}

function genNewFromJsonCode(name) {
    var codes = [];
    codes.push(util.format("// New%sFromJSON new a %s object from json", name, name));
    codes.push(util.format("func New%sFromJSON(str string) (*%s, error) {", name, name));
    codes.push(util.format("\to := New%s()", name));
    codes.push("\terr := json.Unmarshal([]byte(str), o)");
    codes.push("\tif err != nil {");
    codes.push("\t\treturn nil, err");
    codes.push("\t}");
    codes.push("\treturn o, nil")
    codes.push("}\n");
    return codes.join("\n");
}

function genStrCode(name) {
    var codes = [];
    var receiver = name.charAt(0).toLowerCase();
    codes.push(util.format("// String serial %s object", name));
    codes.push(util.format("func (%s %s) String() string {", receiver, name));
    codes.push(util.format("\ts, err := json.Marshal(%s)", receiver));
    codes.push("\tif err != nil {");
    codes.push("\t\treturn err.Error()");
    codes.push("\t}");
    codes.push("\treturn string(s)");
    codes.push("}\n");
    return codes.join('\n');
}

class BasicType {
    constructor(name) {
        this.name = name;
    }

    to_go_code() {
    }
}

class EnumType extends BasicType {
    constructor(name, enums) {
        super(name);
        this.enums = enums;
    }

    to_go_code() {
        var codes = [] 
        var enumType = frameutil.first_letter_upper(this.name) + "Type";
        var enumName = this.name;
        codes.push("// " + enumType + " enum");
        codes.push(util.format("type %s string\n", enumType));
        codes.push("const (");
        if (this.enums) {
            this.enums.forEach(function(enumValue) {
                codes.push(util.format("\t// %s %s", enumValue, enumName));
                codes.push(util.format('\t%s %s = "%s"', enumValue, enumType, enumValue));
            });
        }
        codes.push(")\n");

        return codes.join('\n');
    }
}

class ObjectProperty extends BasicType {
    constructor(name, type, required) {
        super(name);
        this.type = type;
        this.required = required;
    }

    to_go_code() {
        var code = '\t%s %s `json:"%s"`';
        if (!this.required) {
            code = '\t%s *%s `json:"%s"`';
        }
        return util.format(code, frameutil.first_letter_upper(this.name), this.type, this.name);
    }
}

class StringType extends BasicType {
    constructor(name, isEnum) {
        super(name);
        this.isEnum = isEnum;
    }

    to_go_code() {
        var mytype = "string";
        if (this.isEnum) {
            mytype = frameutil.first_letter_upper(this.name) + "Type";
        }
        var code = '\t%s %s `json:"%s"`';
        return util.format(code, frameutil.first_letter_upper(this.name), mytype, this.name);
    }
}

class NumberType extends BasicType {
    constructor(name, kind, type, format) {
        super(name);
        this.kind = kind;
        this.type = type;
        this.format = format;
    }

    to_go_code() {
        var mytype = this.type;
        if (this.kind === 'NumberTypeDeclaration') {
            mytype = frameutil.format_number(this.format);
        } else if (this.type == 'IntegerTypeDeclaration') {
            mytype = frameutil.format_integer(this.format);
        }

        var code = '\t%s %s `json:"%s"`';
        return util.format(code, frameutil.first_letter_upper(this.name), mytype, this.name);
    }
}

class ObjectType extends BasicType {
    constructor(name, kind, type) {
        super(name);
        this.kind = kind;
        this.type = type;
        this.properties = [];
    }

    add_property(prop) {
        if (prop != null) {
            this.properties.push(prop)
        }
    }

    to_go_code() {
        var codes = [];
        codes.push("// " + this.name + " class")
        codes.push(util.format("type %s struct {", this.name));
        // inherit type
        this.type.forEach(function(type) {
            if (type.indexOf('|') != -1) {
                var subTypes = type.split('|');
                subTypes.forEach(function(subType) {
                    codes.push("\t" + subType);
                });
            }
            else if (type != 'object') {
                codes.push("\t" + type);
            }
        });
        this.properties.forEach(function(prop){
            codes.push(prop.to_go_code());
        });
        codes.push("}\n");

        // add String() method
        codes.push(genStrCode(this.name));

        // add newXXX() method
        codes.push(genNewCode(this.name));

        // add newXXXFromJSON() method
        codes.push(genNewFromJsonCode(this.name));

        return codes.join('\n');
    }
}

class ArrayType extends BasicType {
    constructor(name, type) {
        super(name);
        this.type = type;
    }

    to_go_code() {
        var mytype = this.type;
        if (this.type.length > 0) {
            mytype = this.type[0];
        }
        var i = mytype.indexOf("[]");
        if (i != -1) {
            mytype = '[]*' + mytype.substr(0, i);
        }
        var codes = [];
        codes.push("// " + this.name + " class");
        codes.push("type " + this.name + " " + mytype + "\n");

        // add String() method
        codes.push(genStrCode(this.name));

        // add newXXX() method
        codes.push(genArrayNewCode(this.name));

        // add newXXXFromJSON() method
        codes.push(genNewFromJsonCode(this.name));

        return codes.join("\n");
    }
}

class Types {
    constructor() {
        this.objectTypes = []
        this.enumTypes = []
    }

    add_object_type(objectType) {
        if (objectType != null) {
            this.objectTypes.push(objectType);
        }
    }

    add_enum_type(enumType) {
        if (enumType != null) {
            this.enumTypes.push(enumType);
        }
    }

    to_go_code() {
        var codes = [];

        codes.push('package model\n');
        codes.push('import (');
        codes.push('\t"encoding/json"');
        codes.push(')\n');

        this.enumTypes.forEach(function(enumType) {
            codes.push(enumType.to_go_code());
        });

        this.objectTypes.forEach(function(objectType) {
            codes.push(objectType.to_go_code());
        });

        return codes.join('\n');
    }
}

module.exports = {
    EnumType: EnumType,
    ObjectProperty: ObjectProperty,
    StringType: StringType,
    NumberType: NumberType,
    ObjectType: ObjectType,
    ArrayType: ArrayType,
    Types: Types
}
