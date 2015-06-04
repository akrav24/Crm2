var visitHistory;

function visitHistoryListInit(e) {
    log("..visitHistoryListInit");
    if (visit == undefined) {
        visitObjInit();
    }
    visitHistoryObjInit();
}

function visitHistoryListShow(e) {
    log("..visitHistoryListShow");
    renderVisitHistoryList();
}

function renderVisitHistoryList() {
    log("..renderVisitHistoryList");
    if (visitHistory.idsRestore) {
        visit.visitPlanItemId = visitHistory.visitPlanItemId0;
        visit.visitId = visitHistory.visitId0;
        visitHistory.idsRestore = false;
    }
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
    visitHistory.visitPlanItemId0 = visit.visitPlanItemId;
    visitHistory.visitId0 = visit.visitId;
    visitHistory.idsRestore = true;
    visitObjInit();
    if (visit.visitPlanItemId0 == null) {
        visit.visitPlanItemId0 = visit.visitPlanItemId;
        visit.visitId0 = visit.visitId;
    }
    visit.visitPlanItemId = e.dataItem.visitPlanItemId;
    visit.visitId = e.dataItem.visitId;
    app.navigate("views/Visit.html");
}

function visitHistoryListAddNewVisitClick() {
    visitHistory.visitPlanItemId0 = visit.visitPlanItemId;
    visitHistory.visitId0 = visit.visitId;
    visitHistory.idsRestore = true;
    visitObjInit();
    visit.custId = point.custId;
    visit.name = point.name;
    visit.addr = point.addr;
    visit.dateBgn = new Date();
    visit.dateBgn.setHours(0, 0, 0, 0);
    visit.fmtId = point.fmtId;
    app.navigate("views/Visit.html");
}

function visitHistoryObjInit() {
    visitHistory = {};
    visitHistory.visitPlanItemId0 = null;
    visitHistory.visitId0 = null;
    visitHistory.idsRestore = false;
}