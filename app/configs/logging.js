/**
 * @author thatcher
 */

(function($){ 
    
   $.logging([
        { category:"Bigtable",                          level:"INFO" },
        { category:"Bigtable.Models",                   level:"DEBUG" },
        { category:"Bigtable.Views",                    level:"INFO" },
        { category:"Bigtable.Controllers",              level:"DEBUG" },
        { category:"Bigtable.Services",                 level:"DEBUG" },
        { category:"Claypool.Server.RestServlet",       level:"INFO" },
        { category:"Claypool.Models",                   level:"INFO" },
        { category:"Claypool.Router",                   level:"WARN" },
        { category:"Claypool.MVC",                      level:"INFO" },
        { category:"Claypool",                          level:"WARN" },
        { category:"jQuery",                            level:"WARN" },
        { category:"jQuery.plugins.gdb",                level:"INFO" },
        { category:"root",                              level:"ERROR" }
    ]);     
	
    if(jQuery.tmpl)
        jQuery.tmpl.debug = false;
    
})(jQuery);