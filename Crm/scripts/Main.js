var serverName = "93.190.44.9";
var port = 331;
//var serverName = "127.0.0.1";
//var port = 59278;
var nodeId = 11;
var empId = 1013;

(function () {

    // store a reference to the application object that will be created
    // later on so that we can use it if need be
    var app;

    // create an object to store the models for each view
    /*window.APP = {
        models: {
            test: {
                title: 'Test'
            },
            route: {
                title: 'Route'
            },
            points: {
                title: 'Points'
            }
            //,
            //contacts: {
            //    title: 'Contacts',
            //    ds: new kendo.data.DataSource({
            //        data: [{
            //            id: 1,
            //            name: 'Bob'
            //        }, {
            //            id: 2,
            //            name: 'Mary'
            //        }, {
            //            id: 3,
            //            name: 'John'
            //        }]
            //    }),
            //    alert: function (e) {
            //        alert(e.data.name);
            //    }
            //}
        }
    };
    */
    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {

        // hide the splash screen as soon as the app is ready. otherwise
        // Cordova will wait 5 very long seconds to do it for you.
        navigator.splashscreen.hide();

        app = new kendo.mobile.Application(document.body, {
            // you can change the default transition (slide, zoom or fade)
            transition: 'slide',
            
            // comment out the following line to get a UI which matches the look
            // and feel of the operating system
            skin: 'flat',
            
            // the application needs to know which view to load first
            //initial: 'views/VisitList.html'
            //initial: 'views/PointList.html'
            initial: 'views/test/Test.html'
        });
        
        kendo.culture("en-GB");

    }, false);


}());

//-------------------------------------------------
// log
//-------------------------------------------------

function log(msg) {
    var tm = new Date();
    console.log(dateToStr(tm, "HH:NN:SS:ZZZ") + " " + msg);
    $("#console").append("<li>" + dateToStr(tm, "HH:NN:SS:ZZZ") + " " + msg + "</li>");
}

function logClear() {
    $("#console").empty();
}

function logObjectKeys(o, keyFilter) {
    var isFound = false;
    for (var key in o) {
        if (keyFilter != undefined && keyFilter != '') {
            if (key.indexOf(keyFilter) != -1) {
                isFound = true;
                log(key + "=" + o[key]);
            }
        } else {
            isFound = true;
            log(key + "=" + o[key]);
        }
    }
    if (!isFound) {
        log("'" + keyFilter + "'" + " is not found");
    }
}
