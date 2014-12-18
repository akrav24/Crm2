var prdBgn = new Date();
// TODO: DEL
var prdBgn = new Date(2014, 0, 2);
prdBgn.setHours(0,0,0,0);
dbTools.objectListItemSet("route-list", true, renderRouteList);

//-- Route List --------------------------------------------------

function routeListInit(e) {
    log("..routeListInit");
    $("#route-prdbgn").data("kendoDatePicker").value(prdBgn);
}

function routeListShow(e) {
    log("..routeListShow");
    renderRouteList();
    /* // select item
    var listView = $("#route-list").data("kendoMobileListView");
    listView.selectable = true;
    listView.select(listView.element.children().first());*/
}

function renderRouteList() {
    if (dbTools.objectListItemGet("route-list").needReloadData) {
        dbTools.routeListGet(prdBgn, renderRouteListView);
        dbTools.objectListItemSet("route-list", false);
    }
}

function renderRouteListView(tx, rs) {
    log("..renderRouteView");
    var data = dbTools.rsToJson(rs);
    $("#route-list").data("kendoMobileListView").dataSource.data(data);
}

function routeListOnClick(e) {
    log("..routeListOnClick visitPlanItemId=" + e.dataItem.visitPlanItemId);
    //e.item.toggleClass("list-item-selected");
    kendo.mobile.application.navigate("#route-view-edit?visitPlanItemId=" + e.dataItem.visitPlanItemId);
}

function routePrdBgnOnChange(e) {
    log("..routePrdBgnOnChange");
    prdBgn = e.sender.value();
    dbTools.routeListGet(prdBgn, renderRouteListView);
}

//-- Route List Item ---------------------------------------------

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
    var dataSource = new kendo.data.DataSource({data: data, group: { field: "brandGrpName" }});
    $("#route-edit-skulist").data("kendoMobileListView").setDataSource(dataSource);
}


//-- TODO: DEl Test -----------------------------------------------

function testOnClick() {
    alert($("#route-prdbgn").data("kendoDatePicker").value());
    var o = $("#route-prdbgn");
    alert("o:" + o.toString());
    var keys = "";
    for (var key in o) {
        keys += key + ";";
        //log("...." + key + "=" + o[key]);
    }
    alert("o.keys:" + keys);
    log("------------------------------------------------------------");
    var d = o.data("kendoDatePicker");
    alert("d:" + d);
    var keys = "";
    for (var key in d) {
        keys += key + ";";
        log("...." + key + "=" + d[key]);
    }
    alert("d.keys:" + keys);
    alert("d.v:" + d.value());
}
