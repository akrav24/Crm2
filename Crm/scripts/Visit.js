var visit;

function visitInit(e) {
    log("..visitInit");
    //visitObjInit();
}
 
function visitShow(e) {
    log("..visitShow");
    renderVisit(visit.visitPlanItemId, visit.visitId, visit.custId);
}

function renderVisit(visitPlanItemId, visitId, custId) {
    log("..renderVisit(" + visitPlanItemId + ", " + visitId + ", " + custId + ")");
    dbTools.visitGet(visitPlanItemId, visitId, renderVisitView);
    dbTools.visitActivityGet(visitPlanItemId, visitId, settings.skuCatId, custId, -1, -1, renderVisitActivityList);
}

function renderVisitView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    if (data.length > 0) {
        visit.dateBgn = sqlDateToDate(data[0].dateBgn);
        visit.custId = data[0].custId;
        visit.name = data[0].name;
        visit.addr = data[0].addr;
        visit.timeBgn = sqlDateToDate(data[0].timeBgn);
        visit.timeEnd = sqlDateToDate(data[0].timeEnd);
        visit.fmtId = data[0].fmtId;
    }
    $("#visit-point-name").text(visit.name + ', ' + visit.addr);
    visitTimeCaptionSet(visit.timeBgn, visit.timeEnd);
    $("#visit-cat-name").text(settings.skuCatName);
    visitCheckReadOnly();
    visitEnableButtons();
}
 
function renderVisitActivityList(tx, rs) {
    log("..renderVisitActivityList");
    var data = dbTools.rsToJson(rs);
    visit.activityLst = data;
    $("#visit-activity-list").data("kendoMobileListView").dataSource.data(data);
    app.scroller().reset();
}

function visitObjInit() {
    visit = {};
    visit.visitPlanItemId = null;
    visit.visitId = null;
    visit.readonly = false;
    visit.dateBgn = null;
    visit.custId = null;
    visit.name = "";
    visit.addr = "";
    visit.fmtFilterType = 0;    // 0 - МА, 1 - Все
    visit.fmtId = null;
    visit.timeBgn = null;
    visit.timeEnd = null;
    visit.activityLst = [];
}

function visitCheckReadOnly() {
    var dt = new Date();
    dt.setHours(0, 0, 0, 0);
    visit.readonly = !(visit.timeBgn != null && visit.timeEnd == null);
}

function visitEnableButtons() {
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
}

function visitTimeCaptionSet(timeBgn, timeEnd) {
    log("..visitTimeCaptionSet(" + timeBgn + ", " + timeEnd + ")");
    $("#visit-time").text(periodToStr(timeBgn, timeEnd));
}
 
function visitStartOnClick(e) {
    dbTools.visitAddCheck(function(isAdd, dateBgn) {
        if (isAdd) {
            var dt = new Date();
            dt.setHours(0, 0, 0, 0);
            if (visit.dateBgn.toString() == dt.toString()) {
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
            } else {
                dialogHelper.confirm("#visit-dialog", false, "Вы действительно намерены начать визит запланированный на другой день?",
                    function() {
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
                );
            }
        } else {
            dialogHelper.warning("#visit-dialog", false, "Сначала закончите визит от " + dateToStr(dateBgn, "DD/MM/YYYY"));
        }
    });
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
            if (settings.skuCatId > 0 || inArray([11, 12, 14], activityId)) {
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
    //log("..hrefByActivityIdGet(" + stageId + ", " + activityId + ")");
    var result = "";
    switch (activityId) {
        case 1:
            result = "views/VisitProducts.html?stageId=" + stageId;
            break;
        /*case 2:
            result = "views/VisitPlanogramList.html";
            break;*/
        case 4:
            result = "views/VisitShelfShare.html";
            break;
        case 5:
            result = "views/VisitTask.html";
            break;
        case 6:
            result = "views/VisitPromo.html";
            break;
        case 11:
            result = "views/VisitSurveyAnswer.html?surveyId=2";
            break;
        case 12:
            result = "views/VisitSurveyAnswer.html?surveyId=1";
            break;
        /*case 13:
            result = "views/VisitPlanogramList.html";
            break;*/
        case 14:
            result = "views/VisitAnalysisResult.html";
            break;
        default:
            result = "";
            break;
    }
    //log("....hrefByActivityIdGet='" + result + "'");
    return result;
}

