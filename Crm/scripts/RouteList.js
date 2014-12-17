var prdBgn = new Date();
var prdBgn = new Date(2014, 1, 2);
prdBgn.setHours(0,0,0,0);
dbTools.objectListItemSet("route-list", true, renderRouteList);

//-- Route List --------------------------------------------------

function routeListInit(e) {
    log("..routeListInit");
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
    data = dbTools.rsToJson(rs);
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
    //renderRouteList();
}


function testOnClick() {
    var o = $("test");
    alert("test:" + o.toString());
    keys = "";
    for (var key in o) {
        keys += key + ";";
        log("...." + key + "=" + o[key]);
    }
    alert("keys:" + keys);
}
