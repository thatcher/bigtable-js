(function($, $S){
    
    var log,
        leased_jobs = [],
        job_queue = [],
        db,//rest db connection
        map,//table for map  jobs sets
        reduce,//table for reduce jobs sets
        indexes,//table for final results
        phase;
    
    $S.MapReduce = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Services.MapReduce'); 
        
        //TODO: already added $.db plugin to claypool, just use it 
        //      instead of $.gdb (need to build and update jquery.claypool)
        //DONE
        db = new $.db({'default':{
            //no db properties needed
        }});
        
        //create a temporary working table for the build phase
        map = $.model('map');
        map.create({
            async: false,
            success: function(result){
                log.info('map domain available');
            }
        });
        
        reduce = $.model('reduce');
        reduce.create({
            async: false,
            success: function(result){
                log.info('reduce domain available');
            }
        });
        
        //create a table for the published indexes
        indexes = $.model('indexes');
        indexes.create({
            success: function(result){
                log.info('indexes available');
            },
            error: function(xhr, status, e){
                log.error('indexes unavailable! %s', xhr.status).
                   exception(e);
            }
        }); 
    };
    
    $.extend($S.MapReduce.prototype, {
        /**
         * service acts as the coordinating singularity to pass out mapreduce
         * steps
         **/
        lease: function(event){
            var i,
                job,
                length,
                leased;
            if(job_queue.length === 0){
                log.debug('queueing available jobs');
                queue_available_jobs(job_queue);
            }else{
                //recover jobs that have been leased then orphaned
                log.debug('checking leases on jobs');
                length = leased_jobs.length;
                for(i=0;i<length;i++){
                    job = leased_jobs.shift();
                    if( !expired(job) ){
                        leased_jobs.push(job);
                        break;
                    }else{
                        log.debug('recovering orphanded job %s', job.id);
                    }
                }
            }
            if(job_queue.length){
                job = job_queue.shift();
                log.info('leasing %s job %s ', job.phase, job.id);
                leased_jobs.push($.extend(job, {
                    token: $.uuid(),
                    leased: new Date().getTime()
                }));
                event.m(leased_jobs[leased_jobs.length -1]).render();
            }else{
                log.info('no jobs to lease');
                event.m({
                    id: null,
                    token: null,
                    leased: null,
                    phase: null
                }).render();
            }
        },
        submit: function(event){
            var id = event.params('id'),
                completed = event.params('completed'),
                phase = event.params('phase'),
                token = event.params('token'),
                data = event.params('data'),
                i,
                new_id,
                index_entry,
                length;
            log.debug('got work submission for job %s', id, data);
                
            //remove the map phase job from the cache and from the persistent
            //storage
            length = leased_jobs.length;
            new_id = id.split('-');
            new_id.pop();
            new_id = new_id.join('-');
            for(i=0;i<length;i++){
                log.debug('looking up lease for token %s', token);
                if(leased_jobs[i].id === id && leased_jobs[i].token === token){
                    try{
                        leased_jobs.splice(i,1);
                        $.model(phase).remove({
                            id:id,
                            async:false,
                            success: function(){
                                log.debug('%s job %s removed', phase, id);
                                event.m({
                                    token: token
                                });
                            },
                            error: function(){
                                log.warn('failed to remove %s job %s', phase, id);
                            }
                        });
                        log.debug('treating %s phase transition for %s', phase, id);
                        index_entry = $.json2js(data);
                        
                        if('map' == phase){
                            log.debug('updating reduce records');
                            $(index_entry).each(function(j, key$value){
                                var key = key$value[0],
                                    value = key$value[1];
                                log.debug('updating reduce record %s', new_id);
                                reduce.update({
                                    id: new_id+'-'+key,
                                    async:false,
                                    data: {
                                        values: $.js2json(value)
                                    },
                                    success: function(response){
                                        log.debug('updated reduce job %s', key);
                                    },
                                    error: function(xhr, status, e){
                                        log.error('failed to update reduce job').
                                            exception(e);
                                    }
                                });
                            });
                        }else if('reduce' == phase){
                            log.info('updating index');
                            indexes.update({
                                id: new_id,
                                data: index_entry,
                                async: false,
                                success: function(response){
                                    log.debug('saved reduced value for %s', new_id);
                                },
                                error: function(){
                                    log.error('failed to save reduced value %s', id);
                                }
                            });
                        }
                        log.info('completed %s phase transition', phase);
                    }catch(e){
                        log.warn('failed to remove %s job %s (exception follows)', phase, id).
                            exception(e);
                    }
                    break;
                }
            }
            log.debug('rendering to response');
            event.m({
                id: id
            }).render();
        }
    });
    
    function queue_available_jobs(job_queue){
        var current_count = job_queue.length;
        map.get({
            async:false,
            limit:10,
            success: function(results){
                var i,
                    data = results.data,
                    length = data.length;
                if(length){
                    log.debug('adding map phase jobs to queue');
                    for(i=0;i<length;i++){
                        job_queue.push({
                            id: data[i],
                            phase: 'map'
                        });
                    }
                }
            }
        });
        if(current_count === job_queue.length){
            //no map jobs left so start hitting reduce jobs
            reduce.get({
                async:false,
                limit:10,
                success: function(results){
                    var i,
                        data = results.data,
                        length = data.length;
                    if(length){
                        log.debug('adding reduce phase jobs to queue');
                        for(i=0;i<length;i++){
                            if(!data[i].match('-reduce$'))
                                job_queue.push({
                                    id: data[i],
                                    phase: 'reduce'
                                });
                        }
                    }
                }
            });
        }
    };
    
    function expired(job){
        var now = new Date().getTime(),
            until = now - 1,
            expires = until - now,
            id = job.id,
            phase = job.phase,
            leased = job.leased;
        log.debug('checking lease id %s phase %s', id, phase);
        try{
            $.model(phase).get({
                async:false,
                id: id,
                success: function(results){
                    var job = results.data.length ? results.data[0] : null;
                    //how long does lease last
                    until = job ? leased + 1000*job.timeout : until;
                    //in how many milliseconds does it expire;
                    expires = until - now;
                    log.debug('job %s leased until %s, now %s ', id, until, now);
                },
                error: function(){
                    log.warn('failed to load job/lease data to determine expiration');
                    expires = -1;
                }
            });
        }catch(e){
            log.warn('failed to load job/lease data to determine expiration').
                exception(e);
            expires = -1;
        }
        log.debug('job %s leases expires in %s milli-seconds', id, expires);
        if( expires < 0 ){
            return true;
        }
        return false;
    };
    
    
})(jQuery, Bigtable.Services);
