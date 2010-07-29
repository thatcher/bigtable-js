/**
 * @author thatcher
 */
(function($, $V){
    
    var log;
    
    $V.Site = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Views.Site');
    };
    
    $.extend($V.Site.prototype, {
        write: function(model){
            log.info("Rendering html template %s ", model.template);
            $.render({
                async:false,
                url: model.template,
                templateData: model,
                success: function(response){
                    log.debug("Rendered template %s ", response);
                    rendered = response;
                },
                error: function(xhr, status, e){
                    log.error('failed to render : %s ', model.template).
                        exception(e);
                    throw('Error Rendering template '+ model.template);
                }
            });
            log.info("Finsihed rendering html template %s ", model.template);
            return rendered;
        }
    });
    
    
})(jQuery, Bigtable.Views);
