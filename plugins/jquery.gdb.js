/**
 * GDB Implementation for jQuery
 * @author thatcher
 */
(function($, $G){

    var version = 'http://appengine.google.com/1.0/';
    
    var connections = {
        //accessKeyId, secretKey, endpoint, version
        'default':{
            //TODO: allow them to set transaction policy,
            //      this seems to be the only db option
        }
    };
    
    var log = {
        debug:function(){return this;},
        info:function(){return this;},
        warn:function(){return this;},
        error:function(){return this;},
        exception:function(){return this;}
    };
    
    /**
     * @constructor
     */
    $.gdb = function(options){
        this.connections = {};
        $.extend(true, this.connections, connections, options);
        this.entityManager = $G.DatastoreServiceFactory.getDatastoreService();
        
        if($.isFunction($.logger)){
            log = $.logger('jQuery.plugins.gdb');
			log.debug('entityManager : %s', this.entityManager);
        }
        return this;
    };
    
    $.extend($.gdb.prototype,{

        create: function(options){
            //Apps Engine actually has no need to create domains (or 'kind's 
            //as they call it) because they are automatically created as soon
            //as an entity od that 'kind' is put.  However if we want to be able
            //to introspect all the available 'kind's we need to create an iconic
            //record which we can query on a known key 
            log.debug('creating domain %s', options.domain);
            var entity = new $G.Entity('jquery_gdb', options.domain);
            entity.setProperty('kind', options.domain);
            entity.setProperty('timestamp', $.uuid());
            
            var key = this.entityManager.put(entity);
            log.debug('created domain metadata entry %s (%s)', 
                entity.getKind(), $G.KeyFactory.keyToString(key))
                
            return options.success({
                db:         version,
                request:    $.uuid(),
                domain:     options.domain,
                cpu:        'n/a'
            });
        },

        metadata: function(options){
            //DomainMetadata
            //  - operation only available at the domain level
            var entity,
                timestamp,
                total = 0,
                count = 0,
                complete = false,
                limit = 1000,
                start = 1,
                select;
            
            entity = this.entityManager.get(
                $G.KeyFactory.createKey('jquery_gdb', options.domain)
            );
            timestamp = entity.getProperty('timestamp');
            
            select = this.entityManager.prepare(
                new $G.Query(options.domain)
            );
            
            while(!complete){
                log.warn('counting entities. total : %s - start : %s', total, start);
                select.asQueryResultIterator(
                    $G.FetchOptions.Builder.
                        withLimit(limit).
                        offset((start-1)*limit)
                );
                count = select.countEntities();
                total += count;
                if( count < limit  || count > limit ){
                    complete = true;
                } else {
                    start++;
                }
            }
            
            return options.success({
                db:      version,
                request:    $.uuid(),
                domain:     options.domain,
                total:      total,
                timestamp:  timestamp,
                cpu:        'n/a',
                namesize:   'n/a',
                valuesize:  'n/a',
                size:       'n/a'
            });
        },
        
        destroy: function(options){
            var select,
                results,
                entity,
                keys,
                i;
            if (options.domain) {
                log.debug('destroying gdb domain %s', options.domain);
                try{
                    entity = this.entityManager.
                        get($G.KeyFactory.createKey(
                            'jquery_gdb', 
                            options.domain
                        ));
                    this.entityManager['delete'](entity.getKey());
                }catch(e){
                    log.error('error deleting meta record %s', options.domain).
                        exception(e);
                }
                
                select = $G.Query(options.domain);
                results = this.entityManager.prepare(select.setKeysOnly()).
                    asIterator();
                keys = [];
                while(results.hasNext()){
                    entity = results.next();
                    log.debug('will delete %s', entity.getKey());
                    keys.push(entity.getKey());
                }
                log.debug('deleting all entities from %s', options.domian);
                this.entityManager['delete'].apply(this.entityManager, keys);
                
                return options.success({
                    db:         version,
                    request:    $.uuid(),
                    domain:     options.domain,
                    cpu:        'n/a'
                });
            }
            
        },

        remove: function(options){
            var key,
                entity,
                prop,
                value,
                i;
            
            if(options.domain&&options.id){
                //DeleteAttributes
                
                //if no attributes are specified the entire item is deleted!
                key = $G.KeyFactory.createKey(options.domain, options.id);
                
                if(options.data&&(options.data instanceof Array)){
                    //array of names to delete
                    entity = this.entityManager.get(key);
                    for(i=0;i<options.data.length;i++){
                        log.debug('deleting property %s from entity %s %s', 
                            options.data[i], options.domain, options.id);
                        entity.removeProperty(options.data[i]);
                    }
                    this.entityManager.put(entity);
                }else if(options.data&&(options.data instanceof Object)){
                    //object of names/value pairs to delete
                    entity = this.entityManager.get(key);
                    for(prop in options.data){
                        if(entity.hasProperty(prop)){
                            //check for single or multi value
                            value = entity.getProperty(prop);
                            if(value instanceof java.util.Collection){
                                //multi-valued
                                value = (java.utils.ArrayList)(value);
                                for(i=0;i<value.size();i++){
                                    if(value.get(i) == options.data[prop]){
                                        log.debug('deleting property %s=%s from entity %s %s', 
                                            prop, options.data[prop], options.domain, options.id);
                                        value.remove(i--);//decrement index to not skip values
                                    }
                                }
                                this.entityManager.put(entity);
                            }else{
                                //single valued
                                if(value == options.data[prop]){
                                    log.debug('deleting property %s=%s from entity %s %s', 
                                        prop, options.data[prop], options.domain, options.id);
                                    entity.removeProperty(prop);
                                    this.entityManager.put(entity);
                                }
                            }
                        }
                    }
                }else{
                    //delete entire item
                    log.debug('deleting entity %s %s', options.domain, options.id);
                    this.entityManager['delete'](key);
                }
                log.debug('successfully deleted entity or fields from %s %s', 
                    options.domain, options.id);
                return options.success({
                    db:         version,
                    request:    $.uuid(),
                    domain:     options.domain,
                    id:         options.id,
                    cpu:        'n/a'
                });
            }
        },
        
        
        /**
         * @implements PutAttributes, BatchPutAttributes
         */
        save: function(options){
			log.debug('save options domain(%s), id(%s), batch(%s)',
			     options.domain, options.id, options.batch);
            var entity,
                key,
                id,
                prop,
                collection,
                transaction,
                i,j;
            try{
                if (!options.id && options.batch && options.domain) {
                    //  - no options.id implies a batch operation
                    // BatchPutAttributes
                    //this.create(options);
                    for(i=0;i<options.data.length;i++){
                        log.debug('saving batch item %s', i);
                        id = options.data[i].$id;
                        //each prop in options.data is an id and its value is the 
                        //object to store
                        if(id === undefined){
                            log.warn("no id specified!!");
                            try{
                                log.warn('%s',$.js2json(options.data[i], null, '\t'));
                            }catch(e){}
                            id = 'gdb_'+$.uuid();
                        }
                        log.debug('saving item %s to domain %s', id, options.domain);
                        //PutAttributes
                        entity = new $G.Entity(options.domain, id);
                        
                        js2entity(options.data[i], entity);
                        
                        entity.setProperty('$id', id);
                        this.entityManager.put(entity);
                    }
                    return options.success({
                        db:      version,
                        request:    $.uuid(),
                        domain:     options.domain,
                        cpu:        'n/a'
                    });
                    
                }else if(options.id&&options.domain){
                    log.debug('saving item %s to domain %s', options.id, options.domain);
                    //PutAttributes
                    if(options.update){
                        key = $G.KeyFactory.createKey(options.domain, options.id);
                        try{
                            entity = this.entityManager.get(key);
                        }catch(e){
                            log.warn('no such entity %s %s', options.domain, options.id).
                                info('creating new entity %s %s', options.domain, options.id);
                            entity = new $G.Entity(options.domain, options.id);
                            entity.setProperty('$id', options.id);
                        }
                    }else{
                        entity = new $G.Entity(options.domain, options.id);
                        entity.setProperty('$id', options.id);
                    }
                    
                    js2entity(options.data, entity, options.update);
                    
                    log.debug('saving entity %s', options.id);
                    this.entityManager.put(entity);
                    return options.success({
                        db:      version,
                        request:    $.uuid(),
                        domain:     options.domain,
                        id:         options.id,
                        cpu:        'n/a'
                    });
                }else{
                    log.debug('no case for save');
                }
            }catch(e){
                if(transaction){
                    transaction.rollback();
                }
                log.error('failed to save data %s', options.domain).
                    exception(e);
                if(options.error && $.isFunction(options.error)){
                    options.error({}/*mock xhr*/, 'error', e);
                }
            }
        },
        update: function(options){
            //does not overwrite existing fields, just adds values to them
            return this.save($.extend(options, {update:true}));
        },
        /**
         * $.gdb.get
         * 
         * @implements ListDomains, GetAttributes
         * @options Object
         *     max Number         - The maximum number of domain names you want 
         *                        - returned. (not required)
         *     range Number       - 1 to 100 (default  - 100) 
         *     next String        - that tells Amazon SimpleDB where to start the 
         *                        - next list of domain names. (not required) 
         *         
         * Exceptions  
         *     InvalidParameterValue  - Value (" + value + ") for parameter 
         *                            - 'max'  is invalid. 'max' must be between 
         *                            - 1 and 100.
         *     InvalidNextToken       - The specified next token is not valid.
         *            
         */
        get: function(options){
            var select,
                results,
                key,
                entity,
                props,
                prop,
                list,
                data,
                limit = options.limit ? Number(options.limit) : 1000,
                offset = options.offset ? Number(options.offset) : 0,
                start = options.start ? Number(options.start) : 1,
                i,j;
                
                log.debug('limit %s, offset %s, start %s:', limit, offset, start);
            if (!options.id && !options.domain) {
                //ListDomains
                //  - no options.item implies a domain list operation
                log.debug('listing gdb entity kinds');
                select = new $G.Query('jquery_gdb');
                
                log.debug('preparing query for jquery.gdb domains');
                results = this.entityManager.prepare(select).
                    asList(
                        new $G.FetchOptions.Builder.
                            withLimit(limit).
                            offset(((start-1)*limit)+offset)
                    ).toArray();
                list = [];
                log.debug('found %s domains', results.length);
                for(var i=0;i<results.length;i++){
                    list[i] = results[i].getProperty('kind')+'';
                    log.debug('domain %s', list[i]);
                }
                return options.success({
                    db:      version,
                    limit:      limit,
                    offset:     offset,
                    start:      start,
                    count:      list.length,
                    request:    $.uuid(),
                    cpu:        'n/a',
                    domains:    list
                });
            }else if(!options.id && options.domain){
                select = new $G.Query(options.domain);
                list = [];
                if(options.domain.substring(0,7) == '__Stat_'){
                    log.debug('preparing query for statistic %s keys', options.domain);
                    results = this.entityManager.prepare(select).
                        asList(
                            new $G.FetchOptions.Builder.
                                withLimit(limit).
                                offset(((start-1)*limit)+offset)
                        ).toArray();
                    log.debug('found %s items', results.length);
                    for(i=0;i<results.length;i++){
                        keys = results[i].getProperties().keySet().toArray()
                        if(keys){
                            list.push(entity2js(entity, props));
                        }
                    }
                }else{
                    log.debug('preparing query for domain %s keys', options.domain);
                    //response is list of item ids for the domain
                    //TODO: need to decide on better way to determin max number
                    //      of returned id's, while allowing for paging.
                    //DONE
                    select.setKeysOnly().addFilter(
                        '$id', 
                        $G.Query.FilterOperator.GREATER_THAN,
                        options.from ? options.from : ''
                    );
                    if(options.before){
                        select.setKeysOnly().addFilter(
                            '$id', 
                            $G.Query.FilterOperator.LESS_THAN,
                            options.before ? options.before : ''
                        );
                    }
                    results = this.entityManager.prepare(select).
                        asList(
                            new $G.FetchOptions.Builder.
                                withLimit(limit).
                                offset(((start-1)*limit)+offset)
                        ).toArray();
                    log.debug('found %s items', results.length);
                    var id_filter = /\(\"(.*)\"\)/;
                    for(i=0;i<results.length;i++){
                        key = id_filter.exec(results[i]);
                        if(key && key.length > 1){
                            list.push(key[1]);
                            //log.debug('item %s', key);
                        }
                    }
                }
                return options.success({
                    db:         version,
                    limit:      limit,
                    offset:     offset,
                    start:      start,
                    count:      list.length,
                    request:    $.uuid(),
                    cpu:        'n/a',
                    data:        list
                });
            }else if(options.id  && options.domain && typeof(options.id)=='string'){
                //retrieves a single item
                log.debug('getting /|:%s|/|:%s|', options.domain, options.id);
                key = $G.KeyFactory.createKey(options.domain, options.id);
                entity = this.entityManager.get(key);
                if(options.data !== undefined && options.data.length > 0){
                    props = options.data;
                }else{
                    props = entity.getProperties().keySet().toArray();
                }
                
                data = entity2js(entity, props);
                
                return options.success({
                    db:      version,
                    request:    $.uuid(),
                    cpu:        'n/a',
                    domain:     options.domain,
                    id:         options.id,
                    data:       [data]
                });
            }else if(options.id && !(typeof(options.id) == 'string') && options.domain ){
                //retrieves a list of items
                log.debug('getting list of items by id %s (%s)', options.id, typeof(options.id));
                list = new java.util.ArrayList();
                for(i=0;i<options.id.length;i++){
                    list.add(new $G.KeyFactory.createKey(options.domain, options.id[i]));
                }
                results = this.entityManager.get(list);
                keys = results.keySet().toArray();
                log.debug('found %s items by id', results.length);
                list = []
                for(i=0;i<keys.length;i++){
                    if(options.data !== undefined && options.data.length > 0){
                        props = options.data;
                    }else{
                        props = results.get(keys[i]).getProperties().keySet().toArray();
                    }
                    entity = results.get(keys[i]);
                    if(entity){
                        data = entity2js(entity, props);
                        //data.$id = options.id[i];
                        list.push(data);
                    }
                }
                return options.success({
                    db:         version,
                    request:    $.uuid(),
                    cpu:        'n/a',
                    limit:      limit,
                    offset:     offset,
                    start:      start,
                    count:      list.length,
                    domain:     options.domain,
                    id:         options.id,
                    data:       list
                });
            }else{
                log.warn('invalid options %s', $.js2json(options,null,4));
            }
        },
        /**
         * @implements Select
         */
        find: function(options){
            var validQuery = /new Query\(\'\w+\'\)(\.addFilter\(\'\w+\'\,\w+\,\'\w+\'\))*(\.addSort\(\'\w+\'\))?/,
                select,
                limit = options.limit ? Number(options.limit) : 20,
                offset = options.offset ? Number(options.offset) : 0,
                start = options.start ? Number(options.start) : 1,
                from = options.from ? options.from : '',
                ors,
                results,
                data = [],
                props,
                i;
            //requires options.select
            
            log.debug('find');
            // log.debug('selecting expression %s', options.select);
            
            if(options.select && typeof(options.select) == 'string' && options.select.match(validQuery)){
                ors = options.select.split('|');
                for(i=0;i<ors.length;i++){
                    select = ors[i];
                    select = select.replace('Query', '$G.Query').
                        replace('$GREATER_THAN_OR_EQUAL', '$G.Query.FilterOperator.GREATER_THAN_OR_EQUAL','g').
                        replace('$LESS_THAN_OR_EQUAL', '$G.Query.FilterOperator.LESS_THAN_OR_EQUAL','g').
                        replace('$GREATER_THAN', '$G.Query.FilterOperator.GREATER_THAN','g').
                        replace('$LESS_THAN', '$G.Query.FilterOperator.LESS_THAN','g').
                        replace('$NOT_EQUAL', '$G.Query.FilterOperator.NOT_EQUAL','g').
                        replace('$EQUAL', '$G.Query.FilterOperator.EQUAL','g').
                        replace('$IN', '$G.Query.FilterOperator.IN','g');
                }
                log.debug('find native:\n\t %s', select);
                select = this.entityManager.prepare(eval(select));
                results = select.asQueryResultIterator();
            }else{
                //log.debug('find raw:\n\t %s', $.js2json(options.select, null, ' '));
                if(options.select){
                    limit = options.select.limit ? options.select.limit : limit;
                    offset = options.select.offset ? options.select.offset : offset;
                    start = options.select.start ? options.select.start : start;
                }
                log.debug('limit %s, offset %s, start %s:', limit, offset, start);
                select = options.select ? 
                    this.js2query(options.select) :
                    this.js2query(q2query(options.q));
                if(options.from){
                    select.addFilter(
                        '$id', 
                        $G.Query.FilterOperator.GREATER_THAN,
                        options.from ? options.from : ''
                    );
                }
                log.info('js: %s', select);
                select = this.entityManager.prepare(select);
                log.info('sql: %s', select);
                results =   select.asQueryResultIterator($G.
                    FetchOptions.Builder.
                        withLimit(limit).
                        offset(((start-1)*limit)+offset));
            }
            
            log.debug('found results, iterating...');
            i=0;
            while(results.hasNext()){
                log.debug('result %s', i);
                entity = results.next();
                if(i===0){
                    if(!!options.data && options.data.length > 0){
                        props = options.data;
                        if(!$.isArray(props)){
                            props = props.split(',');
                        }
                    }
                }
                data.push(entity2js(entity, props));
                i++;
            }
            return options.success({
                db:      version,
                request:    $.uuid(),
                //cursor:   results.getCursor().toWebSafeString(),
                count:      data.length,
                limit:      limit,
                offset:     offset,
                start:      ((start-1)*limit)+offset,
                cpu:        'n/a',
                data:       data
            });
            
        },
        
        /*
         {
            context: '',
            selectors:[],
            expressions:[],
            orderby:{ direction:'forward' },
            limit:0,
            start:0,//page
            offset:0
         }
         */
        js2query : function(query){
            //Handle the basic selection predicate and set context 
            log.debug('building query for context %s', query.context);
            var select = new $G.Query(query.context),
                list, 
                i, j;
            //walk through all our expressions
            log.debug('sql : %s', select);
            log.debug('query expressions %s', query.expressions);
            if(query.expressions.length){
                for(i=0;i<query.expressions.length;i++){
                    log.debug('expression operator %s', query.expressions[i].operator)
                    switch(query.expressions[i].operator){
                        case '=':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.EQUAL,
                                query.expressions[i].value
                            );
                            break;
                        case '!=':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.NOT_EQUAL,
                                query.expressions[i].value
                            );
                            break;
                        /*case '~':
                            select += 
                                '`'+query.expressions[i].name+'` like '+
                                '"'+query.expressions[i].value.replace('*','%')+'" ' 
                            break;
                        case '!~':
                            select += 
                                '`'+query.expressions[i].name+'` not like '+
                                '"'+query.expressions[i].value.replace('*','%')+'" ' 
                            break;*/
                        case '>':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.GREATER_THAN,
                                query.expressions[i].value
                            );
                            break;
                        case '>=':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.GREATER_THAN_OR_EQUAL,
                                query.expressions[i].value
                            );
                            break;
                        case '><':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.GREATER_THAN_OR_EQUAL,
                                query.expressions[i].value[0]
                            );
                            select.addFilter(
                                query.expressions[i].name.toUpperCase(), 
                                $G.Query.FilterOperator.LESS_THAN_OR_EQUAL,
                                query.expressions[i].value[1]
                            );
                            break;
                        case '<':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.LESS_THAN,
                                query.expressions[i].value
                            );
                            break;
                        case '<=':
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.LESS_THAN_OR_EQUAL,
                                query.expressions[i].value
                            );
                            break;
                        case '@':
                            list = new java.util.ArrayList();
                            for(j=0;j<query.expressions[i].value.length;j++){
                                list.add(query.expressions[i].value[i]);
                            }
                            select.addFilter(
                                query.expressions[i].name, 
                                $G.Query.FilterOperator.IN,
                                list
                            );
                            break;
                        /*case '!@':
                            select += 
                                '`'+query.expressions[i].name+'` not in '+
                                '"'+query.expressions[i].value+'" ' 
                            break;*/
                    }
                    
                }
                /*if(query.orderby&&query.orderby.name){
                    select += ' order by '+query.orderby.name+' '+
                        (query.orderby.direction&&query.orderby.direction=='reverse')?' desc ':'';
                }
                if(query.limit){
                    select +=  ' limit '+query.limit+' ';
                }*/
            }
            return select;
        }
        
    });
    
    function entity2js(entity, props){
        var data = {},
            prop,
            i;
        
        log.debug('converting entity to js object %s', entity);
        try{
            props = props?props:entity.getProperties().keySet().toArray();
        }catch(e){
            log.error('failed to convert entity to js').exception(e);
            props = [];
        }
        
        data = {};
        for(i=0;i<props.length;i++ ){
            log.debug('entity has property %s', props[i]);
            prop = field2js(props[i], entity.getProperty(props[i]));
            
            data[props[i]] = prop;
            log.debug('item[%s] is %s', props[i], data[props[i]]);
        }
        return data;
    };
    
    function field2js(name, value){
        var jsArray, j;
        log.debug('converting property %s (typeof %s)', name, value?value['class']:'undefined' );
        if(value instanceof $G.Text){
            //long text field
            log.debug('Text');
            return value.getValue()+'';
        }else if(value instanceof java.util.Collection){
            log.debug('Collection');
            //ugly way to detect if object is single or multi valued
            jsArray = [];
            value = (java.util.ArrayList)(value).toArray();
            log.debug('item[%s] is multi-valued (%s)', name, value.length);
            for(j=0;j<value.length;j++){
                jsArray.push( field2js(name, value[j]) );
                log.debug('item[%s] has prop %s %s', i, name, value[j]);
            }
            return jsArray;
        }else if(value instanceof java.lang.String){
            //short field
            log.debug('String');
            return value+'';
        }else if(value instanceof java.lang.Boolean){
            //short field
            log.debug('Boolean');
            return !!value;
        }else{
            log.debug('Other');
            //single valued and basic type
            return value+'';
        }
    };
    
    function js2entity(data, entity, update){
        var prop,
            collection,
            i;
            
        for(prop in data){
            if(data[prop] instanceof Object && data[prop].length){
                log.debug('entity prop %s is multi-valued', prop);
                //data prop is multi-valued
                if(entity.hasProperty(prop) && update){
                    //prop already exists
                    collection = (java.util.ArrayList)(entity.getProperty(prop));
                }else{
                    //prop is new
                    collection = new java.util.ArrayList();
                }
                for(i = 0; i< data[prop].length;i++){
                    collection.add(js2field(data[prop][i]));
                }
                entity.setProperty(prop, collection);
            }else{
                //data is single valued
                if(entity.hasProperty(prop) && update){
                    log.debug('adding value %s for property %s', prop, data[prop]);
                    //check if entity prop is multi valued
                    if(!(entity.getProperty(prop).add)){
                        log.debug('adding value to entity by converting property to list');
                        //was a single value but is now a multi value
                        collection = new java.util.ArrayList();
                        collection.add(entity.getProperty(prop));
                        collection.add(js2field(data[prop]));
                        entity.setProperty(prop, collection);
                    }else{
                        //was multi value already
                        log.debug('adding value to existing property list');
                         (java.util.ArrayList)(entity.getProperty(prop)).
                                add(js2field(data[prop]));
                    }
                }else{
                    //entity prop is single valued
                    log.debug('reseting value %s for property %s', prop, data[prop]);
                    entity.setProperty(prop, js2field(data[prop]));
                }
            }
        }
    };
    
    function js2field(value){
        if(typeof(value) == 'string'  && value.length > 256){
            log.debug('using Text for value ', value);
            return new $G.Text(value);
        }else{
            return value;
        }
    }
    
    /**
     * Supported subject combinations
     * Currently we are supporting the following selectors
     *      type
     *      type#id
     *      type.class
     */
    var subjects = {
        'type' : function(name){
            /**
             * subject of query has the specified domain/kind/table 
             *      eg: artist 
             *    - means item from table/domain 'artist'
             */
        },
        '#id' : function(value){
            /**
             * subject of query has the specified id 
             *      eg: #thenurbs 
             *    - means item with id 'thenurbs'
             */

        },
        '.class' : function(name){
            /**
             * subject of query has the specified value in the '$class' field 
             *      eg: .surf 
             *    - means item with property '$class' containing value 'surf'
             */
        }
    };
    
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
    
    var operators = {

        '_' : function(){
            /**
             * provides a filter for defined properties
             *      eg: foo[bar] 
             *    - means foo has a attribute named bar
             */
        },

        '=' : function(){
            /**
             * provides a filter for properties equal to a value
             *      eg: foo[bar=goop] 
             *    - means foo has a attribute bar with the value 'goop'
             */
        },
        
        '!=' : function(name, value){
            /**
             * provides a filter for properties not equal to a value
             *      eg: foo[bar!=goop] 
             *    - means foo has a attribute bar without the value 'goop'
             */
        },
        
        '>' : function(name, value){
            /**
             * provides a filter for properties lexically after the value
             *      eg: foo[bar>goop] 
             *    - means foo has a attribute bar with the sort order greater
             *      than the value 'goop'
             */
        },
        
        '>=' : function(name, value){
            /**
             * provides a filter for properties lexically after or the same as the value
             *      eg: foo[bar>=goop] 
             *    - means foo has a attribute bar with the sort order greater
             *      than or equal to the value 'goop'
             */
        },
        
        '<' : function(name, value){
            /**
             * provides a filter for properties lexically before the value
             *      eg: foo[bar<goop] 
             *    - means foo has a attribute bar with the sort order less
             *      than the value 'goop'
             */
        },
        
        '<=' : function(name, value){
            /**
             * provides a filter for properties lexically before or the same as the value
             *      eg: foo[bar<=goop] 
             *    - means foo has a attribute bar with the sort order less
             *      than or equal to the value 'goop'
             */
        },
        
        '^=' : function(name, value){
            /**
             * provides a filter for properties starting with a value
             *      eg: foo[bar^=goop] 
             *    - means foo has a attribute bar starting with the value 'goop'
             */
        }
    };

    var logicals = {

        '&': function(){
            /**
             * provides a logical intersection of selectors, though its not used
             * explicitly, all stacked filters are implemented via '&'
             *      eg: foo[bar^=goop][blah=pooh] 
             *    - means foo has a attribute bar starting with the value 'goop'
             *      which also has a property blah equal to 'pooh' 
             */
        },
        '|': function(){
            /**
             * provides a logical union of selectors, though its not used
             * explicitly, all stacked filters are implemented via '&'
             *      eg: foo[bar^=goop], foo[blah=pooh] 
             *    - means foo that has a attribute bar starting with the value 'goop'
             *      or foo that has a property blah equal to 'pooh' 
             */
        }
    };
    
    var filters = {

        'native': function(){
            /**
             * provides access to the implementation specific query engine
             * language.  must be a string.  implementation may still be limited
             * if the underlying engine does not provide a sql-like language
             *      eg: :native( new Query('test_domain').addFilter('city', EQUAL, 'Shepherdstown') ) 
             */
        },
        
        'count': function(){

        },
        
        'guid': function(){

        },
        
        'contains': function(){

        },
        
        'limit': function(){

        },
        
        'chunk': function(){

        },
        
        'offset': function(){

        },
        
        'sift': function(){

        },
        
        'sort': function(){

        },
        
        'reverse': function(){

        }    
    };
    
})(jQuery, Packages.com.google.appengine.api.datastore);
