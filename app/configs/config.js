/**
 * Copyright (c) 2008-2010 Bigtable-JS
 * @author thatcher
 */
var Bigtable = {
	Models:{},
	Views:{},
	Controllers:{},
	Services:{}
};
(function($){
 	
    $.scan([
        "Bigtable.Models", 
        "Bigtable.Views", 
        "Bigtable.Services",
        "GAE.Services"
    ]);
    
})(jQuery);
    
