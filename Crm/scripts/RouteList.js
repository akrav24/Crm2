dbTools.objectListItemSet("route-list", true, renderRouteList);

function routeListInit(e) {
    log("..routeListInit");
}

function routeListShow(e) {
    log("..routeListShow");
    renderRouteList();
}

function renderRouteList() {
    var prdBgn = new Date(2014, 1, 2);
    if (dbTools.objectListItemGet("route-list").needReloadData) {
        dbTools.routeListGet(prdBgn, renderRouteListView);
        dbTools.objectListItemSet("route-list", false);
    }
}

function renderRouteListView(tx, rs) {
    log("..renderRouteView");
    data = dbTools.rsToJson(rs);
log("....data: '" + data.toString() + "'");
    $("#route-list").data("kendoMobileListView").dataSource.data(data);
}

