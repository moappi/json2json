//Copyright (c) 2013 Crystalline Technologies
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'),
//  to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
//  and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
//  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var json2json = {
	
	/* ---------------------------------------- Public Methods ------------------------------------------------ */
	'transform': function(json, transform , options) {
		
		var out = [];

		//Make sure we have a transform & json object
		if( transform !== undefined && json !== undefined ) {

			//Normalize strings to JSON objects if necessary
			var obj = typeof json === 'string' ? JSON.parse(json) : json;
			
			//Transform the object (using the option variables)
			out = json2json._transform(obj, transform, options);
		}
		
		return(out);
	},
	
	//Get an objects value using the name as prop1.prop2.prop3
	'get':function(obj,name,options) {
		
		//Get the value from the object
		var val = json2json._getValue(name,obj)

		//Force object into array if required
		if(options.forceArray) val = [val];

		//Return the value
		return( val );
	},

	/* ---------------------------------------- Private Methods ------------------------------------------------ */
	
	//Transform object
	'_transform':function(json, transform, options) {

		var out;
		
		//Determine the type of this object
		if(Array.isArray(json)) {
			out = [];
			
			//Itterrate through the array and add it to the elements array
			var len=json.length;
			for(var j=0;j<len;++j) {	
				
				//Apply the transform to this object and append it to the results
				var obj = json2json._apply(json[j], transform, j, options);
				
				//check to see what was returned (if array then concat otherwise add)
				if(Array.isArray(obj)) out = out.concat(obj);
				else out[out.length] = obj;
			}

		} else if(typeof json === 'object') {

			//Apply the transform to this object and append it to the results
			out = json2json._apply(json, transform, undefined, options);
		}
	
		//Return the resulting elements
		return(out);		
	},

	//Extend options
	'_extend':function(obj1,obj2){
		var obj3 = {};
		if(obj1 !== undefined) for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		if(obj2 !== undefined) for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		return obj3;
	},

	//Apply the transform at the second level
	'_apply':function(obj, transform, index, options) {
		
		var out;

		//Itterate through the transform and create html as needed
		if(Array.isArray(transform)) {
			
			out = [];

			var t_len = transform.length;
			for(var t=0; t < t_len; ++t) {
				//transform the object and append it to the output
				out = out.concat( json2json._apply(obj, transform[t], index, options) );
			}

		} else if(typeof transform === 'object') {
			
			//Make a first pass and get the variables
			var result = json2json._getVariables(obj,transform);

			//Set the new transform (without the variable definitions)
			var _transform = result.transform;

			//Expand the variables (if we have any)
			// sets the variable array to [{'name':'value',..},..]
			var vars = json2json._expand(result.variables);

			//Make a second pass set the variables
			// Creates a new output array of objects with variables set 
			out = json2json._setVariables(obj, _transform, vars, index, options);
		}
		
		return(out);
	},

	'_expand':function(variables,array) {

		//Define the array (if we don't already have one)
		if(array === undefined) array = [{}];
		
		//If we have no variables to join to this array then output the array
		if(variables.length === 0) return(array);

		//Get the next variable on the stack 
		var variable = variables.pop();
		
		//New output object
		var out = [];

		//Merge the values with all those from the next variable values
		for(var val = 0; val < variable.value.length; val++) {
			
			//Itterate over the existing array
			// using the existing objects in the array as a base
			for(var i = 0; i < array.length; i++) {

				//Start with the existing array's object
				var obj = json2json._clone(array[i]);

				//Add this value
				obj[variable.name] = variable.value[val];

				//Output the object
				out[out.length] = obj;
			}
		}

		//Process the other variables in the array and return them
		return( json2json._expand(variables,out) );
	},
	
	'_clone':function(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	},
	
	'_getVariables':function(obj,transform) {
		
		var out = {'variables':[],'transform':undefined};

		//copy the transform (as we will end up modifying it
		var _transform = json2json._clone(transform);

		var variables = [];

		//Make a pass over the transform properties
		for(var prop in _transform) {

			//Check the property name for a variable maker $[]
			var isArrayMaker = prop.match(/\$\[([^\]\{]+)\]/);
		
			if(isArrayMaker !== null) {
				//The format is name=regex
				var v = isArrayMaker[1].match(/(.+)=(.+)/);
				
				//Make sure we have valid syntax
				if(v !== null) 
					if(v.length === 3) variables[variables.length] = {'name':v[1],'regex':v[2]};
				
				//remove this element from the transform (we don't need it anymore)
				delete _transform[prop];
			} 
		}
		
		//Check if we have any variables
		if(variables.length > 0) {
			
			//Resolve each variable against the the property names of the object
			for(var i = 0; i < variables.length; i++) {
				
				//Init the value array
				var values = [];

				//Using the regex get the variables value (from the object)
				for(var prop in obj) {
					
					var match = prop.match(variables[i].regex);
					
					//if we have a match get the value from the match
					// use match or search??? then use the entire property name?
					if(match !== null) 
						if(match.length > 1) values[values.length] = match[1];
						else values[values.length] = match[0];
				}

				//Add the variable values to the variable
				variables[i].value = values;
			}
		}
		
		out.variables = variables;
		out.transform = _transform;

		return(out);
	},

	//Set for a single variable combination
	'_setVariable':function(obj, transform, variable, index, options) {

		//return object
		var nObj;

		//check the transform
		if(typeof transform === 'object') {
			
			//If this transform is an array then itterate over the array
			if(Array.isArray(transform)) {
				nObj = [];

				for(var i=0; i < transform.length; i++)
					nObj.push( json2json._setVariable(obj,transform[i],variable,index,options) );

			} else
			{
				//Create a new object
				nObj = {};

				//Itterate over each prop in the transform
				for(var prop in transform) {

					//resolve the string variables $()
					var name = json2json._resolveVariables(prop,variable);
					
					//finally resolve the object variables ${}
					name = json2json._resolveObjects(name,obj);
					
					var type = typeof transform[prop];
					
					//extend the variables with the options (optional variables)
					var vars = json2json._extend(options,variable);

					//Check strings for variables
					if( type === 'string') {
					
						//resolve the string variables $()
						var value = json2json._resolveVariables(transform[prop],vars);
						
						//finally resolve the object variables ${}
						value = json2json._resolveObjects(value,obj);

						//add to the object
						nObj[name] = value;
					} else if(type === 'function'){
						//Call the function to get the object value
						nObj[name] = transform[prop].call(obj,obj,vars,index);

					} else if(type === 'object'){

						//Process the transform object with the variable
						nObj[name] = json2json._setVariable(obj,transform[prop],variable,index,options);
					}
				}
			}
		}

		return(nObj);
	},

	//Set the variables in the transform
	'_setVariables':function(obj, transform, variables, index, options) {
	
		//Create a new array of output objects 
		var out = [];

		//Itterate over each property in the transform
		for(var i = 0; i < variables.length; i++) {
			
			//Set the variables in the transform (for each variable combination)
			var nObj = json2json._setVariable(obj,transform,variables[i],index,options);

			//add the new object to the output array
			out.push(nObj);
		}

		//return the output array
		return(out);
	},

	//val: string to parse
	//obj: variables to use in the parsing: name value pairs where all values are strings
	'_resolveVariables':function(val,obj) {
	
		//Look for $()
		var _tokenizer = new json2json._tokenizer([
			/\$\(([^\)\{]+)\)/
		],function( src, real, re ){
			return real ? src.replace(re,function(all,name){
				
				//Get the value from the object
				return(obj[name]);
				
			}) : src;
		});
		
		//if we didn't find any objects then try the variable name instead
		return( _tokenizer.parse(val).join(''));
	},

	//val: string to parse
	//obj: object to resolve to 
	'_resolveObjects': function(val,obj) {
	
		if(val === undefined) return(undefined);

		//Check the property name for a variable maker $[]
		var isObjVar = val.match(/\$\{([^\}\{]+)\}/);
		
		//Check to see if we have an object name
		if(isObjVar !== null) {
			//Return the object 
			return(json2json._getValue(isObjVar[1],obj));
		} else return(val);
	},
	
	//Get the property from the object (deep property name prop.prop.prop)
	'_getValue':function(name,obj) {
		//Split the string into it's seperate components
		var components = name.split('.');

		//Set the object we use to query for this name to be the original object
		var useObj = obj;

		//Output value
		var outVal;
		
		//Parse the object components
		var c_len = components.length;
		for (var i=0;i<c_len;++i) {

			if( components[i].length > 0 ) {

				var newObj = useObj[components[i]];
				useObj = newObj;
				if(useObj === null || useObj === undefined) break;
			}
		}
		
		//As long as we have an object to use then set the out
		if(useObj !== null && useObj !== undefined) outVal = useObj;

		return(outVal);
	},

	//Tokenizer
	'_tokenizer':function( tokenizers, doBuild ){

		if( !(this instanceof json2json._tokenizer ) )
			return new json2json._tokenizer( tokenizers, doBuild );
			
		this.tokenizers = tokenizers.splice ? tokenizers : [tokenizers];
		if( doBuild )
			this.doBuild = doBuild;

		this.parse = function( src ){
			this.src = src;
			this.ended = false;
			this.tokens = [ ];
			do {
				this.next();
			} while( !this.ended );
			return this.tokens;
		};
		
		this.build = function( src, real ){
			if( src )
				this.tokens.push(
					!this.doBuild ? src :
					this.doBuild(src,real,this.tkn)
				);	
		};

		this.next = function(){
			var self = this,
				plain;
				
			self.findMin();
			plain = self.src.slice(0, self.min);
			
			self.build( plain, false );
				
			self.src = self.src.slice(self.min).replace(self.tkn,function( all ){
				self.build(all, true);
				return '';
			});
			
			if( !self.src )
				self.ended = true;
		};

		this.findMin = function(){
			var self = this, i=0, tkn, idx;
			self.min = -1;
			self.tkn = '';
			
			while(( tkn = self.tokenizers[i++]) !== undefined ){
				idx = self.src[tkn.test?'search':'indexOf'](tkn);
				if( idx != -1 && (self.min == -1 || idx < self.min )){
					self.tkn = tkn;
					self.min = idx;
				}
			}
			if( self.min == -1 )
				self.min = self.src.length;
		};
	}
};