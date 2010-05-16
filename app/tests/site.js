/**
 * @author thatcher
 */
module('data');

test('syncdb', function(){
    
    var expectedState,
        actualState,
        tables = ['apis', 'distributables', 'events', 'guides', 'news', 'releases'];
        
    $.ajax({
        async: false,
        contentType:'application/json',
        url: '/data/dump.json',
        dataType: 'json',
        type: 'get',
        success: function(result){
            expectedState = result;
        },
        error: function(xhr, status, e){
            ok(false, 'failed to load dump.json');
        }
    });
    
    
    $.ajax({
        async: false,
        contentType:'application/json',
        dataType:'json',
        url: '/manage/dumpdata',
        success: function(result){
            actualState = result;
        },
        error: function(xhr, status, e){
            ok(false, 'failed to get dumpdata');
        }
    });
    
    $(tables).each(function(index, table){
        for(var i=0; i<expectedState[table].length; i++){
            same(expectedState[table][i], actualState[table][i], 
                table + ' : ' + expectedState[table][i].$id +' is syncronized');
        }
    });
    
});
