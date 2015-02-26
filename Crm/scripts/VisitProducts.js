var visitProducts;

function visitProductsInit(e) {
    visitProducts = {};
    visitProducts.navigateBack = 1;
}

function visitProductsShow(e) {
    log("..visitProductsShow navigateBack=" + e.view.params.navigateBack);
    visitProducts.navigateBack = e.view.params.navigateBack;
    if (visitProducts.navigateBack < 1) {
        visitProducts.navigateBack = 1;
    }
    renderVisitProducts(visit.visitPlanItemId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}

function renderVisitProducts(visitPlanItemId, skucatId, fmtFilterType, fmtId) {
    dbTools.visitProductsGet(visitPlanItemId, skucatId, fmtFilterType, fmtId, renderVisitProductsView);
}

function renderVisitProductsView(tx, rs) {
    log("..renderVisitProductsView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data/*, group: "brandGrpName"*/});
    log("..renderVisitProductsView render beg");
    $("#visit-products-list").data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
    $(".checkbox").iCheck({
      checkboxClass: "icheckbox_flat-green",
      radioClass: "iradio_flat-green",
      increaseArea: "100%" // optional
    });
    log("..renderVisitProductsView render end");
}

function visitProductsBackToVisit() {
    log("..visitProductsBackToVisit");
    app.navigate("#:back");
    app.navigate("#:back");
}

function visitProductsNavBackClick(e) {
    log("..visitProductsNavBackClick");
    navigateBack(visitProducts.navigateBack);
}

function visitProductsShowAll(e) {
    visit.fmtFilterType = e.index;
    renderVisitProducts(visit.visitPlanItemId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}
