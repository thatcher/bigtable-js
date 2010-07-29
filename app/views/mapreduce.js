/**
 * @author thatcher
 */
(function($, $V){
    
    var log;
    
    $V.MapReduce = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Views.MapReduce');
    };
    
    $.extend($V.MapReduce.prototype, {
        write: function(model, event){
            event.response.headers['Content-Type']='text/plain; charset=utf-8';
            return $.js2json(model, null, '    ');
        }
    });
    
    
})(jQuery, Bigtable.Views);
