(function($, $V){
    
    var log;
    
    $V.Admin = function(options){
        $.extend(true, this, options);
        log = $.logger("Bigtable.Views.Admin");  
    };
    
    $.extend($V.Admin.prototype, {
        
        update: function(model){
            log.debug('updating admin view');
            if(model.domains){
                this.updateDomains(model);
            }
        },
        updateDomains: function(model){
            var _this = this;
            log.debug('rendering domains in admin view %s', model.template);
            $.render({
                url: model.template,
                templateData: model, 
                success: function(rendered){
                    $(_this).empty().append(rendered);
                }
            });
        },
        updateMaster: function(){
            
        },
        updateWorkers: function(){
            
        },
        updateIndexes: function(){
            
        }
        
    });
    
})(jQuery, Bigtable.Views);
