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
    $("#visit-report-view .collapsible-list-view").each(function(i, e) {
        $(e).data("kendoMobileListView").destroy();
    });
    $("#visit-report-view .collapsible-list").each(function(i, e) {
        $(e).data("kendoMobileCollapsible").destroy();
        $(e).remove();
    });
    for (var i = 0; i < rs.rows.length; i++) {
        var content = '<div class="collapsible-list" data-blk-id="' + rs.rows.item(i).blkId + '">'
            + '    <h3 class="collapsible-header">' + rs.rows.item(i).name + '</h3>'
            + '    <ul data-list-blk-id="' + rs.rows.item(i).blkId + '" class="list list-item-header collapsible-list-view" data-template="visit-report-list-tmpl"></ul>'
            + '</div>';
        $("#visit-report-view").data("kendoMobileView").scrollerContent.append(content);
        $("[data-list-blk-id='" + rs.rows.item(i).blkId + "']").kendoMobileListView({template: $("#visit-report-list-tmpl").html(), click: visitReportListClick});
        renderVisitReportBlkContentView(rs.rows.item(i).blkId);
        $("[data-blk-id='" + rs.rows.item(i).blkId + "']").kendoMobileCollapsible();
    }
}

function renderVisitReportBlkContentView(blkId) {
    log("..renderVisitReportBlkContentView(" + blkId + ")");
    dbTools.visitReportBlkContentListGet(visit.visitId, blkId, function(tx, rs) {
        blockHeaderSet(blkId, rs);
        if (blkId !== 2) {
            renderListView(rs, "[data-list-blk-id='" + blkId + "']", false);
        } else {
            var renderSpecial = function(blkId, rs) {
                var data = [];
                for (var i = 0; i < rs.rows.length; i++) {
                    if (rs.rows.item(i).doneValue < rs.rows.item(i).ttlValue) {
                        data.push(rs.rows.item(i));
                    }
                }
                renderListView(data, "[data-list-blk-id='" + blkId + "']", false);
            }
            if (rs.rows.length <= 20) {
                renderSpecial(blkId, rs);
            } else {
                dbTools.visitReportBlkContentListGet(visit.visitId, 200, function(tx, rs) {
                    renderSpecial(blkId, rs);
                });
            }
        }
    });
}

function blockHeaderSet(blkId, rs) {
    log("..blockHeaderSet(" + blkId + ", rs)");
    var doneValue = 0,
        ttlValue= 0;
    for (var i = 0; i < rs.rows.length; i++) {
        ttlValue += rs.rows.item(i).ttlValue;
        doneValue += rs.rows.item(i).doneValue;
    }
    var caption = $("[data-blk-id='" + blkId + "'] h3").text();
    switch (blkId) {
        case 1:
            caption += " - есть " + doneValue + " из " + ttlValue;
            break;
        case 2:
            caption += " - " + (ttlValue !== 0 ? ((ttlValue - doneValue) / ttlValue * 100).toFixed() : 0) + "% (нет " + (ttlValue - doneValue) + " из " + ttlValue + ")";
            break;
        case 3:
            caption += " - выполнены " + doneValue + " из " + ttlValue;
            break;
        case 4:
            caption += " - соблюдена " + doneValue + " из " + ttlValue;
            break;
        case 5:
            caption += " - выполнено " + doneValue + " из " + ttlValue;
            break;
        case 6:
            caption += " - выполнено " + doneValue + " из " + ttlValue;
            break;
    }
    $("[data-blk-id='" + blkId + "'] h3").text(caption);
}

function visitReportNavBackClick(e) {
    log("..visitReportNavBackClick");
    navigateBack(visitReportList.navBackCount);
}

function visitReportListClick(e) {
    log("..visitReportListClick");
    if (e.dataItem.skuCatId > 0) {
        settings.skuCatId = e.dataItem.skuCatId;
        dbTools.visitProductCategoryGet(1, function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                if (rs.rows.item(i).skuCatId == settings.skuCatId) {
                    settings.skuCatName = rs.rows.item(i).name;
                    break;
                }
            }
            navigateTo(visitHrefGet(2, 1, e.dataItem.activityId, 7));
        });
    } else {
        navigateTo(visitHrefGet(2, 1, e.dataItem.activityId, 7));
    }
}

//----------------------------------------
// common
//----------------------------------------

function visitReportObjInit() {
    visitReportList = {};
    visitReportList.navBackCount = 1;
}

