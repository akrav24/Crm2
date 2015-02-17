var visitPlanItemId;

function visitProdCatInit(e) {
    log("..visitInit");
    dbTools.objectListItemSet("visit-prod-cat", true);
}

function visitProdCatShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    visitPlanItemId = e.view.params.visitPlanItemId;
    renderVisitProdCat(visitPlanItemId);
}

function renderVisitProdCat(visitPlanItemId) {
    log("..renderVisitProdCat");
    if (dbTools.objectListItemGet("visit-prod-cat").needReloadData) {
        log("..renderVisitProdCat ReloadData");
        dbTools.visitProductCategoryGet(visitPlanItemId, renderVisitProdCatView);
        dbTools.objectListItemSet("visit-prod-cat", false);
    }
}

function renderVisitProdCatView(tx, rs) {
    log("..renderVisitProdCatView");
    var data = dbTools.rsToJson(rs);
    $("#prod-cat-list").data("kendoMobileListView").dataSource.data(data);
}
