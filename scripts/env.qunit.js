/**
 * @author thatcher
 */
load('lib/env.rhino.js');
load('local_settings.js');

var starttime = new Date().getTime(),
    endtime;

Envjs({
    // let it load the script from the html
    scriptTypes: {
        "text/javascript"   :true
    },
    // we dont need to load the commercial share this widget
    // for these continuous testing cycles, plus I like to
    // run my tests locally when I'm on the train without
    // a real network connection
    beforeScriptLoad: {
        'sharethis': function(script){
            script.src = '';
            return false;
        }
    },
    // we are also going to hook into qunit logging and 
    // qunit done so we can write messages to the console
    // as tests run, and when complete can write the resulting 
    // file out as a static report of test results
    afterScriptLoad: {
        'qunit': function(){
            //console.log('loaded test runner');
            //hook into qunit.log
            var count = 0,
                module;
            
            // plugin into qunit
            QUnit.moduleStart = function(name, testEnvironment) {
                module = name;
            };
            QUnit.log = function(result, message){
                console.log('{%s}(%s)[%s] %s',
                    module,
                    count++,
                    result ? 'PASS' : 'FAIL',
                    message
                );
            };
            QUnit.done = function(fail, pass){
                endtime = new Date().getTime();
                console.log(
                    'RESULTS: ( of %s total tests )\n' +
                    'PASSED: %s\n' +
                    'FAILED: %s\n' +
                    'Completed in %s milliseconds.',
                    pass+fail,
                    pass,
                    fail,
                    endtime-starttime
                );
                console.log('Writing Results to File');
                jQuery('#qunit-testrunner-toolbar').
                    text('').
                    attr('id', '#envjs-qunit-testrunner-toolbar');
                if(fail === 0){
                    jQuery('#qunit-banner').attr('class', 'qunit-pass');
                }
                Envjs.writeToFile(
                    document.documentElement.outerHTML, 
                    Envjs.uri(REPORTS + 'tests.html')
                );
            };
            
        },
        // when writing our report we dont want the tests
        // to be run again when we view the file in a
        // browser so set script tags to non-standard type
        '.': function(script){
            script.type = 'text/envjs';
        }
    }
});

window.location = 'http://localhost:8080/test'
