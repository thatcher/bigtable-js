/**
 *
 * Copyright (c) 2008-2009 BigtableJS
 *
 */
(function($){

    var log;
    
    $.filters([{

        id        : "#requestResponseParamFilter",
        target    : "Bigtable.Services.*",
        before    : "([a-z]*)",
        advice    : function(event, response){
            log = log||$.logger('Bigtable.Filters');
            log.debug( 'Adding normalized event state to event scoped model' );
            var params = event.params( 'parameters' );
            
            event.
                m({admin:('admin' in params)?true:false }).
                m(event.params());
        }
        
    },{

        id        : "#contentNegotiationFilter",
        target    : "Bigtable.Views.*",
        around    : "(render)",
        advice    : function(invocation){

            var model = invocation.arguments[0],
                event = invocation.arguments[1],
                view =  invocation.object;
                
            log = log||$.logger('Bigtable.Filters');
            log.debug('Intercepted call to render');
                
            switch( model.parameters.fo ){
                case 'json':
                    var newline = "\n";
                    event.response.headers['Content-Type']='text/plain; charset=utf-8';
                    return view.write( $.json(model, null, '    ').replace('\n',newline, 'g'));
                    break;//do not proceed
                case 'xml':
                    event.response.headers['Content-Type']='application/xml; charset=utf-8';
                    return view.write($.x({x:model}));
                    break;//do not proceed
                default:
                    if('template' in model)
                        model.template += '?'+new Date().getTime();
                    return invocation.proceed();
            }    
        }
    }]);

})(jQuery);

