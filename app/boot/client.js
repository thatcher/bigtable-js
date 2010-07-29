/**
 * @author thatcher
 */
//  -   BOOT THE APP  -
jQuery.noConflict();
(function($){
    
    //A static logger for any initialization routines we might add here
    var log = $.logger("Bigtable");
    
    //The environments are described in environments.js
    try{
        //auto select environment based on window.location
        $.env();
 	}catch(e){
 	   log.error("Environmental selection is invalid!").exception(e);
 	}
    
    $(document).ready(function(){
        log.info("Initializing Application");
        $.boot(function(){
          //you can do additional initialization here
            log.info("Successfully Initialized Application");
        });
    });    
    
})(jQuery);  
