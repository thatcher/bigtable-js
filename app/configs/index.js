
/**
 * Examples of how I'd like to use it:
 */
$.index([{
    id: 'location_type',
    domains: '^hhh$',
    chunk: 1000, //number of records per worker request
    timeout: 20, //seconds
    map: function(id, datapoint){
        return [ datapoint.location_type, 1 ];
    },
    combine: function(data){
        //a basic field 'count' combine
        var prop,
            value,
            i,
            length = data.length,
            combined = {};
        for(i=0; i<length; i++){
            prop = data[i][0];
            value = data[i][1];
            if(prop in combined){
                combined[prop] += value;
            }else{
                combined[prop] = value;
            }
        }
        var results = [];
        for(prop in combined){
            results.push([prop, combined[prop]]);
        }
        return results;
    },
    reduce: function(key, values){
        //summation of values;
        var i = value = 0, 
            length = values.length;
        for(i=0; i < length; i++){
            value += Number(values[i])||0;
        }
        return value;
    }
}]);

