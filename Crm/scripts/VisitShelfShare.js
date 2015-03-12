var visitShelfShare;
var visitShelfShareItem;

function visitShelfShareInit(e) {
    log("..visitShelfShareInit");
    visitShelfShare = {};
    visitShelfShare.navBackCount = 1;
    visitShelfShare.rs = null;
}

function visitShelfShareShow(e) {
    log("..visitShelfShareShow navBackCount=" + e.view.params.navBackCount);
    visitShelfShare.navBackCount = e.view.params.navBackCount;
    if (visitShelfShare.navBackCount < 1) {
        visitShelfShare.navBackCount = 1;
    }
    renderVisitShelfShare(visit.visitId);
}

function renderVisitShelfShare(visitId) {
    dbTools.visitShelfShareGet(visitId, renderVisitShelfShareView);
}

function renderVisitShelfShareView(tx, rs) {
    log("..renderVisitShelfShareView");
    visitShelfShare.rs = rs;
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-shelf-share-list").data("kendoMobileListView").setDataSource(dataSource);
   app.scroller().reset();
}

