var visitReportList;

//----------------------------------------
// visit-report-view
//----------------------------------------

function visitReportInit(e) {
    log("..visitReportInit");
    visitReportObjInit();
}

function visitReportShow(e) {
    log("..visitReportShow navBackCount=" + e.view.params.navBackCount);
    visitReportList.navBackCount = e.view.params.navBackCount;
    if (visitReportList.navBackCount < 1) {
        visitReportList.navBackCount = 1;
    }
    dbTools.visitReportBlkListGet(visit.visitId, renderVisitReportView);
}

function renderVisitReportView(tx, rs) {
    log("..renderVisitReportView(tx, rs)");
    //renderListView(rs, "#visit-report-list");
    $("#visit-report-view .collapsible-list").each(function(i, e) {
        $(e).data("kendoMobileCollapsible").destroy();
        $(e).remove();
    });
    for (i = 0; i < rs.rows.length; i++) {
        var content = '<div data-blk-id="' + rs.rows.item(i).blkId + '" class="collapsible-list">'
            + '    <h3>' + rs.rows.item(i).name + '</h3>'
            + '    <ul data-list-blk-id="' + rs.rows.item(i).blkId + '" class="list list-item-header" data-role="listview" data-template="visit-report-list-tmpl"></ul>'
            + '</div>';
        $("#visit-report-view").data("kendoMobileView").scrollerContent.append(content);
        $("[data-blk-id='" + rs.rows.item(i).blkId + "']").kendoMobileCollapsible();
    }
}

function visitReportNavBackClick(e) {
    log("..visitReportNavBackClick");
    navigateBack(visitReportList.navBackCount);
}

function visitReportListClick(e) {
    log("..visitReportListClick");
    //copyObjValues(e.dataItem, visitPromoItem);
    //navigateTo("#visit-promo-edit-view");
}

//----------------------------------------
// common
//----------------------------------------

function visitReportObjInit() {
    visitReportList = {};
    visitReportList.navBackCount = 1;
}

