function routeListItemShow(e) {
    log("..routeListItemShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    renderRouteListItem(e.view.params.visitPlanItemId);
    renderRouteListItemSkuList(e.view.params.visitPlanItemId);
}

function renderRouteListItem(visitPlanItemId) {
    dbTools.routeListDocGet(visitPlanItemId, renderRouteListItemView);
}

function renderRouteListItemSkuList(visitPlanItemId) {
    dbTools.routeListDocItemListGet(visitPlanItemId, renderRouteListItemSkuListView);
}

function renderRouteListItemView(tx, rs) {
    log("..renderRouteListItemView");
    var data = dbTools.rsToJson(rs);
    /*log("--data:" + data);
    for (var key in data[0]) {
        log("----" + key + "=" + data[0][key]);
    }*/
    $("#route-edit-datebgn").data("kendoDatePicker").value(sqlDateToKendoDate(data[0]["dateBgn"]));
}

function renderRouteListItemSkuListView(tx, rs) {
    log("..renderRouteListItemSkuListView");
    var data = dbTools.rsToJson(rs);
    log("..renderRouteListItemSkuListView 2");
    var dataSource = new kendo.data.DataSource({data: data, group: { field: "brandGrpName" }});
    log("..renderRouteListItemSkuListView 3");
    $("#route-edit-skulist").data("kendoMobileListView").setDataSource(dataSource);
    log("..renderRouteListItemSkuListView 4");
}

function routeEditSkulistOnClick(e) {
    log("..routeEditSkulistItemOnClick name=" + e.dataItem.name + ", qnt=" + e.dataItem.qnt);
    //e.item.toggleClass("list-item-selected");
    e.dataItem.qnt = 1;
}
