var visitProductsNavigateBack = 1;

function visitProductsShow(e) {
    log("..visitProductsShow navigateBack=" + e.view.params.navigateBack);
    visitProductsNavigateBack = e.view.params.navigateBack;
    if (visitProductsNavigateBack < 1) {
        visitProductsNavigateBack = 1;
    }
    renderVisitProducts(settings.visitPlanItemId, settings.skuCatId);
}

function renderVisitProducts(visitPlanItemId, skucatId) {
    dbTools.visitProductsGet(visitPlanItemId, skucatId, renderVisitProductsView);
}

function renderVisitProductsView(tx, rs) {
    log("..renderVisitProductsView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data/*, group: "brandGrpName"*/});
    log("..renderVisitProductsView render beg");
    $("#visit-products-list").data("kendoMobileListView").setDataSource(dataSource);
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
    navigateBack(visitProductsNavigateBack);
}
