/**
 * jQuery.tmpl.filters Plugin
 * @author thatcher
 * I just tweaked ariels collection implementation a bit and added
 * the last ten lines or so.
 */
(function( $ ){

/**
 * jQuery.Collection
 * Copyright (c) 2008 Ariel Flesler - aflesler(at)gmail(dot)com
 * Licensed under GPL license (http://www.opensource.org/licenses/gpl-license.php).
 * Date: 1/28/2008
 *
 * @projectDescription Extensible and inheritable jQuery-like collections
 * @author Ariel Flesler
 * @version 1.0.3
 *
 * @id $.collection
 * @param {  , Array } items Any amount of items for the collection, this is a generic (and the base) collection.
 * @return { $.collection } Returns a generic $.collection object.
 *
 * @id $.collection.build
 * @return {subclass of $.collection} Returns a subclass of it's caller ( $.collection in the first case ).
 */
    var f = function(){},
        // get an instance of this constructor, without calling it
        emptyInstance = function( c ){
            f.prototype = (c._constructor||c).prototype;
            return new f();
        },
        //calls the constructor of the object, passing an empty object.
        callConstructor = function( obj, args ){
            return obj.init.apply(emptyInstance(obj), args);
        },
        //generate a constructor for a new collections
        getConstructor = function(){
            return(function( list ){
                var constructor = arguments.callee,
                    obj = this instanceof constructor ? this : 
                        emptyInstance(constructor);
                //special case, cloning
                if( list && list._constructor === constructor ){
                    return obj.setArray( list.get() );
                } return obj.init.apply(obj,arguments);
            }); 
        };
        
    var $collection = getConstructor();
    
    $.extend( $collection, {
        extend: $.extend,
        fn:$collection.prototype,
        statics:'extend,isFunction,isArray,isPlainObject,'+
        'isEmptyObject,error,each,trim,makeArray,inArray,merge,'+
        'grep,map',
        // creates a new collection, that include this 
        // collections prototype
        build:function(){
            // inheritance is possible, all collection will first 
            // inherit from $.collection
            var constr = getConstructor();
            
            //copy the statics
            this.include( constr, jQuery, $collection.statics );
            //create inheritance.
            constr.prototype = constr.fn = emptyInstance(this);
            //we could lose it
            constr._constructor = 
                constr.fn._constructor = 
                    constr.fn.constructor = 
                        constr;
            
            return constr;
        },
        // imports the given methods (names) into target, 
        // from source (optional parse function)
        include:function( target, source, methods, parse ){
            if( !methods || !methods.slice ){
                var args = Array.prototype.slice.call(arguments);
                // insert 'this' first
                args.unshift(this); 
                // call again with fixed arguments
                return this.include.apply(this,args);
            }
            $.each( 
                methods.split ? 
                    methods.split(/\s?,\s?/) : 
                    methods, 
                function( i, func ){
                    target[func] = parse ? 
                        parse(source[func], func, source) : 
                        source[func];
                });
            return target;
        }
    });
    
    $collection.extend( $collection.fn, {
        
        extend:     $collection.extend,
        include:    $collection.include,
        
        init:function( els ){
            // init should always call setArray with the array of 
            // parsed items, to keep jQuery's array structure.
            var items = typeof els == 'object' && 'length' in els ? 
                els : 
                arguments;
            //this is just a generic init.
            return this.setArray( items );
        },
        
        // TODO: add more filtering options
        filter:function( filter ){
            if( typeof filter != 'function' ){
                var out = filter.constructor == Array ? 
                    filter : 
                    [filter];
                filter = function(){ 
                    return $.inArray( this, out ) != -1; 
                };
            }
            return this.pushStack($.grep( this, function( e, i ){
                return filter.call( e, i );
            }));
        },
        not:function( right ){
            right = this.filter(right);
            return this.filter(function(){
                return $.inArray( this, right ) == -1;
            });
        },
        is:function( s ){
            return !!(s && this.filter( s ).length);
        },
        add:function(){
            return this.pushStack( $.merge(this.get(), callConstructor(this,arguments) ) );
        },
        pushStack:function(items){
            var ret = emptyInstance(this).setArray( items.get ? items.get() : items  );
            ret.prevObject = this;
            return ret;
        },
        end:function(){
            return this.prevObject || callConstructor(this);
        },
        attr:function( key, value ){
            return value === undefined ? this[0] != null && this[0][key] : this.each(function(){
                this[key] = value;
            });
        },
        setArray: function(array){
            this.length = 0;
            Array.prototype.push.apply(this, array);
            return this;
        }
    });
    
    //all these methods can be used in the collections, and are exactly (and literally) like in jQuery.
    $collection.fn.include( $.fn, 'each,extend,index,get,size,eq,slice,map,andSelf' );
    
    //Basic template filter plugins or tQuery
    var currentFilters = jQuery.tmpl.filters;
    jQuery.tmpl.filters = $collection.build();
    
    jQuery.tmpl.filters.fn.extend({
        toString: function(){
            return this.join(' ');
        }
    });
    
    jQuery.tmpl.filters.extend(currentFilters);
    
            
})( jQuery );
