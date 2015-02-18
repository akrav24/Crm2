var visitPlanItemId;
var visitPointName = "";

function visitInit(e) {
    log("..visitInit");
    dbTools.objectListItemSet("visit", true);
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    visitPlanItemId = e.view.params.visitPlanItemId;
    
    $("#visit-point-name").text(visitPointName);
}

function visitStartOnClick(e) {
    $("#visit-start-button").addClass("hidden");
    $("#visit-finish-button").removeClass("hidden");
    var prdBgn = new Date();
    $("#visit-time").text(dateToStr(prdBgn, "DD.MM.YYYY HH:NN"));
}

function visitFinishOnClick(e) {
    
}

