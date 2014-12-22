function visitProductsShow(e) {
    log("..visitProductsShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    renderVisitProducts(e.view.params.visitPlanItemId);
}

function renderVisitProducts(visitPlanItemId) {
    dbTools.visitProductsGet(visitPlanItemId, renderVisitProductsView);
}

function renderVisitProductsView(tx, rs) {
    log("..renderVisitProductsView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data, group: "brandGrpName"});
    log("..renderVisitProductsView render beg");
    $("#visit-products-list").data("kendoMobileListView").setDataSource(dataSource);
    $(".checkbox").iCheck({
      checkboxClass: "icheckbox_flat-green",
      radioClass: "iradio_flat-green",
      increaseArea: "20%" // optional
    });
    log("..renderVisitProductsView render end");
}

