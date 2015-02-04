dbTools.objectListItemSet("point-list", true, renderPointList);

var filterPanelVisible = true;

function pointListInit(e) {
    log("..pointListInit");
    /*$("#point-list").data("kendoMobileListView"
    )
    .kendoTouch({
        filter: ">li",
        tap: function(e) {log("....ListView tap");}
    });*/
    
    filterPanelInit();
}

function filterPanelInit() {
    /*var panel = $("#point-list-filter");
    var view = panel.closest("[data-role=view]");
    panel.css("margin-left", view.width());
    */
    var slide = kendo.fx($("#point-list-filter")).slideIn("right")

    $("#point-list-filter-button").click(function(e) {
        if (filterPanelVisible) {
            slide.reverse();
        } else {
            slide.play();
        }
        filterPanelVisible = !filterPanelVisible;
        e.preventDefault();
    });
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

function applyFilterOnClick(e) {
    $("#point-list-filter").data("kendoMobileDrawer").hide();
}

