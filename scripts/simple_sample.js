/**
 * @author thatcher
 */

jQuery(function($){

    function getData(callback){
        var start = new Date().getTime();
        $.ajax({
            type:'get',
            url:'/geocodes'+location.search.replace('client=true', 'fo=json'),
            dataType:'json',
            success: function(model){
                $('#main').append( "Load time:" + (new Date().getTime()-start));
                location.search.match("stress") ? 
                    stressRender(model) :
                    callback(model);
            },
            error: displayError
        });
    };
    
    function renderTemplate(model){
        $.ajax({
            type:'get',
            url:'/app/templates/html/pages/geocodes.tmpl',
            dataType:'text',
            success: function(tmpl){
                var start = new Date().getTime();
                $('#status').html( "rendering" );
                $('#results_client').
                    empty().
                    append( $(tmpl).get(2).innerHTML, model ).
                    append( "Render time:" + (new Date().getTime()-start));
            },
            error: displayError
        });
    };
    
    function stressRender(model){
        var url = '/app/templates/html/partials/fragmentC.tmpl'; 
        $.ajax({
            type: 'get',
            url: url,
            dataType:' text',
            success: function(tmpl){
                var power = 2;
                for(var i=0;i<power;i++){
                    //doubles array so power equal 2 means array is 4 times
                    //the size
                    Array.prototype.push.apply(model.items, model.items);
                    
                }
                $('#status').html( "rendering" );
                var start = new Date().getTime(),
                    results;
                    
                //A's require array single data object
                /*$('#results_client').
                    empty().
                    append( tmpl, model );*/
                    
                //B's require array of data objects
                /*$('#results_client').
                    empty().
                    append( tmpl, model.items );*/
                   
                
                /*$('#results_client').
                    empty().
                    append( $.render( tmpl, model.items ) );*/
                    
                /*$('#results_client').
                    empty().
                    html( $.render( tmpl, model.items ).join('') );*/

                /*$($.render( tmpl, model.items )).appendTo('#results_client');*/
                
                
                //C's require single data object
                $('#results_client').
                    empty().
                    append( tmpl, model );
                    
                $('#results_client').
                    append( "<br/>template:" + url ).
                    append( "<br/>Array length:" + model.items.length ).
                    append( "<br/>Render time:" + (new Date().getTime()-start) ).
                    append( "<br/>buildFragment:" + TIME_IN_BUILDFRAGMENT).
                    append( "<br/>"+new Date());
                    
                
            },
            error: displayError
        });
    };
    
    function displayError(xhr, status, e){
        $('#results_client').
            empty().
            append(e);
    };
    
    getData(renderTemplate); 

}); 
