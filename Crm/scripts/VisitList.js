var prdBgn = new Date();
// TODO: DEL
var prdBgn = new Date(2014, 0, 2);
prdBgn.setHours(0,0,0,0);
dbTools.objectListItemSet("visit-list", true, renderVisitList);

function visitListInit(e) {
    log("..visitListInit");
    $("#visit-prdbgn").data("kendoDatePicker").value(prdBgn);
    /*$(".checkbox").iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green',
        increaseArea: '20%' // optional
    });*/
}

function visitListShow(e) {
    log("..visitListShow");
    renderVisitList();
    /* // select item
    var listView = $("#visit-list").data("kendoMobileListView");
    listView.selectable = true;
    listView.select(listView.element.children().first());*/
}

function renderVisitList() {
    if (dbTools.objectListItemGet("visit-list").needReloadData) {
        dbTools.visitListGet(prdBgn, renderVisitListView);
        dbTools.objectListItemSet("visit-list", false);
    }
}

function renderVisitListView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    $("#visit-list").data("kendoMobileListView").dataSource.data(data);
}

function visitListOnClick(e) {
    log("..visitListOnClick visitPlanItemId=" + e.dataItem.visitPlanItemId);
    //e.item.parent("ul").find("li").removeClass("list-item-selected");
    //e.item.addClass("list-item-selected");
    //kendo.mobile.application.navigate("views/VisitListEdit.html?visitPlanItemId=" + e.dataItem.visitPlanItemId);
}

function visitPrdBgnOnChange(e) {
    log("..visitPrdBgnOnChange");
    prdBgn = e.sender.value();
    dbTools.visitListGet(prdBgn, renderVisitListView);
}

