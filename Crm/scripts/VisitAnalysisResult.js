var visitAnalysisResults;
var visitAnalysisResult;

//----------------------------------------
// visit-analysis-results-view
//----------------------------------------

function visitAnalysisResultsInit(e) {
    log("..visitAnalysisResultsInit");
    visitAnalysisResults = {};
    visitAnalysisResults.navBackCount = 1;
    visitAnalysisResults.rs = null;
    visitAnalysisResult = {};
    visitAnalysisResultClear(true);
}

function visitAnalysisResultsShow(e) {
    log("..visitAnalysisResultsShow navBackCount=" + e.view.params.navBackCount);
    visitAnalysisResults.navBackCount = e.view.params.navBackCount;
    if (visitAnalysisResults.navBackCount < 1) {
        visitAnalysisResults.navBackCount = 1;
    }
    renderVisitAnalysisResults(visit.visitId);
}

function renderVisitAnalysisResults(visitId) {
    dbTools.visitAnalysisResultsGet(visitId, renderVisitAnalysisResultsView);
}

function renderVisitAnalysisResultsView(tx, rs) {
    log("..renderVisitAnalysisResultsView");
    visitAnalysisResults.rs = rs;
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-analysis-results-list").data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
}

function visitAnalysisResultsNavBackClick(e) {
    log("..visitAnalysisResultsNavBackClick");
    navigateBack(visitAnalysisResults.navBackCount);
}

//----------------------------------------
// visit-analysis-result-edit-view
//----------------------------------------

function visitAnalysisResultEditInit(e) {
    log("..visitAnalysisResultEditInit");
    $("#visit-analysis-result-edit-reason").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "reasonId",
        height: 800,
        change: visitAnalysisResultEditReasonChange
    });
    $("#visit-analysis-result-edit-reason2").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "reasonId",
        height: 800,
        change: visitAnalysisResultEditReason2Change
    });
}

function visitAnalysisResultEditShow(e) {
    log("..visitAnalysisResultEditShow skuId=" + e.view.params.skuId + ", isNotReloadReason=" + e.view.params.isNotReloadReason
        + ", reasonId=" + e.view.params.reasonId + ", reasonId2=" + e.view.params.reasonId2
        + ", useQnt=" + e.view.params.useQnt + ", useDate=" + e.view.params.useDate+ ", navBackCount=" + e.view.params.navBackCount
    );
    visitAnalysisResult.isNotReloadReason = false;
    visitAnalysisResult.isNotReloadReason = e.view.params.isNotReloadReason > 0;
    if (!visitAnalysisResult.isNotReloadReason) {
        visitAnalysisResultClear(true);
    }
    visitAnalysisResult.skuId = e.view.params.skuId;
    if (e.view.params.navBackCount != undefined) {
        visitAnalysisResult.navBackCount = e.view.params.navBackCount;
    }
    if (visitAnalysisResults.navBackCount < 1) {
        visitAnalysisResults.navBackCount = 1;
    }
    if (e.view.params.reasonId != undefined) {
        visitAnalysisResult.reasonId = e.view.params.reasonId;
    }
    if (e.view.params.reasonId2 != undefined) {
        visitAnalysisResult.reasonId2 = e.view.params.reasonId2;
    }
    if (e.view.params.useQnt != undefined) {
        visitAnalysisResult.useQnt = e.view.params.useQnt;
    }
    if (e.view.params.useDate != undefined) {
        visitAnalysisResult.useDate = e.view.params.useDate;
    }
    renderVisitAnalysisResultEdit(visit.visitId, visitAnalysisResult.skuId);
}

function renderVisitAnalysisResultEdit(visitId, skuId) {
    log("..renderVisitAnalysisResultEdit(" + visitId + ", " + skuId + ")");
    dbTools.visitAnalysisResultGet(visitId, skuId, renderVisitAnalysisResultEditView);
}

function renderVisitAnalysisResultEditView(tx, rs) {
    log("..renderVisitAnalysisResultEditView");
    if (rs.rows.length > 0) {
        visitAnalysisResult.name = rs.rows.item(0).name;
        visitAnalysisResult.code = rs.rows.item(0).code;
        visitAnalysisResult.fullName = rs.rows.item(0).fullName;
        if (!visitAnalysisResult.isNotReloadReason) {
            visitAnalysisResult.reasonId = rs.rows.item(0).reasonId;
            visitAnalysisResult.reasonId2 = rs.rows.item(0).reasonId2;
            visitAnalysisResult.useQnt = rs.rows.item(0).useQnt;
            visitAnalysisResult.reasonQnt = rs.rows.item(0).reasonQnt;
            visitAnalysisResult.useDate = rs.rows.item(0).useDate;
            visitAnalysisResult.reasonDate = sqlDateToDate(rs.rows.item(0).reasonDate);
        }
    } else {
        visitAnalysisResultClear(false);
    }
//logObjectKeys(visitAnalysisResult);
    visitAnalysisResultEditFillControls();
}
 
function visitAnalysisResultEditFillControls() {
    $("#visit-analysis-result-edit-full-name").val(visitAnalysisResult.fullName);
    dbTools.visitReasonListGet(-1, 1, function(tx, rs) {
        renderVisitAnalysisResultEditReason(tx, rs, visitAnalysisResult.reasonId);
    });
    dbTools.visitReasonListGet(visitAnalysisResult.reasonId, 1, function(tx, rs) {
        renderVisitAnalysisResultEditReason2(tx, rs, visitAnalysisResult.reasonId2);
    });
    $("#visit-analysis-result-edit-reason-qnt").val(visitAnalysisResult.reasonQnt);
    $("#visit-analysis-result-edit-reason-date").val(dateToInputDate(visitAnalysisResult.reasonDate));
}

function renderVisitAnalysisResultEditReason(tx, rs, value) {
    log("..renderVisitAnalysisResultEditReason()");
    var data = dbTools.rsToJson(rs);
    $("#visit-analysis-result-edit-reason").data("kendoDropDownList").dataSource.data(data);
    $("#visit-analysis-result-edit-reason").data("kendoDropDownList").value(value);
    visitAnalysisResultEditEnableControls();
}

function renderVisitAnalysisResultEditReason2(tx, rs, value) {
    log("..renderVisitAnalysisResultEditReason2()");
    var data = dbTools.rsToJson(rs);
    $("#visit-analysis-result-edit-reason2").data("kendoDropDownList").dataSource.data(data);
    $("#visit-analysis-result-edit-reason2").data("kendoDropDownList").value(value);
}

function visitAnalysisResultEditNavBackClick() {
    log("..visitAnalysisResultEditNavBackClick");
    app.navigate("#:back");
}

function visitAnalysisResultEditSaveClick() {
    log("..visitAnalysisResultEditSaveClick");
    if (visitAnalysisResult.useQnt > 0) {
        visitAnalysisResult.reasonQnt = $("#visit-analysis-result-edit-reason-qnt").val();
    } else {
        visitAnalysisResult.reasonQnt = null;
    }
    if (visitAnalysisResult.useDate > 0) {
        visitAnalysisResult.reasonDate = inputDateToDate($("#visit-analysis-result-edit-reason-date").val());
    } else {
        visitAnalysisResult.reasonDate = null;
    }
    visitAnalysisResultSave(function() {navigateBack(visitAnalysisResult.navBackCount);});
}

/*function visitAnalysisResultEditTouchSwipe(e) {
    log("..visitAnalysisResultEditTouchSwipe direction=" + e.direction);
    var found = 0;
    var index = 0;
    while (found == 0 && index < visitAnalysisResults.rs.rows.length) {
        if (visitAnalysisResults.rs.rows.item(index).skuId == visitAnalysisResult.skuId) {
            found = 1;
        } else {
            index++;
        }
    }
    if (found == 1) {
        if (e.direction == "right") {
            if (index > 0) {
                visitAnalysisResultSave();
                visitAnalysisResult.skuId = visitAnalysisResults.rs.rows.item(index - 1).skuId;
                rendervisitAnalysisResultEdit(visit.visitId, visitAnalysisResult.skuId);
            }
        } else {
            if (index < visitAnalysisResults.rs.rows.length - 1) {
                visitAnalysisResultSave();
                visitAnalysisResult.skuId = visitAnalysisResults.rs.rows.item(index + 1).skuId;
                rendervisitAnalysisResultEdit(visit.visitId, visitAnalysisResult.skuId);
            }
        }
    }
}
*/
function visitAnalysisResultEditEnableControls() {
    var data = $("#visit-analysis-result-edit-reason").data("kendoDropDownList").dataItem();
    $("#visit-analysis-result-edit-full-name").prop("disabled", true);
    $("#visit-analysis-result-edit-reason").data("kendoDropDownList").enable(!visit.readonly);
    $("#visit-analysis-result-edit-reason2").data("kendoDropDownList").enable((data.isParent == 1) && (!visit.readonly));
    $("#visit-analysis-result-edit-reason-qnt").prop("disabled", (visitAnalysisResult.useQnt != 1) || visit.readonly);
    $("#visit-analysis-result-edit-reason-date").prop("disabled", (visitAnalysisResult.useDate != 1) || visit.readonly);
}

function visitAnalysisResultEditReasonChange(e) {
    var data = this.dataItem();
    visitAnalysisResult.reasonId = data.reasonId;
    visitAnalysisResult.reasonId2 = 0;
    visitAnalysisResult.useQnt = data.useQnt;
    visitAnalysisResult.useDate = data.useDate;
    dbTools.visitReasonListGet(visitAnalysisResult.reasonId, 1, function(tx, rs) {
        renderVisitAnalysisResultEditReason2(tx, rs, visitAnalysisResult.reasonId2);
    });
    visitAnalysisResultEditEnableControls();
}

function visitAnalysisResultEditReason2Change(e) {
    var data = this.dataItem();
    visitAnalysisResult.reasonId2 = data.reasonId;
    visitAnalysisResult.useQnt = data.useQnt;
    visitAnalysisResult.useDate = data.useDate;
    visitAnalysisResultEditEnableControls();
}

//----------------------------------------
// visit-analysis-results-wizard-reason-view
//----------------------------------------

function visitAnalysisResultsWizardReasonInit(e) {
    log("..visitAnalysisResultsWizardReasonInit");
}

function visitAnalysisResultsWizardReasonShow(e) {
    log("..visitAnalysisResultsWizardReasonShow skuId=" + e.view.params.skuId + ", parentReasonId=" + e.view.params.parentReasonId
        + ", parentUseQnt=" + e.view.params.parentUseQnt + ", parentUseDate=" + e.view.params.parentUseDate);
    visitAnalysisResultClear(true);
    visitAnalysisResult.skuId = e.view.params.skuId;
    var parentReasonId = e.view.params.parentReasonId;
    if (parentReasonId > 0) {
        visitAnalysisResult.reasonId = parentReasonId;
        visitAnalysisResult.useQnt = e.view.params.parentUseQnt;
        visitAnalysisResult.useDate = e.view.params.parentUseDate;
    }
    renderVisitAnalysisResultsWizardReason(parentReasonId);
}

function renderVisitAnalysisResultsWizardReason(parentReasonId) {
    dbTools.visitReasonListGet(parentReasonId, 0, renderVisitAnalysisResultsWizardReasonView);
}

function renderVisitAnalysisResultsWizardReasonView(tx, rs) {
    log("..renderVisitAnalysisResultsWizardReasonView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-analysis-results-wizard-reason-list").data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
//logObjectKeys(visitAnalysisResult);
}

function visitAnalysisResultsWizardReasonNavBackClick() {
    log("..visitAnalysisResultsWizardReasonNavBackClick");
    app.navigate("#:back");
}

function visitAnalysisResultsWizardReasonListClick(e) {
    log("..visitAnalysisResultsWizardReasonListClick");
    if (e.dataItem.isParent == 1) {
        app.navigate("#visit-analysis-results-wizard-reason-view?skuId=" + visitAnalysisResult.skuId 
            + "&parentReasonId=" + e.dataItem.reasonId + "&parentUseQnt=" + e.dataItem.useQnt + "&parentUseDate=" + e.dataItem.useDate);
    } else {
        if (e.dataItem.useQnt > 0 || e.dataItem.useDate > 0) {
            app.navigate("#visit-analysis-result-edit-view?skuId=" + visitAnalysisResult.skuId 
                + "&isNotReloadReason=1&reasonId" + (e.dataItem.parentId > 0 ? "2" : "") + "=" + e.dataItem.reasonId 
                + "&useQnt=" + e.dataItem.useQnt + "&useDate=" + e.dataItem.useDate + "&navBackCount=" + (e.dataItem.parentId > 0 ? "3" : "2"));
        } else {
            visitAnalysisResultsWizardReasonSave(e.dataItem.reasonId, (e.dataItem.parentId > 0 ? 2 : 1));
        }
    }
}

function visitAnalysisResultsWizardReasonSave(reasonId, navBackCount) {
    log("..visitAnalysisResultsWizardReasonSave(" + reasonId + ", " + navBackCount + ")");
    if (navBackCount == 1) {
        visitAnalysisResult.reasonId = reasonId;
    } else {
        visitAnalysisResult.reasonId2 = reasonId;
    }
    visitAnalysisResultSave(function() {navigateBack(navBackCount);});
//logObjectKeys(visitAnalysisResult);
}

//----------------------------------------
// common
//----------------------------------------

function visitAnalysisResultClear(clearSku) {
    log("..visitAnalysisResultClear(" + clearSku + ")");
    visitAnalysisResult.navBackCount = 1;
    if (clearSku) {
        visitAnalysisResult.skuId = 0;
        visitAnalysisResult.name = null;
        visitAnalysisResult.code = null;
        visitAnalysisResult.fullName = null;
    }
    visitAnalysisResult.isNotReloadReason = false;
    visitAnalysisResult.reasonId = 0;
    visitAnalysisResult.reasonId2 = null;
    visitAnalysisResult.useQnt = null;
    visitAnalysisResult.reasonQnt = null;
    visitAnalysisResult.useDate = null;
    visitAnalysisResult.reasonDate = null;
}

function visitAnalysisResultSave(onSuccess) {
    var reasonId;
    if (visitAnalysisResult.reasonId2 > 0) {
        reasonId = visitAnalysisResult.reasonId2;
    } else if (visitAnalysisResult.reasonId > 0) {
        reasonId = visitAnalysisResult.reasonId;
    } else {
        reasonId = null;
    }
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitAnalysisResultUpdate(visit.visitId, visitAnalysisResult.skuId, reasonId, visitAnalysisResult.reasonQnt, visitAnalysisResult.reasonDate, 
        function(visitId, skuId) {if (onSuccess != undefined) {onSuccess(visitId, skuId);}}, 
        dbTools.onSqlError
    );
}

