function startOnInit(e) {
    log("startOnInit(e)");
}

/*function visitsOnClick(e) {
    app.navigate("views/VisitList.html");
}
*/
/*function pointListOnClick(e) {
    app.navigate("views/PointList.html");
}
*/
function exchangeOnClick(e) {
    dbTools.exchange(function() {log("----Exchange SUCCSESS");}, function(errMsg) {log("----Exchange ERROR: " + errMsg);});
}

/*function settingsOnClick(e) {
    app.navigate("views/test/Test.html");
}
*/
