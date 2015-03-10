var visitShelfShare;
var visitShelfShareItem;

function visitShelfShareInit(e) {
    log("..visitShelfShareInit");
    visitShelfShare = {};
    visitShelfShare.navigateBack = 1;
    visitShelfShare.rs = null;
}

function visitShelfShareShow(e) {
    log("..visitShelfShareShow navigateBack=" + e.view.params.navigateBack);
    visitShelfShare.navigateBack = e.view.params.navigateBack;
    if (visitShelfShare.navigateBack < 1) {
        visitShelfShare.navigateBack = 1;
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

