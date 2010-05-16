/**
 * @author thatcher
 */
//When the client/server shell is first loaded the 'inner shell'
//is loaded.  You can load additional resources here.
var server_side = true,
    client_side = false; 
try{
    //env-js is our simulated browser environments so we can use all of
    //our favorite client side libraries and tricks.  Right now
    //the html parser is too big for the rhino compiler to optimize.
    /*Packages.org.mozilla.javascript.Context.
        getCurrentContext().setOptimizationLevel(-1);*/
    
    var __arguments__,
        log;
        
        
    if(!('cwd' in this)){
        client_side = true;
        server_side = false;
        load('http://localhost:8080/lib/env.rhino.js');
        //the client shell has a few extra abilities not
        //available in the white listed google apps engine 
        Envjs.scriptTypes['text/JavaScript'] = true;
        Envjs.scriptTypes['text/javascript'] = true;
        Envjs.scriptTypes['text/envjs'] = false;
    }else{
        load('./lib/env.rhino.js');
        Envjs.scriptTypes['text/javascript'] = true;
        Envjs.scriptTypes['text/envjs'] = true;
    }
    
    //our command hook up allows you to easily use your html interface
    //from the command line
    Envjs.afterScriptLoad = {
        'lib/jquery(.){1}js': function(script){
            jQuery(document).ready(function(){
                var $ = jQuery;
                    $.args = [];
                Array.prototype.push.apply($.args, __arguments__);
            });
        }
    };
    //The next line provide us with a base 'template'
    //and set the server window location.  This must happen before 
    //we load the rest of the javascript so that we can have a 
    //server side context from which to begin defining our application
    //behavior
    if(server_side){
        __arguments__ = [];
        window['server-side'] = true;
        window.location = cwd+'/index.html';
        Envjs.wait();
    }else{
        __arguments__ = arguments;
        window['client-side'] = true;
        window.location = 'http://localhost:8080/index.html';
    }
    
	
}catch(e){
    print(  
    "\n\t/********************************************************"+
    "\n\t * ERROR LOADING SHELL!!"+
    "\n\t *    details :"+
    "\n\t *    " + e.toString() + 
    "\n\t ********************************************************/"  
    );
}

