
"use strict";

console.log('RAML 1.0 JS Parser Test');

var path = require("path");
var raml = require("raml-1-parser");
var frameutil = require("./frameutil");
var type1 = require("./type");
// var util = require("util");

console.log(path.resolve(__dirname, "test5.raml"));

var api = raml.loadApiSync(path.resolve(__dirname, "test5.raml"));

var types = new type1.Types();

api.types().forEach(function(type) {
	console.log(type.name() + " : " + type.kind());
	console.log("\t type:", type.type());
	// go_code.name = type.name();
	
	if (type.kind()=="ObjectTypeDeclaration") {

		var objectType = new type1.ObjectType(type.name(), type.kind(), type.type());
		
		type.properties().forEach(function(prop) {
			// prop.prop
			// console.log("type=", prop.type());
			console.log("\t", frameutil.first_letter_upper(prop.name()) + " : " + prop.kind() + ", " + prop.type() + ", " + prop.required());

			var propKind = prop.kind();

			if (propKind == "StringTypeDeclaration") {

				var isEnum = false;

				if (prop.enum()) {
					prop.enum().forEach(function(enumValue){
						console.log("\t\t-", enumValue);
					})

					if (prop.enum().length > 0) {
						var myenum = new type1.EnumType(prop.name(), prop.enum());
						types.add_enum_type(myenum);
						isEnum = true;
					}
				}

				var myprop = new type1.StringType(prop.name(), isEnum);
				objectType.add_property(myprop);
			} 

			/*
			console.log("\t xxtype:", prop.type());
			var mytype = prop.type();
			if (util.isArray(mytype)) {
				console.log("-----is array");
			}
			console.log("-----" + typeof(mytype));*/

			/*if (prop.type() == "string") {
				var myprop = new type1.StringType(prop.name(), prop.type());
				objectType.add_property(myprop);
			}*/

			if (propKind === "NumberTypeDeclaration" || propKind === "IntegerTypeDeclaration") {
				console.log("\t\t- format:", frameutil.format_number(prop.format()));
				var myprop = new type1.NumberType(prop.name(), prop.kind(), prop.type(), prop.format());
				objectType.add_property(myprop);
			}

			if (propKind === "ObjectTypeDeclaration") {
				var myprop = new type1.ObjectProperty(prop.name(), prop.type(), prop.required());
				objectType.add_property(myprop);
			}

			/*prop = new type.Property(prop.name(), prop.type(), prop.format)
			objectType.add_property*/
		});
		types.add_object_type(objectType);

	} else if (type.kind() == "ArrayTypeDeclaration") {

		var objectType = new type1.ArrayType(type.name(), type.type());
		types.add_object_type(objectType);
	}
});

console.log(types.to_go_code());

function processResource(res) {
	var relativeUri = res.relativeUri().value();
	var completeRelativeUri = res.completeRelativeUri();
	console.log(completeRelativeUri, "(", relativeUri, ")");

	for (var uriParamNum = 0; uriParamNum < res.allUriParameters().length; ++uriParamNum) {
        var uriParam = res.allUriParameters()[uriParamNum];
        // Here we trace URI parameter's name and types
        console.log("\tURI Parameter:", uriParam.name(), uriParam.type().join(","));
	}

	res.methods().forEach(function(method){
        console.log("\t" + method.method())
    })

	// Recursive call this function for all subresources
    /*for (var subResNum = 0; subResNum < res.resources().length; ++subResNum) {
        var subRes = res.resources()[subResNum];
        processResource(subRes);
	}*/
	res.resources().forEach(processResource);

}

api.resources().forEach(processResource);
