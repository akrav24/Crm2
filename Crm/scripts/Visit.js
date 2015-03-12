var visit;

function visitInit(e) {
    log("..visitInit");
    visit = {};
    visit.visitPlanItemId = null;
    visit.visitId = null;
    visit.isVisitIdReset = 1;
    visit.readonly = false;
    visit.dateBgn = null;
    visit.custId = null;
    visit.fmtFilterType = 0;    // 0 - МА, 1 - Все
    visit.fmtId = null;
    visit.timeBgn = null;
    visit.timeEnd = null;
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId + ", visitId=" + e.view.params.visitId);
    if (e.view.params.visitPlanItemId != "" && e.view.params.visitPlanItemId != "null") {
        visit.visitPlanItemId = e.view.params.visitPlanItemId;
    } else {
        visit.visitPlanItemId = null;
    }
    if (visit.isVisitIdReset == 1) {
        if (e.view.params.visitId != "" && e.view.params.visitId != "null") {
            visit.visitId = e.view.params.visitId;
        } else {
            visit.visitId = null;
        }
    }
    visit.isVisitIdReset = 0;
    renderVisit(visit.visitPlanItemId, visit.visitId);
}

function renderVisit(visitPlanItemId, visitId) {
    log("..renderVisit");
    dbTools.visitGet(visitPlanItemId, visitId, renderVisitView);
    dbTools.visitActivityGet(visitPlanItemId, visitId, renderVisitActivityList);
}

function renderVisitView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    if (data.length > 0) {
        visit.dateBgn = sqlDateToDate(data[0].dateBgn);
        visit.custId = data[0].custId;
        visit.timeBgn = sqlDateToDate(data[0].timeBgn);
        visit.timeEnd = sqlDateToDate(data[0].timeEnd);
        visit.fmtId = data[0].fmtId;
        $("#visit-point-name").text(data[0].name + ', ' + data[0].addr);
        visitTimeCaptionSet(visit.timeBgn, visit.timeEnd);
    }
    $("#visit-cat-name").text(settings.skuCatName);
    visitCheckReadOnly();
    visitEnableButtons();
}
 
function renderVisitActivityList(tx, rs) {
    log("..renderVisitActivityList");
    var data = dbTools.rsToJson(rs);
    $("#visit-activity-list").data("kendoMobileListView").dataSource.data(data);
    app.scroller().reset();
}

function visitCheckReadOnly() {
    var dt = new Date();
    dt.setHours(0, 0, 0, 0);
    visit.readonly = !(visit.timeBgn != null && visit.timeEnd == null) || visit.dateBgn.toString() != dt.toString();
}

function visitEnableButtons() {
    var dt = new Date();
    dt.setHours(0, 0, 0, 0);
    if (visit.visitId != null) {
        if (visit.timeEnd != null) {
            $("#visit-start-button").addClass("hidden");
            $("#visit-finish-button").addClass("hidden");
        } else {
            $("#visit-start-button").addClass("hidden");
            $("#visit-finish-button").removeClass("hidden");
        }
    } else {
        $("#visit-start-button").removeClass("hidden");
        $("#visit-finish-button").addClass("hidden");
    }
    if (visit.dateBgn.toString() != dt.toString()) {
        $("#visit-start-button").addClass("hidden");
        $("#visit-finish-button").addClass("hidden");
    }
}

function visitTimeCaptionSet(timeBgn, timeEnd) {
    log("..visitTimeCaptionSet(" + timeBgn + ", " + timeEnd + ")");
    var timeStr = "";
    if (timeBgn != undefined) {
        timeStr = dateToStr(timeBgn, "DD.MM.YYYY HH:NN");
        if (timeEnd != undefined) {
            timeStr += " - " + dateToStr(timeEnd, "HH:NN");
        }
    }
    $("#visit-time").text(timeStr);
}

function visitStartOnClick(e) {
    dbTools.visitAdd(visit.dateBgn, visit.custId,
        function(visitId, timeBgn) {
            visit.visitId = visitId;
            visit.timeBgn = timeBgn;
            visitTimeCaptionSet(visit.timeBgn, visit.timeEnd);
            visitCheckReadOnly();
            visitEnableButtons();
            dbTools.objectListItemSet("visit-list", true);
        }, 
        dbTools.onSqlError
    );
}

function visitFinishOnClick(e) {
    dbTools.visitEnd(visit.visitId,
        function(timeEnd) {
            visit.timeEnd = timeEnd;
            visitTimeCaptionSet(visit.timeBgn, visit.timeEnd);
            visitCheckReadOnly();
            visitEnableButtons();
            dbTools.objectListItemSet("visit-list", true);
        }, 
        dbTools.onSqlError
    );
}

function visitHrefGet(stageId, blk, activityId) {
    var result = "";
    if (blk > 0) {
        var href = hrefByActivityIdGet(stageId, activityId);
        if (href != "") {
            if (href.indexOf("?") >= 0) {
                href += "&navBackCount=";
            } else {
                href += "?navBackCount=";
            }
            if (settings.skuCatId > 0 || activityId == 14 || activityId == 4) {
                href += "1";
                result = href;
            } else {
                href += "2";
                result = "views/VisitProdCategory.html?navigateTo=" + hrefToViewParam(href) + "&isItemAllShow=0";
            }
        }
    }
    return result;
}

function hrefByActivityIdGet(stageId, activityId) {
    var result = "";
    switch (activityId) {
        case 1:
            result = "views/VisitProducts.html?stageId=" + stageId;
            break;
        case 4:
            result = "views/VisitShelfShare.html";
            break;
        case 14:
            result = "views/VisitAnalysisResult.html";
            break;
        default:
            result = "";
            break;
    }
    return result;
}
