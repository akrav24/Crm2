function visitListItemShow(e) {
    log("..visitListItemShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    renderVisitListItem(e.view.params.visitPlanItemId);
    renderVisitListItemSkuList(e.view.params.visitPlanItemId);
}

function renderVisitListItem(visitPlanItemId) {
    dbTools.visitGet(visitPlanItemId, renderVisitListItemView);
}

function renderVisitListItemSkuList(visitPlanItemId) {
    dbTools.visitProductsGet(visitPlanItemId, renderVisitListItemSkuListView);
}

function renderVisitListItemView(tx, rs) {
    log("..renderVisitListItemView");
    var data = dbTools.rsToJson(rs);
    //$("#visit-edit-datebgn").data("kendoDatePicker").value(sqlDateToDate(data[0]["dateBgn"]));
}

function renderVisitListItemSkuListView(tx, rs) {
    log("..renderVisitListItemSkuListView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data, group: "brandGrpName"});
    log("..renderVisitListItemSkuListView render beg");
    $("#visit-edit-skulist").data("kendoMobileListView").setDataSource(dataSource);
    $(".checkbox").iCheck({
      checkboxClass: "icheckbox_flat-green",
      radioClass: "iradio_flat-green",
      increaseArea: "20%" // optional
    });
    log("..renderVisitListItemSkuListView render end");
}

