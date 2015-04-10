var visitCategory;

function visitProdCatInit(e) {
    log("..visitProdCatInit");
    visitCategory = {};
    visitCategory.navigateTo = "#:back";
    visitCategory.isItemAllShow = 1;
    dbTools.objectListItemSet("visit-prod-cat", true);
}

function visitProdCatShow(e) {
    log("..visitProdCatShow navigateTo=" + viewParamToHref(e.view.params.navigateTo) + ", isItemAllShow=" + e.view.params.isItemAllShow);
    visitCategory.navigateTo = viewParamToHref(e.view.params.navigateTo);
    if (e.view.params.isItemAllShow != undefined) {
        visitCategory.isItemAllShow = e.view.params.isItemAllShow;
    } else {
        visitCategory.isItemAllShow = 1;
    }
    renderVisitProdCat(visitCategory.isItemAllShow);
}

function renderVisitProdCat(isItemAllShow) {
    log("..renderVisitProdCat(" + isItemAllShow + ")");
    dbTools.visitProductCategoryMatrixGet(visit.visitId, isItemAllShow, renderVisitProdCatView);
}

function renderVisitProdCatView(tx, rs) {
    log("..renderVisitProdCatView");
    var data = dbTools.rsToJson(rs);
log("====visit.activityLst=" + kendo.stringify(visit.activityLst));
log("====data=" + kendo.stringify(data));
    $("#prod-cat-list").data("kendoMobileListView").dataSource.data(data);
}

function prodCatListClick(e) {
    settings.skuCatId = e.dataItem.skuCatId;
    settings.skuCatName = e.dataItem.name;
}
