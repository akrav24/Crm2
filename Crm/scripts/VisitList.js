var prdBgn = new Date();
prdBgn.setHours(0,0,0,0);
var prdBgnOpened = false;

function visitListInit(e) {
    log("..visitListInit");
    dbTools.objectListItemSet("visit-list", true/*, renderVisitList*/);
    $("#visit-prdbgn").data("kendoDatePicker").value(prdBgn);
    /*$(".checkbox").iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green',
        increaseArea: '20%' // optional
    });*/
    $("[data-role = datepicker]").prop("readonly", "true");
}

function visitListShow(e) {
    log("..visitListShow");
    settings.skuCatId = -1;
    settings.skuCatName = "Все";
    prdBgnOpened = false;
    renderVisitList();
    /* // select item
    var listView = $("#visit-list").data("kendoMobileListView");
    listView.selectable = true;
    listView.select(listView.element.children().first());
    */
}

function renderVisitList() {
    log("..renderVisitList");
    if (dbTools.objectListItemGet("visit-list").needReloadData) {
        log("..renderVisitList ReloadData");
        dbTools.visitListGet(prdBgn, prdBgn, -1, -1, 1, renderVisitListView);
        dbTools.objectListItemSet("visit-list", false);
    }
}

function renderVisitListView(tx, rs) {
    log("..renderVisitView");
    var data = dbTools.rsToJson(rs);
    $("#visit-list").data("kendoMobileListView").dataSource.data(data);
    //$("#visit-list-view").data("kendoMobileView").stretch = (data.length === 0);
    if (data.length > 0) {
        $("#visit-not-exists-list").addClass("hidden");
    } else {
        $("#visit-not-exists-list").removeClass("hidden");
    }
}

function visitListPrdBgnOnChange(e) {
    log("..visitPrdBgnOnChange");
    prdBgn = e.sender.value();
    dbTools.visitListGet(prdBgn, prdBgn, -1, -1, 1, renderVisitListView);
}

function visitListPrdBgnOnClick(e) {
    log("..visitListPrdBgnOnClick");
    if (prdBgnOpened) {
        $("#visit-prdbgn").data("kendoDatePicker").close();
    } else {
        $("#visit-prdbgn").data("kendoDatePicker").open();
    }
    prdBgnOpened = !prdBgnOpened;
}

function visitListPrdPrev(e) {
    prdBgn.setDate(prdBgn.getDate() - 1);
    visitListPrdChangeDate(prdBgn);
}

function visitListPrdNext(e) {
    prdBgn.setDate(prdBgn.getDate() + 1);
    visitListPrdChangeDate(prdBgn);
}

function visitListPrdChangeDate(prdBgn) {
    $("#visit-prdbgn").data("kendoDatePicker").value(prdBgn);
    dbTools.visitListGet(prdBgn, prdBgn, -1, -1, 1, renderVisitListView);
}

function visitListSwipe(e) {
    log("..visitListSwipe=" + e.direction);
    if (e.direction == "right") {
        prdBgn.setDate(prdBgn.getDate() - 1);
    } else {
        prdBgn.setDate(prdBgn.getDate() + 1);
    }
    visitListPrdChangeDate(prdBgn);
}

function visitListClick(e) {
    //href="views/Visit.html?visitPlanItemId=#:visitPlanItemId#&visitId=#:visitId#"
    visitObjInit();
    visit.visitPlanItemId = e.dataItem.visitPlanItemId;
    visit.visitId = e.dataItem.visitId;
    app.navigate("views/Visit.html");
}
