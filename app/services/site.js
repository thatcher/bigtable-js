/**
 * @author thatcher
 */
(function($, $S){
    
    var log;
    
    $S.Site = function(options){
        $.extend(true, this, options);
        log             = $.logger('Bigtable.Services.Site');
    };
    
    $.extend($S.Site.prototype, {
       
        
    });
    
})(jQuery, Bigtable.Services);
