/**
 * @author thatcher
 */
(function($){

    $.routes({
        "hijax:server" : [{
            id:"#bigtable-site-routes",
            hijaxMap:
                [{ urls :"/rest/?$",                                controller:"#restService"   },
                 { urls :"/rest/|:domain|/?$",                      controller:"#restService"   },
                 { urls :"/rest/|:domain|/<:id(.+):>/?$",           controller:"#restService"   },
                 { urls :"/manage/<:command(\\w+):>/?$",            controller:"#manageService" },
                 { urls :"/play/?$",                                controller:"#siteService",  action:'play'},
                 { urls :"/find/?$",                                controller:"#siteService",  action:'find'}]
        }]   
    });
    
})(jQuery);
