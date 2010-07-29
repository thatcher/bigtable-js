/**
 * @author thatcher
 */
(function($){

    $.routes({
        
        "hijax:server" : [{
            id:"#bigtable-site-routes",
            hijaxMap:
                [{ urls :"/rest/?$",                            controller:"#restService"   },
                 { urls :"/rest/|:domain|/?$",                  controller:"#restService"   },
                 { urls :"/rest/|:domain|/|:id|/?$",            controller:"#restService"   },
                 { urls :"/manage/<:command(\\w+):>/?$",        controller:"#manageService" },
                 { urls :"/admin/?$",                           controller:"#siteService",  action:'admin'},
                 { urls :"/play/?$",                            controller:"#siteService",  action:'play'},
                 { urls :"/find/?$",                            controller:"#siteService",  action:'find'},
                 { urls :"/geocodes/?$",                        controller:"#siteService",  action:'geocodes'},
                 { urls :"/home/?$",                            controller:"#siteService",  action:'home'},
                 { urls :"/mapreduce/lease$",                   controller:"#mapReduceService",  action:'lease'},
                 { urls :"/mapreduce/submit/|:id|",             controller:"#mapReduceService",  action:'submit'}]
        }],
        
        "hijax:a" : [{
            id:"#bigtable-hash-routes",
            filter:"[href*=#]",
            hijaxMap:
                [{ urls :"/admin/domains/?",                  controller:"#adminController",      action: 'list_domains'},
                 { urls :"/admin/domain/|:domain|/remove?$",  controller:"#adminController",      action: 'remove_domain'},
                 { urls :"/mapreduce/publish/?$",             controller:"#mapReduceController",  action: 'publish'},
                 { urls :"/mapreduce/publish/|:id|?$",        controller:"#mapReduceController",  action: 'publish'},
                 { urls :"/mapreduce/lease/?$",               controller:"#mapReduceController",  action: 'lease'},
                 { urls :"/mapreduce/join/?$",                controller:"#mapReduceController",  action: 'join'}]    
        }],
        
        "hijax:form" : [{
            id:"#bigtable-form-routes",
            filter:"[action*=#]",
            hijaxMap:
                [{ urls :"/admin/domain/add?$",               controller:"#adminController",   action: 'add_domain'}]    
        }]
        
    });
    
})(jQuery);
