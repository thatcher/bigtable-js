(function($, $C){
    
    var log;
    
    $C.Admin = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Controllers.Admin');
    };
    
    $.extend($C.Admin.prototype, {
        
        list_domains: function(event){
            
            $.ajax({
                url: '/rest/',
                dataType: 'json',
                success: function(results){
                    log.debug('successfully loaded domains %s', results.domains);
                    event.m({
                        domains: results.domains,
                        template: $.env('templates')+'html/partials/domains.tmpl'
                    }).render();
                },
                error: function(xhr, status, e){
                    log.error('failed to load domains %s : %s', xhr.status, status).
                        exception(e);
                }
            });
               
        },
        
        remove_domain: function(event){
            
            var domain = event.params('domain'),
                _this = this;
            $.ajax({
                url: '/rest/'+domain,
                type: 'delete',
                dataType: 'json',
                success: function(results){
                    log.debug('successfully deleted domain %s', domain);
                    _this.list_domains(event);
                },
                error: function(xhr, status, e){
                    log.error('failed to delete domain $s (%s : %s)', domain, xhr.status, status).
                        exception(e);
                }
            });
               
        },
        
        add_domain: function(event){
            
            var domain = event.params('domain'),
                _this = this;    
            $.ajax({
                url: '/rest/'+domain,
                type: 'put',
                dataType: 'json',
                success: function(results){
                    log.debug('successfully created domain %s', domain);
                    _this.list_domains(event);
                },
                error: function(xhr, status, e){
                    log.error('failed to create domain $s (%s : %s)', domain, xhr.status, status).
                        exception(e);
                }
            });
        }
        
    });
    
})(jQuery, Bigtable.Controllers);
