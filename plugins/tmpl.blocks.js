/**
 * @author thatcher
 */
(function(){
    
    jQuery.tmpl.blocks = {};

    jQuery.extend(jQuery.tmpl.tags,{

block: {
    
    _default: [ null, null ],
    prefix: "\n\
        T.push('<!--block-$1--><!--endblock-$1-->');\n\
        for(var b=0;b<T.length;b++){\n\
            if(T[b].match('<!--block-$1-->')){\n\
                var r = /<\!--block-$1-->.*<\!--endblock-$1-->/;\n\
                T[b] = T[b].replace(r, (function(){\n\
                    var T = ['<!--block-$1-->'],\n\
                        end = '<!--endblock-$1-->';\n\
                    function pushT(value, _this, encode){\n\
                        return encode === false ? \n\
                            T.push(typeof value ==='function'?value.call(_this):value) : \n\
                            T.push($.encode(typeof( value )==='function'?value.call(_this):value));\n\
                    }\n",
    suffix:"\n\
                    T.push(end);\n\
                    return T.join('');\n\
                })());\n\
                break;\n\
            };\n\
        }"
}

});

})();