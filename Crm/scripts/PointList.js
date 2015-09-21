/*var filterPanelVisible = true;
*/
function pointListInit(e) {
    log("..pointListInit");
    dbTools.objectListItemSet("point-list", true/*, renderPointList*/);
    /*$("#point-list").data("kendoMobileListView"
    )
    .kendoTouch({
        filter: ">li",
        tap: function(e) {log("....ListView tap");}
    });*/
    
    /*filterPanelInit();
    */
}

function pointListShow(e) {
    log("..pointListShow");
    renderPointList();
}

function renderPointList() {
    log("..renderPointList");
    if (dbTools.objectListItemGet("point-list").needReloadData) {
        log("....renderPointList ReloadData");
        dbTools.pointListGet(renderPointListView);
        dbTools.objectListItemSet("point-list", false);
    }
}

function renderPointListView(tx, rs) {
    log("..renderPointView");
    dbTools.pointLst = rs;
    var data = dbTools.rsToJson(rs);
    $("#point-list").data("kendoMobileListView").dataSource.data(data);
}

function pointListClick(e) {
    //href="views/Point.html?custId=#:custId#"
    pointObjInit();
    point.custId = e.dataItem.custId;
    app.navigate("views/Point.html");
}

function pointListOnApplyFilter(filterPoints) {
    dbTools.objectListItemGet("point-list").needReloadData = true;
    renderPointList();
}

function pointListFilterShow(e) {
    log("..pointListFilterShow");
    filterPointsOnApply = pointListOnApplyFilter;
    app.navigate("views/PointFilter.html");
}

/*function filterPanelInit() {
    //var panel = $("#point-list-filter");
    //var view = panel.closest("[data-role=view]");
    //panel.css("margin-left", view.width());
    
    var panel = $("#point-list-filter");
    var slide = kendo.fx(panel).slideIn("right");
    
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
*/
/*function applyFilterOnClick(e) {
    $("#point-list-filter").data("kendoMobileDrawer").hide();
}
*/
