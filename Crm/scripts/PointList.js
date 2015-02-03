dbTools.objectListItemSet("point-list", true, renderPointList);

function pointListInit(e) {
    log("..pointListInit");
    /*$("#point-list").data("kendoMobileListView"
    )
    .kendoTouch({
        filter: ">li",
        tap: function(e) {log("....ListView tap");}
    });*/
}

function pointListShow(e) {
    log("..pointListShow");
    renderPointList();
}

function renderPointList() {
    if (dbTools.objectListItemGet("point-list").needReloadData) {
        dbTools.pointListGet(renderPointListView);
        dbTools.objectListItemSet("point-list", false);
    }
}

function renderPointListView(tx, rs) {
    log("..renderPointView");
    data = dbTools.rsToJson(rs);
    $("#point-list").data("kendoMobileListView").dataSource.data(data);
}

/*function filter2OnClick(e) {
    var modalView = e.sender.element.closest("[data-role=modalview]").data("kendoMobileModalView");
    modalView.close();
}
*/
function applyFilterOnClick(e) {
    $("#point-list-filter").data("kendoMobileDrawer").hide();
}
