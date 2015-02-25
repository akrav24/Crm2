var visit = {};
visit.visitPlanItemId = 0;
visit.timeBgn = "";

function visitInit(e) {
    log("..visitInit");
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    visit.visitPlanItemId = e.view.params.visitPlanItemId;
    renderVisit(visit.visitPlanItemId);
//log("======formatViewParamValue=" + formatViewParamValue("[!]a[~]b[^]c[~]d [|]:back"));
}

function renderVisit(visitPlanItemId) {
    log("..renderVisit");
    dbTools.visitGet(visitPlanItemId, renderVisitView);
    dbTools.visitActivityGet(visitPlanItemId, renderVisitActivityList);
}

function renderVisitView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    if (data.length > 0) {
        visit.timeBgn = data[0].timeBgn;
        $("#visit-point-name").text(data[0].name + ', ' + data[0].addr);
        $("#visit-time").text(dateToStr(visit.timeBgn, "DD.MM.YYYY HH:NN"));
    }
    $("#visit-cat-name").text(settings.skuCatName);
}

function renderVisitActivityList(tx, rs) {
    log("..renderVisitActivityList");
    var data = dbTools.rsToJson(rs);
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
                result = "views/VisitProdCategory.html?visitPlanItemId=" + visit.visitPlanItemId + "&navigateTo=" + hrefToViewParam(href) + "&isItemAllShow=0";
            }
        }
    }
//if (result !== "") {log("..visitHrefGet(" + blk + ", " + activityId + ") = '" + result + "'");}
    return result;
}

function hrefByActivityIdGet(activityId, visitPlanItemId) {
    var result = "";
    switch (activityId) {
        case 1:
            result = "views/VisitProducts.html";
            break;
    }
    return result;
}
