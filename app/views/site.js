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
        render: function(model){
            log.info("Rendering html template %s ", model.template);
            var template = model.template,
                result,
                _this = this;
            $._render({
                async:false,
                url: template,
                templateData: model,
                success: function(result){
                    log.debug('rendering to stream %s', result);
                    _this.write(  result  );
                    log.info("Finsihed rendering html template %s ", model.template);
                },
                error: function(xhr, status, e){
                    log.error('failed to render : %s ', template).
                        exception(e);
                    //_this.write('status: '+status + '\n' + xhr.responseText + '\n'+ e);
                    throw('Error Rendering template '+ template);
                }
            });
        }
    });
    
    
})(jQuery, Bigtable.Views);
