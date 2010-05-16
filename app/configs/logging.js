/**
 * @author thatcher
 */

(function($){ 
    
   $.logging([
        { category:"Bigtable",                         level:"INFO" },
        { category:"Bigtable.Models",                  level:"DEBUG" },
        { category:"Bigtable.Views",                   level:"INFO" },
        { category:"Bigtable.Controllers",             level:"INFO" },
        { category:"Bigtable.Services",                level:"DEBUG" },
        { category:"Claypool.Models",               level:"INFO" },
        { category:"Claypool.Router",               level:"INFO" },
        { category:"Claypool.MVC",                  level:"WARN" },
        { category:"Claypool",                      level:"WARN" },
        { category:"jQuery",                        level:"INFO" },
        { category:"root",                          level:"WARN" }
    ]);     
	
    jQuery.tmpl.debug = false;
    
})(jQuery);