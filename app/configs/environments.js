/**
 * @author thatcher
 */
(function($){

	//----------------------------------------------------------------//
	//  -   ENVIRONMENTAL CONFIGURATION   -
	//________________________________________________________________//
	$.env({
        automap:{
            'file:///opt':              'dev.server',
            'file:///base':             'prod.server',
            'http://localhost':         'dev.client',
            'bigtable-js.appspot.com/': 'prod.client'
        },
	    defaults:{
            root: '/',
			templates: 'app/templates/',
            data: 'data/',
            db: 'jQuery.gdb',
            dbclient: 'direct',
            dbconnection: { 'default': {} }
	    },
	    //------------------------------------------------------------//
	    //  -   APPENGINE CONFIGURATION   -
	    //____________________________________________________________//
	    prod:{
	        server:{
	            templates:'http://bigtable-js.appspot.com/app/templates/',
	            data:'http://bigtable-js.appspot.com/data/'
	        },
            client:{
                dbclient: 'rest',
            }
	    },
	    //------------------------------------------------------------//
	    //  -   DEVELOPMENT CONFIGURATION   -
	    //____________________________________________________________//
	    dev:{
	        server:{
	        },
            client:{
                dbclient: 'rest',
            }
	    },
	    //------------------------------------------------------------//
	    //  -   TEST CONFIGURATION   -
	    //____________________________________________________________//
	    test:{
	        server:{
	        }
	    }
	}); 
    
})(jQuery);
    
