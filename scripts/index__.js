/**
 * @author thatcher
 */
(function($, $M){

    var log,
        index;
    
    $M.Index = function(options){
        log = $.logger('Claypool.Models.Index');
        index = $.model('index');
        index.create({
            domain: 'index',
            success: function(result){
                log.info('indexes available');
            },
            error: function(xhr, status, e){
                log.error('indexes unavailable! %s', xhr.status)
                   .exception(e);
            }
        });
    };
    
    $.extend($M.Index.prototype,{
        run: function(){
            //master-aync-strategy
            var db = $.model('hhh'),
                query = $.query('hhh').items(),
                reduce = $.config('index')[0].reduce,
                map = $.config('index')[0].map,
                total_time = new Date().getTime(),
                complete = false,
                running = 0,
                tmp = [],
                final = {}; 
            query.limit = 1000;
            query.start = 1;
              
            log.debug('indexing domain %s from %s', db.name, query.start);
            get_batch();
            setTimeout(get_batch, 1000 );
            setTimeout(get_batch, 2000 );
            function get_batch(){
                running += 1;
                db.find({
                    select:query,
                    success: function(results){
                        running -= 1;
                        log.debug('success : results count %s', results.data.length);
                        complete = (results.data.length < query.limit);
                        if(!complete){
                            //making next network call before running map
                            //is important for master-async-strategy
                            get_batch();
                        }
                        var start = new Date().getTime();
                        tmp = $(results.data).map(map);
                        //more master-async-strategy there are no workers to
                        //pass the mapped batch off too so we make best use
                        //of the time spent in network to get next batch so
                        //run reduce now
                        var key,
                            i=0,
                            total = tmp.length,
                            group = {};
                        
                        //sort the mapped array of key values on key into an array
                        //to pass to reduce
                        for(i=0; i < total; i++){
                            key = tmp[i][0];
                            value = tmp[i][1];
                            if( !(key in group) ){ 
                                group[key] = [];
                            }
                            if( $.isArray( value ) ){
                                Array.prototype.push.apply(group[key], value);
                            }else{
                                group[key].push(value);
                            }
                        }
                        
                        for( key in group ){
                            //would normally be done by workers, make sure to apply as
                            //iteration on last reduce
                            final[key] = reduce(key, [ final[key], reduce(key, group[key]) ]);
                            log.debug( '(%s)map+reduce=%sms',key,  new Date().getTime()-start);
                        }
                        if(complete && !running){
                            log.debug( 'total map+reduce+strategy=%sms', new Date().getTime()-total_time);
                            log.info('%s', $.js2json(final[key], null, "  "));
                            /*$('body',document).
                                append('<pre>'+(new Date().getTime()-total_time)+'</pre>').
                                append('<pre>'+$.js2json(final, null, "  ")+'</pre>');*/
                            index.save({
                                id:'hhh_counts',
                                data:final,
                                success: function(result){
                                    log.info('created index %s', 'hhh_counts');
                                },
                                error: function(xhr, status, e){
                                    log.error('could not create index %s %s', 'hhh_counts', xhr.status)
                                       .exception(e);
                                }
                            });
                        }
                    },
                    error: function(xhr, status, e){
                        running -= 1;
                        log.error('error %s', xhr?xhr.status:status).
                            exception(e);
                    }
                });
                //incrementing just after ajax call is very important for
                //master-async-strategy
                query.start += 1;
            }
           
       } 
    });
    

/** 
 * tmp - todo moves to models/plugins.js
 **/
$.extend($, {
    index: function(){
        if(arguments.length === 0){
            return $.config('index');
        }else{
            return $.config('index', arguments[0]);
        }
    }
});
    
/**
 * belongs in models/namespace.js
 **/
Claypool.Configuration.index = [];

})(jQuery, Claypool.Models);


