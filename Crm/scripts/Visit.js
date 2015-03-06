var visit;

function visitInit(e) {
    log("..visitInit");
    visit = {};
    visit.visitPlanItemId = null;
    visit.visitId = null;
    visit.fmtFilterType = 0;    // 0 - МА, 1 - Все
    visit.fmtId = null;
    visit.timeBgn = "";
    visit.timeEnd = "";
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId + ", visitId=" + e.view.params.visitId);
    visit.visitPlanItemId = e.view.params.visitPlanItemId;
    visit.visitId = e.view.params.visitId;
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
        visit.timeBgn = data[0].timeBgn;
        visit.fmtId = data[0].fmtId;
        $("#visit-point-name").text(data[0].name + ', ' + data[0].addr);
        $("#visit-time").text(dateToStr(visit.timeBgn, "DD.MM.YYYY HH:NN"));
    }
    $("#visit-cat-name").text(settings.skuCatName);
}

function renderVisitActivityList(tx, rs) {
    log("..renderVisitActivityList");
    var data = dbTools.rsToJson(rs);
log("....data=" + JSON.stringify(data));
    $("#visit-activity-list").data("kendoMobileListView").dataSource.data(data);
}

function visitStartOnClick(e) {
    $("#visit-start-button").addClass("hidden");
    $("#visit-finish-button").removeClass("hidden");
    visit.timeBgn = new Date();
    $("#visit-time").text(dateToStr(visit.timeBgn, "DD.MM.YYYY HH:NN"));
}
;
function visitFinishOnClick(e) {
    
}

function visitHrefGet(blk, activityId) {
    var result = "";
    if (blk > 0) {
        var href = hrefByActivityIdGet(activityId, visit.visitPlanItemId);
        if (href != "") {
            if (href.indexOf("?") >= 0) {
                href += "&navigateBack=";
            } else {
                href += "?navigateBack=";
            }
            if (settings.skuCatId > 0) {
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

function hrefByActivityIdGet(activityId, visitPlanItemId) {
    var result = "";
    switch (activityId) {
        case 1:
            result = "views/VisitProducts.html";
            break;
        default:
            result = "";
            break;
    }
    return result;
}
