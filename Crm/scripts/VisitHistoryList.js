function visitHistoryListInit(e) {
    log("..visitHistoryListInit");
}

function visitHistoryListShow(e) {
    log("..visitHistoryListShow");
    renderVisitHistoryList();
}

function renderVisitHistoryList() {
    log("..renderVisitHistoryList");
    var prdBgn = new Date(2001, 0, 1);
    var prdEnd = new Date(2031, 0, 1);
    dbTools.visitListGet(prdBgn, prdEnd, point.custId, 1, 2, renderVisitHistoryListView);
}

function renderVisitHistoryListView(tx, rs) {
    log("..renderVisitHistoryListView");
    var data = dbTools.rsToJson(rs);
    $("#visit-history-list").data("kendoMobileListView").dataSource.data(data);
    if (data.length > 0) {
        $("#visit-history-not-exists-list").addClass("hidden");
    } else {
        $("#visit-history-not-exists-list").removeClass("hidden");
    }
}

function visitHistoryListClick(e) {
    visitObjInit();
    visit.visitPlanItemId = e.dataItem.visitPlanItemId;
    visit.visitId = e.dataItem.visitId;
    app.navigate("views/Visit.html");
}

function visitHistoryListAddNewVisitClick() {
    visitObjInit();
    visit.custId = point.custId;
    visit.name = point.name;
    visit.addr = point.addr;
    visit.dateBgn = new Date();
    visit.dateBgn.setHours(0, 0, 0, 0);
    visit.fmtId = point.fmtId;
    app.navigate("views/Visit.html");
}
