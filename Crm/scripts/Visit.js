var visit;

function visitInit(e) {
    log("..visitInit");
    //visitObjInit();
}
 
function visitShow(e) {
    log("..visitShow");
    visitProductsObjInit();
    visitPromoObjInit();
    visitOurPromoObjInit();
    renderVisit(visit.visitPlanItemId, visit.visitId);
}

function renderVisit(visitPlanItemId, visitId) {
    log("..renderVisit(" + visitPlanItemId + ", " + visitId + ")");
    dbTools.visitGet(visitPlanItemId, visitId, 
        function(tx, rs) {
            renderVisitView(tx, rs);
            dbTools.visitActivityGet(visitPlanItemId, visitId, settings.skuCatId, visit.custId, visit.dateBgn, -1, -1, visit.activityShowAll, renderVisitActivityList);
        }
    );
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
    $("#visit-activity-show-all-button").text(visit.activityShowAll === 1 ? "Скрыть" : "Показать все");
    visitCheckReadOnly();
    visitEnableButtons();
}
 
function renderVisitActivityList(tx, rs) {
    log("..renderVisitActivityList");
    var data = dbTools.rsToJson(rs);
    visit.activityLst = data;
    $("#visit-activity-list").data("kendoMobileListView").dataSource.data(data);
    if (visit.resetScroller) {
        app.scroller().reset();
        visit.resetScroller = false;
    }
}

function visitHeaderClick(e) {
    log("..visitHeaderClick");
    if (e.item.attr("id") == "visit-point-name-item") {
        pointObjInit();
        point.custId = visit.custId;
        navigateTo("views/Point.html");
    }
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
    visit.activityShowAll = 0;
    visit.activityLst = [];
    visit.resetScroller = true;
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
                dialogHelper.confirm(/*"#visit-dialog", */false, "Вы действительно намерены начать визит запланированный на другой день?",
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
            dialogHelper.warning(/*"#visit-dialog", */false, "Сначала закончите визит от " + dateToStr(dateBgn, "DD/MM/YYYY"));
        }
    });
}

function visitFinishOnClick(e) {
    dialogHelper.confirm(false, "Вы хотите закончить визит?", 
        function() {
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
    );
}

function visitActivityShowAllClick(e) {
    visit.activityShowAll = 1 - visit.activityShowAll;
    visit.resetScroller = true;
    renderVisit(visit.visitPlanItemId, visit.visitId, visit.custId, visit.dateBgn, visit.activityShowAll);
    $("#visit-activity-show-all-button").text(visit.activityShowAll === 1 ? "Скрыть" : "Показать все");
}

function visitHrefGet(stageId, blk, activityId, mode) {
    var result = "";
    if (blk > 0) {
        var href = hrefByActivityIdGet(stageId, activityId);
        if (href != "") {
            /*if (href.indexOf("?") >= 0) {
                href += "&navBackCount=";
            } else {
                href += "?navBackCount=";
            }*/
            href += (href.indexOf("?") >= 0 ? "&" : "?") + "mode=" + mode;
            href += "&navBackCount=";
            if (settings.skuCatId > 0 || bizlg.cmn.inArray([5, 11, 12, 14, 15], activityId)) {
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
        case 2:
            result = "views/VisitPlanogram.html?stageId=" + stageId;
            break;
        case 3:
            result = "views/VisitPhoto.html?stageId=" + stageId;
            break;
        case 4:
            result = "views/VisitShelfShare.html";
            break;
        case 5:
            result = "views/VisitTask.html";
            break;
        case 6:
            result = "views/VisitPromo.html";
            break;
        case 8:
            result = "views/VisitSkuPrice.html";
            break;
        case 11:
            result = "views/VisitSurveyAnswer.html?surveyId=2";
            break;
        case 12:
            result = "views/VisitSurveyAnswer.html?surveyId=1";
            break;
        case 14:
            result = "views/VisitAnalysisResult.html";
            break;
        case 15:
            result = "views/VisitReport.html";
            break;
        case 16:
            result = "views/VisitOurPromo.html";
            break;
        default:
            result = "";
            break;
    }
    //log("....hrefByActivityIdGet='" + result + "'");
    return result;
}
