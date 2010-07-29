(function($, $C){
    
    var log,
        db,
        map,
        reduce,
        indexes,
        CONSECUTIVE_ERRORS = 0,
        CONSECUTIVE_SLEEPS = 0,
        SLEEP_STAGE = [
            2, 
            4, 4, 
            8, 8, 8, 8, 
            16, 16, 16, 16, 16, 16, 16, 16, 
            32, 32, 32, 32, 
            64, 64,
            128
        ];
    
    $C.MapReduce = function(options){
        $.extend(true, this, {joined: false}, options);
        db = $.db();
        map = $.model('map');
        reduce = $.model('reduce');
        indexes = $.model('indexes');
        log = $.logger("Bigtable.Controllers.MapReduce");
        
        //create a table for the published indexes
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
    
    $.extend($C.MapReduce.prototype, {
        
        /**
         * 
         **/
        publish: function(event){
            var domains;
            
            //get a list of existing data domains to build indexes on
            $.ajax({
                url: '/rest/',
                dataType:'json',
                async: false,
                success: function(results){
                    log.debug('loaded domains');
                    domains = results.domains;
                }
            });
            
            //partition the domains for mapreduce based 
            //on the configured indexes
            publish_map_phase(domains);
        },
        
        
        /**
         * ask for a new job and do the work
         **/
        lease: function(event){
            var _this = this,
                domain, 
                index;
            try{
                $.ajax({
                    url: '/mapreduce/lease',
                    dataType:'json',
                    success: function(job){
                       if(job && job.id){
                           log.debug('leased job %s', job.id);
                           if( 'map' == job.phase ){
                               map.get({
                                   id: job.id,
                                   success: function(response){
                                       var workload = $.extend(response.data[0], job);
                                       perform_map_work(_this, workload, event);
                                       log.debug('got workload for lease %s', job.id);
                                   },
                                   error: function(xhr, status, e){
                                       log.error(
                                           'failed to aquire job %s | status %s | code %s', 
                                           job.id,
                                           status,
                                           xhr.status
                                       ).exception(e);
                                       _this.recover(event);
                                   }
                               });
                           }else if('reduce' == job.phase){
                               domain = job.id.split('-');
                               index = domain[1];
                               domain = domain[0];
                               reduce.get({
                                   id: [job.id, domain+'-'+index+'-reduce'],
                                   success: function(response){
                                       var i = response.data[0].$id.match('-reduce$')?
                                           1 : 0;
                                       var workload = $.extend(
                                           response.data[i], 
                                           job, {
                                           reduce: response.data[(i+1)%2].reduce
                                       });
                                       perform_reduce_work(_this, workload, event);
                                       log.debug('got workload for lease %s', job.id);
                                   },
                                   error: function(xhr, status, e){
                                        log.error(
                                           'failed to aquire job %s | status %s | code %s', 
                                           job.id,
                                           status,
                                           xhr.status
                                        ).exception(e);
                                        _this.recover(event);
                                   }
                               });
                           }
                        }else{
                           //there is no work in queue so sleep for awhile before checking again
                           CONSECUTIVE_SLEEPS++ > SLEEP_STAGE.length ?
                                SLEEP_STAGE[CONSECUTIVE_SLEEPS++] :
                                _this.sleep(event);
                        }
                    },
                    error: function(){
                        log.error('failed to aquire lease.');
                        _this.recover(event);  
                    }
                });
            }catch(e){
                log.error('error in worker').exception(e);
                _this.recover(event);
            }
            
        },
        
        /**
         * begins or awakens participation as a volunteer cpu in the mapreduce
         **/
        join: function(event){
            log.debug('joining mapreduce');
            this.joined = true;
            this.lease(event);
        },
        
        /**
         * exits participation as a volunteer cpu in the mapreduce
         **/
        leave: function(event){
            log.debug('leaving mapreduce')
            this.joined = false;
        },
        
        /**
         * adds substantial delay between attempts to aquire a new lease
         **/
        sleep: function(event){
            var _this = this;
            log.debug('sleeping (mapreduce)');
            if( this.joined ){
                setTimeout(function(){
                    log.debug('waking');
                    _this.lease(event);           
                },  1000 * SLEEP_STAGE[ 
                    CONSECUTIVE_SLEEPS < SLEEP_STAGE.length ? 
                       CONSECUTIVE_SLEEPS++ :
                       SLEEP_STAGE.length - 1
                ]);
            }
            
        },
        
        /**
         * adds small delay between attempts to aquire a new lease, used to 
         * pick up again after an error
         **/
        recover: function(event){
            var _this = this;
            if(this.joined){
                log.debug('recovering (mapreduce)');
                if(CONSECUTIVE_ERRORS > 10){
                    log.warn('too many consecutive errors, leaving mapreduce');
                }else{
                    CONSECUTIVE_ERRORS++;
                    setTimeout(function(){
                        log.debug('waking');
                        _this.lease(event);           
                    }, 1300);
                }
            }
        }
        
    });
    
    
    /**
     * given the set of domains, match the configured mapreduce indexes
     * and begin to partition and publish individual jobs
     **/
    function publish_map_phase(domains){
        log.debug('clearing any existing work');
        reduce.destroy({
            success: function(){
                reduce.create({
                    success: function(){
                         log.info('reset reduce jobs');
                    }
                });
            }
        });
        map.destroy({
            success: function(results){
                log.info('cleared index workspace');
                //create a temporary working table for the build phase
                map.create({
                    success: function(result){
                        log.info('index workspace available');
                        $($.index()).each(function(i, config){
                            log.info('building index %s', config.id);
                            var domain_selector = new RegExp(config.domains);
                            log.debug('checking for target domains %s', domains);
                            $(domains).each(function(j, domain){
                                log.debug('domain %s : pattern %s', domain, domain_selector);
                                if(domain.match(domain_selector)){
                                    log.debug('domain targeted for indexing : %s', domain);
                                    publish_map_jobs(domain, config);
                                    //publish the reduce function for when mapping is completed
                                    reduce.save({
                                        id: config.id+'-reduce',
                                        data:{
                                            reduce: config.reduce.toString(),
                                            domain: domain,
                                            index: config.id
                                        },
                                        success: function(){
                                            log.debug('published reduce function');
                                        },
                                        error: function(){
                                            log.error('failed to publish reduce function');
                                        }
                                    });
                                }
                            });
                            
                        });
                    },
                    error: function(xhr, status, e){
                        log.error('index workspace unavailable! %s', xhr.status).
                           exception(e);
                    }
                }); 
            },
            error: function(xhr, status, e){
                log.error('indexes unavailable! %s', xhr.status).
                    exception(e);
            }
        });
    };
    
    function publish_map_jobs(domain, index, from){
        var chunk = index.chunk||1000;
        from = from||'';
        log.debug('publishing jobs for domain %s, index %s', domain, index);
        $.model(domain).get({
            from: from,
            limit: chunk,
            success: function(results){
                var job_id = $.uuid(),
                    finished = false;
                log.debug('saving job %s for index (%s)', job_id, index.id);
                
                map.save({
                    id: job_id,
                    data: {
                        index: index.id,
                        domain: domain,
                        data: '/rest/?q='+domain+'&from='+from+'&limit='+chunk,
                        leased: null,
                        created: new Date().getTime()+'',
                        timeout: index.timeout,
                        map: index.map.toString(),
                        combine: index.combine.toString()
                    },
                    success: function(results){
                        log.debug('saved jobs %s %s', domain, index);
                        if(!finished){
                            publish_map_jobs(domain, index, from);
                        }
                    },
                    error: function(){
                        log.error('failed to save jobs');
                    }
                });
                
                //either determine we are finished because the response contains 
                //less than the limit we choose, 
                if(results.data.length < chunk){
                    finished = true;
                }else{
                    //or increment the starting point from which to set the
                    //next data query parameters
                    from = results.data[results.data.length - 1];
                }
                
                
            },
            error: function(){
                log.error('failed to save job for index %s', index.id);
            } 
        });
    };
    
    /**
     * 
     **/
    function perform_reduce_work(worker, workload, event){
        var phase_function,
            result,
            domain,
            index,
            key,
            data = {},
            _this = worker; 
        try{
            domain = workload.$id.split('-');
            index = domain[1];//from domain-index-key
            key = domain[2];
            domain = domain[0];
            log.debug('compiling reduce function %s', workload.reduce);
            eval('phase_function = '+workload.reduce);
            log.debug('performing reduction');
            result = phase_function(
                key,//from domain-index-key 
                workload.values
            );
            data[key] = $.js2json(result);
            log.debug('saving reduced value in an index %s-%s', domain, index);
            submit_job(workload.$id, workload.leased, 'reduce', workload.token, data);
            if(_this.joined){
                setTimeout(function(){
                    worker.lease(event);
                }, 100);
            }
        }catch(e){
            log.error('failed to perform reduce job').
                exception(e);
            _this.recover(event);
        }
    };
        
    function perform_map_work (worker, workload, event){
        var _this = worker;
        // Clearly this is a security concern so...
        // WARNING: - youve been warned
        var phase_function,
            ids;
        try{
            //compile the function once
            eval('phase_function = '+workload.map);
            //load the dataset by id
            $.ajax({
                dataType: 'json',
                url: workload.data,
                success: function(response){
                    log.debug('loaded workload data');
                    
                    $(response.data).each(function(i, data){
                        //reuse the function while crawling the 
                        //array of data points
                        response.data[i] = phase_function(data.$id, data);
                    });
                    if(workload.combine){
                        eval('phase_function = '+workload.combine);
                        response.data = phase_function(response.data);
                    }
                    //we made it this far so save the workload 
                    //results so we can get 'paid'
                    submit_job(workload.$id, workload.leased, 'map', workload.token, response.data);
                    if(_this.joined){
                        setTimeout(function(){
                            worker.lease(event);
                        }, 100);
                    }
                },
                error: function(xhr, status, e){
                    log.error('failed to load dataset by ids %s', xhr.status).
                        exception(e);
                    _this.recover(event);
                }
            });
        }catch(e){
            log.error('failed to compile mapreduce').
                exception(e);   
            _this.recover(event);
        }
    };
        
    function submit_job(id, leased, phase, token, data){
        $.ajax({
            dataType: 'json',
            url: '/mapreduce/submit/'+id,
            type: 'post',
            data: {
               completed: new Date().getTime() - leased,
               phase: phase,
               token: token,
               data: $.js2json(data)
            },
            success: function(response){
                if(response && response.token === token){
                    log.info('submitted workload and successfully credited %s', id);
                    CONSECUTIVE_ERRORS = 0;
                }else{
                    log.warn('submitted workload but not credited %s', id);
                }
            },
            error: function(xhr, status, e){
                log.error('failed to submit workload %s', id).
                    exception(e);
            }
        });
    };
    
    
})(jQuery, Bigtable.Controllers);
