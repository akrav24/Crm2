var visitPlanItemId;

function visitInit(e) {
    log("..visitInit");
    dbTools.objectListItemSet("visit", true);
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    visitPlanItemId = e.view.params.visitPlanItemId;
    renderVisit(visitPlanItemId);
}

function renderVisit(visitPlanItemId) {
    log("..renderVisit");
    if (dbTools.objectListItemGet("visit").needReloadData) {
        log("..renderVisit ReloadData");
        dbTools.visitProductCategoryGet(visitPlanItemId, renderVisitView);
        dbTools.objectListItemSet("visit", false);
    }
}

function renderVisitView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    $("#prod-cat-list").data("kendoMobileListView").dataSource.data(data);
}
