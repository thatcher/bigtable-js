/**
 * @author thatcher
 */
(function($, $S){
    
    var log,
        db;
    
    $S.Site = function(options){
        $.extend(true, this, options);
        log = $.logger('Bigtable.Services.Site');
        db = new $.gdb($.env('dbconnection'));
    };
    
    $.extend($S.Site.prototype, {
        find: function(event){
            event.response.headers['Content-Type'] = 'text/plain';
            var query = q2query(event.params('q'));
            query.limit = event.params('num') ? 
                Number(event.params('num')) :
                20;
            query.start = event.params('start') ? 
                Number(event.params('start')) :
                1;
            log.debug('finding contacts with constructed query %o', 
                event.params());
            db.find({
                select:query,
                data:event.params('values'),
                async: false,
                success: function(result){
                    event.write(JSON.stringify(result, null, '  '));
                },
                error: function(xhr, status, e){
                    throw e;
                }
            });
        },
       
       
        play: function(event){
        
            event.write("search: \n");
            event.response.headers['Content-Type'] = 'text/plain';
            
            log.debug("existing domains");
            db.get({
                async: false,
                success: function(result){
                    event.writeln("existing domains\n"+JSON.stringify(result, null, '  ')+'\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            log.debug("create contacts domain");
            db.create({
                domain: 'contacts',
                async: false,
                success: function(result){
                    event.writeln('create contacts domain\n'+JSON.stringify(result, null, '  ')+'\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            
            log.debug("batch save of contacts");
            var people = [{   
                $id:'jane-roe',
                firstname:'jane',
                lastname:'roe',
                address:'1234 Maddex Farm Dr',
                city: 'Shepherdstown',
                state: 'WV',
                phone: '555-555-1234',
                age: '25',
                zipcode: '25443',
                $class:    ['friend']
            },{
                $id:'john-deer',
                firstname:'john',
                lastname:'deer',
                address:'234 Potomac St',
                city: 'Harpers Ferry',
                state: 'WV',
                age: '55',
                zipcode: '25424',
                $class:    ['school']
            },{
                $id:'bob-dole',
                firstname:'bob',
                lastname:'dole',
                address:'435 Deer Park Ln',
                city: 'Sharpsburg',
                state: 'MD',
                age: '99',
                zipcode: '25336',
                $class:    ['work']
            },{
                $id:'chaquita-estudiante',
                firstname:'chaquita',
                lastname:'estudiante',
                address:'354 Thatcher Dr',
                city: 'Shepherdstown',
                state: 'WV',
                age: '18',
                zipcode: '25443',
                $class:    ['school','friend']
            }];
            
            db.save({
                domain: 'contacts',
                data: people,
                batch: true,
                async: false,
                success: function(result){
                    log.debug('2 times?');
                    event.writeln('batch save of contacts\n'+JSON.stringify(result, null, '  ')+'\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            log.debug('listing contact ids');
            db.get({
                domain: 'contacts',
                async: false,
                success: function(result){
                    event.writeln("listing contact ids\n"+JSON.stringify(result, null, '  ')+'\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            
            log.debug('finding contact by name with "native" query');
            db.find({
                select:"new Query('contacts').addFilter('$class', $EQUAL, 'friend')",
                async: false,
                success: function(result){
                    event.writeln("finding contact by name with \"native\" query\n"+
                        JSON.stringify(result, null, '  ')+
                    '\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            
            log.debug('building query "contact"');
            var query = $.query('contacts').
                items().
                where('$class').
                is('friend');
            event.writeln('constructing query \n'+JSON.stringify(query, null, '  ')+'\n');
            
            log.debug('finding contacts with constructed query');
            db.find({
                select:query,
                async: false,
                success: function(result){
                    event.writeln("finding contacts with constructed query\n"+
                        JSON.stringify(result, null, '  ')+
                    '\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            query = $.query('contacts').
                items().
                where('$class').
                isnot('friend');
            event.writeln('constructing query \n'+JSON.stringify(query, null, '  ')+'\n');
            
            
            log.debug('finding contacts with constructed query');
            db.find({
                select:query,
                async: false,
                success: function(result){
                    event.writeln("finding contacts with constructed query\n"+
                        JSON.stringify(result, null, '  ')+
                    '\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            query = $.query('contacts').
                items().
                where('age').
                isbetween([18, 30]);
            event.writeln('constructing query \n'+JSON.stringify(query, null, '  ')+'\n');
            
            
            log.debug('finding contacts with constructed query');
            db.find({
                select: query,
                async: false,
                success: function(result){
                    event.writeln("finding contacts with constructed query\n"+
                        JSON.stringify(result, null, '  ')+
                    '\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            query = $.query('contacts').
                items(['firstname', 'lastname']).
                where('$class').
                isin(['friend', 'school']);
            event.writeln('constructing query \n'+JSON.stringify(query, null, '  ')+'\n');
            
            
            log.debug('finding contacts with constructed query');
            db.find({
                select:query,
                async: false,
                success: function(result){
                    event.writeln("finding contacts with constructed query\n"+
                        JSON.stringify(result, null, '  ')+
                    '\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            log.debug('deleting domain contacts');
            db.destroy({
                domain: 'contacts',
                async: false,
                success: function(result){
                    event.writeln("deleting domain\n"+JSON.stringify(result, null, '  ')+'\n');
                },
                error: function(xhr, status, e){
                    event.writeln(e);
                }
            });
            
            $([
                'contacts',//all contacts
                'contacts#john-deer',//contact with $id
                'contacts.friend',//contacts with 'friend' in $class
                'contacts[phone]',//contacts with field phone
                'contacts[firstname=john]',//contacts with firstname 'john'
                'contacts[firsname!=john]',//contacts with firstname not 'john'
                'contacts.friend, contacts.family',//contacts with 'friend' or 'family' in $class
                'contacts[firstname=john][lastname=deer]',//contacts with firstname 'john' and lastname 'deer'
            ]).each(function(index, value){
                q2query(value)
            });
            
        }
        
    });
    
    function q2query(value){
        var x = /^([^\#\.\[\]]*)(\#[\w\-]*)?(\.[\w\-]*)?(\[[^\[\]]*\])*$/g,
            query = {
                context:'',
                expressions:[]
            };
        value.replace(x, function(){
            var args = [],i, length = arguments.length;
            for(i=0;i<length;i++){
                if (arguments[i])
                    args.push(arguments[i]);
            }
            
            log.debug("query parts %s",args[0]);
            log.debug('selector %s', args.shift());
            query.context = args.shift();
        
            var next; 
            while(next = args.shift()){
                switch(next.substring(0,1)){
                    case '#':
                        query.expressions.push({
                            operator:'=',
                            name:'$id',
                            value: next,
                            type: 'and'
                        });
                        break;
                    case '.':
                        query.expressions.push({
                            operator:'@',
                            name:'$class',
                            value: next,
                            type: 'and'
                        });
                    case '[':
                        next = next.replace('[','').replace(']','');
                        if(next.match('!=')){
                            next = next.split('!=');
                            query.expressions.push({
                                operator:'!=',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else if(next.match('>=')){
                            next = next.split('>=');
                            query.expressions.push({
                                operator:'>=',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else if(next.match('<=')){
                            next = next.split('<=');
                            query.expressions.push({
                                operator:'<=',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else if(next.match('=')){
                            next = next.split('=');
                            query.expressions.push({
                                operator:'=',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else if(next.match('>')){
                            next = next.split('>');
                            query.expressions.push({
                                operator:'>',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else if(next.match('<')){
                            next = next.split('<');
                            query.expressions.push({
                                operator:'<',
                                name: next[0],
                                value: next[1],
                                type: 'and'
                            });
                        }else{
                            query.expressions.push({
                                operator:'>',
                                name:next,
                                value: '',
                                type: 'and'
                            });
                        }
                }
            }
            
        });
        log.debug('%s', JSON.stringify(query))
        return query;
    };
    
})(jQuery, Bigtable.Services);
