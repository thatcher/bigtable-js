/**
 * @author thatcher
 */
(function($){

    $.routes({
        "hijax:server" : [{
            id:"#bigtable-site-routes",
            hijaxMap:
                [{ urls :"/rest/?$",                                  controller:"#restService"   },
                 { urls :"/rest/<:domain(\\w+):>/?$",                 controller:"#restService"   },
                 { urls :"/rest/<:domain(\\w+):>/<:id(.+):>/?$",      controller:"#restService"   },
                 { urls :"/manage/<:command(\\w+):>/?$",              controller:"#manageService" }]
        }]   
    });
    
})(jQuery);
