/**
 * @author thatcher
 */
(function($, $M){

    var log;
    
    $M.Indexes = function(options){
        log = $.logger('Bigtable.Models.Indexes');
    };
    
    $.extend($M.Indexes.prototype,{
       run: function(){
            (function(index){
                //master-aync-strategy
                var query = index.query,
                    db = index.db,
                    map = index.map,
                    reduce = index.reduce,
                    total_time = new Date().getTime(),
                    complete = false,
                    running = 0,
                    tmp = [],
                    final = {}; 
                query.limit = 1000;
                query.start = 1;
              
                log.debug('indexing domain %s from %s', index.db.name, query.start);
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
                                $('body',document).
                                    append('<pre>'+(new Date().getTime()-total_time)+'</pre>').
                                    append('<pre>'+$.js2json(final, null, "  ")+'</pre>');
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
            })({
                id: 'counts',
                db: $.model('hhh'),
                query: $.query('hhh').items(),
                map: function(){
                    return [[ this.location_type, 1 ]];
                },
                reduce: function(key, values){
                    //summation of values;
                    var i = value = 0, 
                        length = values.length;
                    for(i=0; i < length; i++){
                        value += values[i]||0;
                    }
                    return value;
                }
            });
           
       } 
    });
    

})(jQuery, Bigtable.Models);


/**
 * Examples of how I'd like to use it:

    $.index([{
        id: 'counts',
        db: $.model('hhh'),
        query: $.query('hhh').items(),
        map: function(key, value){
          
        },
        reduce: function(key, values){
          
        }
    },{
    
    }]);

 * 
 * 
 **/

