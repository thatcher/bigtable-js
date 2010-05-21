/**
 * @author thatcher
 */
load('lib/env.rhino.js');
load('lib/jquery.js');
load('plugins/jquery.gdb.js');

console.log('creating db connection');
var db = new $.gdb({'default':{
    //no db properties needed
}});

console.log("existing domains");
db.get({
    async: false,
    success: function(result){
        console.log(JSON.stringify(result));
    },
    error: function(xhr, status, e){
        ok(false, 'failed to get db domains: status('+(e?e:status)+')');
    }
});
    
