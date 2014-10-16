dbTools.objectListItemSet("point-list", true/*, renderPointList*/);

function pointListShow(e) {
    renderPointList();
}

function renderPointList() {
    if (dbTools.objectListItemGet("point-list").needReloadData) {
        dbTools.pointListGet(renderPointListView);
        dbTools.objectListItemSet("point-list", false);
    }
}

function renderPointListView(tx, rs) {
    log("...renderView");
    data = dbTools.rsToJson(rs);
    $("#point-list").data("kendoMobileListView").dataSource.data(data);
}

