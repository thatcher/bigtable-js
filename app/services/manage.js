/**
 * @author thatcher
 */
(function($, $S){
    
    var log,
        db;
    
    $S.Manage = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Services.Manage');
        db = new $.gdb($.env('db'));
    };
    
    $.extend($S.Manage.prototype, {
        handle:function(event){
            var command = event.params('command'),
                target = event.params('target');
            log.debug("handling command %s %s", command, target)
            Commands[command](target, event);
            if(('reset' == command)||('syncdb' == command)){
                log.debug('forwarding to rest service');
                event.response.headers =  {
                    status:   302,
                    "Location": '/rest/'
                };
            }
        }
    });
    
    var Commands = {
        reset: function(targets){
            var domains;
            db.get({
                async: false,
                success: function(result){
                    domains = result.domains;
                    log.debug('loaded domains');
                },
                error: function(xhr, status, e){
                    log.error('failed to get db domains');
                }
            });
            //drops domains (tables) for each model
            $(domains).each(function(index, domain){
                db.destroy({
                    domain: domain,
                    async: false,
                    success: function(result){
                        log.info('destroyed domain %s', domain);
                    },
                    error: function(xhr, status, e){
                        log.error('failed to delete domain %s', domain);
                    }
                });
            });
        },
        syncdb: function(targets){
            //creates domain (tables) for each model
            var data,
                data_url = $.env('data')+'dump.json?'+$.uuid(),
                domain;
                
            log.info('loading initial data from %s', data_url);
            $.ajax({
                type:'get',
                async:false,
                url:data_url,
                dataType:'text',
                success:function(_data){
                    data = $.json2js(_data);
                    log.info('loaded initial data');
                },
                error:function(xhr, status, e){
                    log.error('failed [%s] to load initial data %s', status, e);
                }
            });
            
            for(domain in data){
                db.create({
                    domain: domain,
                    async:false,
                    success:function(result){
                        log.info('created domain %s', domain);
                    }
                });
                db.save({
                    async:false,
                    batch:true,
                    domain: domain,
                    data:data[domain],
                    success: function(){
                        log.info('batch save successful %s ', domain);
                    },
                    error: function(){
                        log.error('batch save failed %s', domain);
                    }
                });
            }
        },
        dumpdata: function(targets, event){
            var data = {};
            var domains;
                
            db.get({
                async: false,
                success: function(result){
                    domains = result.domains;
                    log.debug('loaded domains');
                },
                error: function(xhr, status, e){
                    log.error('failed to get db domains');
                }
            });
            
            $(domains).each(function(i, domain){
                db.find({
                    select:"new Query('"+domain+"')",
                    async: false,
                    success: function(result){
                        log.info('found %s entries in %s', result.data.length, domain);
                        data[domain] = result.data;
                    },
                    error: function(xhr, status, e){
                        ok(false, 'failed load entries from %s', domain);
                    }
                });
            });
            
            event.write($.js2json(data, null, '    '));
            event.response.headers =  {
                status:   200,
                'Content-Type':'application/json'
            };
        },
        status: function(targets, event){
             db.find({
                select:"new Query('__Stat_Total__')",
                async: false,
                success: function(result){
                    log.info('found status __Stat_Total__');
                    
                    event.write($.js2json(result, null, '    '));
                    event.response.headers =  {
                        status:   200,
                        'Content-Type':'text/plain'
                    };
                },
                error: function(xhr, status, e){
                    ok(false, 'failed load entries from %s', domain);
                }
            });
        },
        index: function(targets, event){
            var domains;
            db.get({
                async: false,
                success: function(result){
                    domains = result.domains;
                    log.debug('loaded domains');
                },
                error: function(xhr, status, e){
                    log.error('failed to get db domains');
                }
            });
            
            $(domains).each(function(i, domain){
                var query = $.query(domain).items(),
                    complete = false,
                    total = 0,
                    results,
                    index = {},
                    start = new Date().getTime();
                query.limit = 1000;
                query.start = 1;
                while(!complete){
                    log.debug('indexing domain %s from %s', domain, query.start);
                    db.find({
                        select:query,
                        async: false,
                        success: function(result){
                            log.debug('success : results count %s', result.data.length);
                            $(result.data).each(function(i, data){
                                //log.debug('record %s', this.$id);
                                var prop;
                                for( prop in data ){
                                    //only generate an index on the fields specified
                                    //in the event params.
                                    if(event.params(prop) != null){
                                        if( !(prop in index) ){ 
                                            index[prop] = {};
                                        }
                                        if( $.isArray(data[prop]) ){
                                            $(data[prop]).each(function(j, value){
                                                if(value in index[prop] ){
                                                    index[prop][value] += 1;
                                                }else{
                                                    index[prop][value] = 1;
                                                }
                                            });
                                        }else if(data[prop] in index[prop] ){
                                            index[prop][data[prop]] += 1;
                                        }else{
                                            index[prop][data[prop]] = 1;
                                        }
                                    }
                                }
                            });
                            total += result.data.length;
                            complete = (result.data.length < query.limit);
                            query.start += 1;
                            log.debug('total %s', total);
                        },
                        error: function(xhr, status, e){
                            log.error('error %s', xhr?xhr.status:status).
                                exception(e);
                        }
                    });
                }
                log.debug('domain %s index %s', domain, $.js2json(index, null, '  '));
                log.info('complete? %s %s %s', domain, total, new Date().getTime()-start);
            });
        }
    }
})(jQuery, Bigtable.Services);


