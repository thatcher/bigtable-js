/**
 * @author thatcher
 */

(function($){


jQuery.extend(jQuery.tmpl.tags,{
    extend: {
        _default: [ null, null ],
        prefix: "\n\
        T._ = $1;\n\
        if( T._.match('#') ){\n\
            if(!( T._ in $.templates )){\n\
                /*pre-compile template*/\n\
                $.templates[ T._ ] = $.tmpl($( T._ ).text());\n\
            }\n\
        }else{\n\
            if(!( T._ in $.templates )){\n\
                $.ajax({\n\
                    url: T._,\n\
                    type: 'GET',\n\
                    dataType: 'text',\n\
                    async: false,\n\
                    success: function(text){\n\
                        $.templates[ T._ ] = $.tmpl( text );\n\
                    },\n\
                    error: function(xhr, status, e){\n\
                        $.templates[ T._ ] = $.tmpl( xhr.responseText );\n\
                    }\n\
                });\n\
            }\n\
        }\n\
        /*finally render */\n\
        T.push( $._render( T._, $.extend( true, {}, $data, this) ) );\n\
        T._ = null;\n\
        "
    }
});

// extend may also work basically like what most folks would think of
// as 'include'
jQuery.tmpl.tags.include = jQuery.tmpl.tags.extend;

})(jQuery);
