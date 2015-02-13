function startOnInit(e) {
    log("..startOnInit(e)");
}

function startOnShow(e) {
    log("..startOnShow(e)");
    /*if (settings.nodeId <= 0) {
        $("#error-button").removeClass("hidden");
    }*/
}

/*function startVisitsOnClick(e) {
    app.navigate("views/VisitList.html");
}
*/
/*function startPointListOnClick(e) {
    app.navigate("views/PointList.html");
}
*/
function startExchangeOnClick(e) {
    dbTools.exchange(function() {log("----Exchange SUCCSESS");}, function(errMsg) {log("----Exchange ERROR: " + errMsg);});
}

/*function startSettingsOnClick(e) {
    app.navigate("views/test/Test.html");
}
*/

function startErrorOnClick(e) {
    alert("Установите идентификатор устройства (nodeId)");
}