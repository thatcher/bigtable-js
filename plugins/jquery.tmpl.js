/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){

// Override the DOM manipulation function
var oldManip = jQuery.fn.domManip,
    console = ('console' in window)?window.console: {
        debug: function(){},
        info: function(){},
        error: function(){}
    };

jQuery.fn.extend({
	_render: function( data ) {
		return this.map(function(i, tmpl){
            
            // yuck but I cant get jquery to return text nodes that are part of a 
            // template that looks like ' this text doesnt show <p>just the paragraph</p>'
            // apparently because line 125 in jquery 1.4.2 uses match[1] to build the
            // fragment not match[0].  I'll have to see if this is my bug or theirs
			return  jQuery( 
                jQuery('<div>'+ jQuery._render( tmpl, data ) +'</div>')[0].childNodes 
            ).get();
		});
	},
	
	// This will allow us to do: .append( "template", dataObject )
	domManip: function( args ) {
		// This appears to be a bug in the appendTo, etc. implementation
		// it should be doing .call() instead of .apply(). See #6227
		if ( args.length > 1 && args[0].nodeType ) {
			arguments[0] = [ jQuery.makeArray(args) ];
		}

		if ( args.length === 2 && typeof args[0] === "string" && typeof args[1] !== "string" ) {
            arguments[0] = [ jQuery( 
                jQuery('<div>'+ jQuery._render( args[0], args[1] )+'</div>')[0].childNodes 
            ).get() ];
		}
		
		return oldManip.apply( this, arguments );
	}
});

jQuery.extend({
    // note: _render was changed to return a string not a jQuery object.
    // while fn._render does return a jquery object
	_render: function( tmpl, data, asArray ) {
        var fn, request;
		
		// Use a pre-defined template, if available
		if ( jQuery.templates[ tmpl ] ) {
			fn = jQuery.templates[ tmpl ];
		// We're pulling from a script node
		} else if ( tmpl.nodeType ) {
			var node = tmpl, elemData = jQuery.data( node )||{};
            //if script node is empty and has a src attribute honor it
            if(node.src){
                //call re-call _render via syncronous ajax with src url
                return jQuery._render({
                    async: false,
                    url: node.src, 
                    templateData: data 
                });
            }else{
                fn = elemData.tmpl || jQuery.tmpl( node.innerHTML );
            }
        // passing object implies ajax fetch of remote template
		} else if ( jQuery.isPlainObject( tmpl ) ){
            // TODO: re-think but _render as-is cant support async
            // since it is expected to return the _rendered template
            // as a string - might be nice to have optional arg for
            // callback of aynch template _rendering. :DONE
            var options = jQuery.extend( {}, tmpl, {
                // url is a required property of the passed options
                type: 'GET',
                dataType: 'text',
                success: function( text ){
                    jQuery.templates[ tmpl.url ] = jQuery.tmpl( text );
                    // if a _rendering callback was provided, use it
                    if( tmpl.success )
                        tmpl.success( jQuery._render( tmpl.url, tmpl.templateData ) );
                        
                },
                error: function( xhr, status, e ){
                    jQuery.templates[ tmpl.url ] = jQuery.tmpl( 
                        'Failed to load template from '+tmpl.url +
                        '('+status+')'+e
                    );
                    // if a _rendering callback was provided, use it
                    if( tmpl.error )
                        tmpl.error( jQuery._render( tmpl.url, tmpl.templateData ) );
                }
            })
            request = jQuery.ajax( options );
            
            // for non async _renderings if they provide no success callback
            // allow the _rendered template to be returned
            return ( tmpl.async === false ) && !tmpl.success ? 
                jQuery._render( tmpl.url, tmpl.templateData ) : request;
        }

		fn = fn || jQuery.tmpl( tmpl );
		
		// We assume that if the template string is being passed directly
		// in the user doesn't want it cached. They can stick it in
		// jQuery.templates to cache it.
		if ( jQuery.isArray( data ) ) {
			return jQuery.map( data, function( data, i ) {
				return fn.call( data, jQuery, data, i );
			});

		} else {
			return fn.call( data, jQuery, data, 0 );
		}
	},
	
	// You can stick pre-built template functions here
	templates: {},
    

	encode: function( text ) {
		return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
	},

    /*
     * For example, someone could do:
     *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
     *   $("#test").append("foo", data);
     */
	tmpl: function(str, data, i) {
        if(!(TAG && EXPRESSION)){
            TAG = new RegExp(
                jQuery.tmpl.startTag + 
                '\\s*(\\/?)(\\w+|.)(?:\\((.*?)\\))?(?: (.*?))?\\s*'+
                jQuery.tmpl.endTag, 'g'
            );
            EXPRESSION = new RegExp(
                jQuery.tmpl.startExpression + 
                '([^'+jQuery.tmpl.endExpression+']*)'+
                jQuery.tmpl.endExpression, 'g'
            );
            //normalize to string form so they can be used to generate real
            //start and end tags
            jQuery.tmpl.startTag = jQuery.tmpl.startTag.replace('\\','', 'g');
            jQuery.tmpl.endTag = jQuery.tmpl.endTag.replace('\\','', 'g');
        }
		// Generate a reusable function that will serve as a template
		// generator (and which will be cached).
        
        var fn,
            fnstring = "\n\
var $ = jQuery, \n\
    T = [], \n\
    _ = $.tmpl.filters; \n\
\n\
//make data available on tmpl.filters as object not part of global scope \n\
_.data = T.data = $data; \n\
_.$i = T.index = $i||0; \n\
T._ = null; //can be used for tmp variables\n\
function pushT(value, _this, encode){\n\
    return encode === false ? \n\
        T.push(typeof value ==='function'?value.call(_this):value) : \n\
        T.push($.encode(typeof( value )==='function'?value.call(_this):value));\n\
}\n\
\n\
// Introduce the data as local variables using with(){} \n\
with($.extend(true, {}, _, $data)){\n\
try{\n\
    T.push('" +

        // Convert the template into pure JavaScript
        str .replace(/([\\'])/g, "\\$1")
            .replace(/[\r\t\n]/g, " ")
            .replace(EXPRESSION, jQuery.tmpl.startTag+"= $1"+jQuery.tmpl.endTag)
            .replace(TAG, function(all, slash, type, fnargs, args) {
                var tmpl = jQuery.tmpl.tags[ type ];
                
                if ( !tmpl ) {
                    throw "Template not found: " + type;
                }
                var def = tmpl._default||[];
                var result = "');" + tmpl[slash ? "suffix" : "prefix"]
                    .split("$1").join(args || def[0])
                    .split("$2").join(fnargs || def[1]) + 
                    "\n        T.push('";
                
                return result;
            })
+ "');\n\
}catch(e){\n\
    if($.tmpl.debug){\n\
        T.push(' '+e+' ');\n\
    }else{\n\
        T.push('');\n\
    }\n\
}//end try/catch\n\
}\n\
//reset the tmpl.filter data object \n\
_.data = null;\n\
return T.join('')";
        
        
        //provide some feedback if they are in tmpl.debug mode
        if (jQuery.tmpl.debug)
            console.log('Generated Function: \n', fnstring);
        
        try{    
            fn = new Function("jQuery","$data","$i",fnstring );
        }catch(e){
            //a little help debugging;
            console.warn(fnstring);
            throw(e);
        }

        
        // Provide some basic currying to the user
		return data ? fn.call( this, jQuery, data, i ) : fn;
	}
});

/*
 * jQuery.tmpl options 
 * 
 * tmpl.debug
 * By default its false, but when set to true you will get additional debug
 * messages as well as be able to see firebug output of compiled templates
 * before they are compiled as Functions
 * 
 * tmpl.startTag etc
 * These allow for the possibility of modifying the global tag/expression
 * characters in case they conflict with another preprocessor.  They must
 * use RegExp style string so special characters must be escaped by \\
 */
jQuery.extend( jQuery.tmpl, {
    debug : false,
    startTag : '{{',
    endTag : '}}',
    startExpression :'\\${',
    endExpression :'}'
});

var TAG,
    EXPRESSION;
    
/*
 * jQuery.tmpl.filters
 * 
 * These are the core supported filters.  Filters are functions made available
 * to templates.  Some may be chainable, some are not.  See the tmpl.filter.js
 * plugin for an example of how to extend filters for a good cause.  
 * 
 * Extending filters is a much better pattern than adding functions to the 
 * template data object, though that is also valid.
 */
jQuery.tmpl.filters = {
    //default filters
    join: function(){
       return Array.prototype.join.call(arguments[0], arguments[1]);
    }
};


    
/* jQuery.tmpl.tags
 * 
 * These are the core supported tags.  each should have an example in the
 * example directory.
 *  
 * NOTE: the source is shifted to help readability in this block and for
 * template debugging via firebug
 */
    
jQuery.tmpl.tags = {

// allows template developers to provide notes            
'comment': {
    prefix: "\n\
    /*",
    suffix: "\n\
    */"
},

// iterate over items in an array
'each': {
    _default: [ null, "$i" ],
    prefix: "\n\
        jQuery.each( $1, function($2){\n\
            with(this){",
    suffix: "\n\
            }\n\
        });"
},

// if/elseif/else - a general logical operator
'if': {
    prefix: "\n\
        if( $1 ){",
    suffix: "\n\
        }"
},

'elseif': {
    prefix: "\n\
        }else if( $1 ){"
},

'else': {
    prefix: "\n\
        }else{"
},

// allows for html injection
'html': {
    prefix: "\n\
        pushT($1, this, false);"
},


// allows for html injection?
'ignore': {
    prefix: "",
    suffix: ""
},

// provides support for alternate evaluation tag syntax, reused internally
'=': {
    _default: [ "this" ],
    prefix: "\n\
        pushT($1, this);"
}

};//end jQuery.tmpl.tags

    
})(jQuery);

        