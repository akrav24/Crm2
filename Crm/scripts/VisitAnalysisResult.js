var visitAnalysisResults;
var visitAnalysisResult;

function visitAnalysisResultsInit(e) {
    log("..visitAnalysisResultsInit");
    visitAnalysisResults = {};
    visitAnalysisResults.navigateBack = 1;
    visitAnalysisResults.rs = null;
}

function visitAnalysisResultsShow(e) {
    log("..visitAnalysisResultsShow navigateBack=" + e.view.params.navigateBack);
    visitAnalysisResults.navigateBack = e.view.params.navigateBack;
    if (visitAnalysisResults.navigateBack < 1) {
        visitAnalysisResults.navigateBack = 1;
    }
    rendervisitAnalysisResults(visit.visitId);
}

function rendervisitAnalysisResults(visitId) {
    dbTools.visitAnalysisResultsGet(visitId, rendervisitAnalysisResultsView);
}

function rendervisitAnalysisResultsView(tx, rs) {
    log("..rendervisitAnalysisResultsView");
    visitAnalysisResults.rs = rs;
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-analysis-results-list").data("kendoMobileListView").setDataSource(dataSource);
   app.scroller().reset();
}

function visitAnalysisResultEditInit(e) {
    log("..visitAnalysisResultEditInit");
    visitAnalysisResult = {};
    visitAnalysisResult.skuId = 0;
    visitAnalysisResultClear();
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
    log("..visitAnalysisResultEditShow skuId=" + e.view.params.skuId);
    visitAnalysisResult.skuId = e.view.params.skuId;
    visitAnalysisResultClear();
    rendervisitAnalysisResultEdit(visit.visitId, visitAnalysisResult.skuId);
}

function rendervisitAnalysisResultEdit(visitId, skuId) {
    log("..rendervisitAnalysisResultEdit(" + visitId + ", " + skuId + ")");
    dbTools.visitAnalysisResultGet(visitId, skuId, renderVisitAnalysisResultEditView);
}

function renderVisitAnalysisResultEditView(tx, rs) {
    log("..renderVisitAnalysisResultEditView");
    if (rs.rows.length > 0) {
        visitAnalysisResult.name = rs.rows.item(0).name;
        visitAnalysisResult.code = rs.rows.item(0).code;
        visitAnalysisResult.fullName = rs.rows.item(0).fullName;
        visitAnalysisResult.sel = rs.rows.item(0).sel;
        visitAnalysisResult.sel0 = rs.rows.item(0).sel0;
        visitAnalysisResult.reasonId = rs.rows.item(0).reasonId;
        visitAnalysisResult.reasonId2 = rs.rows.item(0).reasonId2;
        visitAnalysisResult.useQnt = rs.rows.item(0).useQnt;
        visitAnalysisResult.reasonQnt = rs.rows.item(0).reasonQnt;
        visitAnalysisResult.useDate = rs.rows.item(0).useDate;
        visitAnalysisResult.reasonDate = rs.rows.item(0).reasonDate;
    } else {
        visitAnalysisResultClear();
    }
    
    $("#visit-analysis-result-edit-full-name").val(visitAnalysisResult.fullName);
    dbTools.visitReasonListGet(-1, function(tx, rs) {
        renderVisitAnalysisResultEditReason(tx, rs, visitAnalysisResult.reasonId);
    });
    dbTools.visitReasonListGet(visitAnalysisResult.reasonId, function(tx, rs) {
        renderVisitAnalysisResultEditReason2(tx, rs, visitAnalysisResult.reasonId2);
    });
    $("#visit-analysis-result-edit-reason-qnt").val(visitAnalysisResult.reasonQnt);
    $("#visit-analysis-result-edit-reason-date").val(visitAnalysisResult.reasonDate);
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

function visitAnalysisResultsNavBackClick(e) {
    log("..visitAnalysisResultsNavBackClick");
    navigateBack(visitAnalysisResults.navigateBack);
}

function visitAnalysisResultEditNavBackClick() {
    log("..visitAnalysisResultEditNavBackClick");
    visitAnalysisResultSave();
    app.navigate("#:back");
}

function visitAnalysisResultClear() {
    visitAnalysisResult.name = null;
    visitAnalysisResult.code = null;
    visitAnalysisResult.fullName = null;
    visitAnalysisResult.sel = null;
    visitAnalysisResult.sel0 = null;
    visitAnalysisResult.reasonId = 0;
    visitAnalysisResult.reasonId2 = null;
    visitAnalysisResult.useQnt = null;
    visitAnalysisResult.reasonQnt = null;
    visitAnalysisResult.useDate = null;
    visitAnalysisResult.reasonDate = null;
}

function visitAnalysisResultEditTouchSwipe(e) {
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

function visitAnalysisResultSave() {
    var reasonId, reasonQnt, reasonDate;
    if (visitAnalysisResult.reasonId2 > 0) {
        reasonId = visitAnalysisResult.reasonId2;
    } else if (visitAnalysisResult.reasonId > 0) {
        reasonId = visitAnalysisResult.reasonId;
    } else {
        reasonId = null;
    }
    if (visitAnalysisResult.useQnt > 0) {
        reasonQnt = $("#visit-analysis-result-edit-reason-qnt").val();
    } else {
        reasonQnt = null;
    }
    if (visitAnalysisResult.useDate > 0) {
        reasonDate = $("#visit-analysis-result-edit-reason-date").val();
    } else {
        reasonDate = null;
    }
    dbTools.visitAnalysisResultUpdate(visit.visitId, visitAnalysisResult.skuId, reasonId, reasonQnt, reasonDate, undefined, dbTools.onSqlError);
    dbTools.objectListItemSet("visit-list", true);
}

function visitAnalysisResultEditEnableControls() {
    var data = $("#visit-analysis-result-edit-reason").data("kendoDropDownList").dataItem();
    $("#visit-analysis-result-edit-full-name").prop("disabled", true);
    $("#visit-analysis-result-edit-reason").data("kendoDropDownList").enable(!visit.readonly);
    $("#visit-analysis-result-edit-reason2").data("kendoDropDownList").enable((data.isParent == 1) && (!visit.readonly));
    $("#visit-analysis-result-edit-reason-qnt").prop("disabled", (visitAnalysisResult.useQnt != 1) || visit.readonly);
    $("#visit-analysis-result-edit-reason-date").prop("disabled", (visitAnalysisResult.useDate != 1) || visit.readonly);
}

function visitAnalysisResultEditReasonChange(e) {
    log("....dataItem=" + JSON.stringify(this.dataItem()));
    var data = this.dataItem();
    visitAnalysisResult.reasonId = data.reasonId;
    visitAnalysisResult.reasonId2 = 0;
    visitAnalysisResult.useQnt = data.useQnt;
    visitAnalysisResult.useDate = data.useDate;
    dbTools.visitReasonListGet(visitAnalysisResult.reasonId, function(tx, rs) {
        renderVisitAnalysisResultEditReason2(tx, rs, visitAnalysisResult.reasonId2);
    });
    visitAnalysisResultEditEnableControls();
}

function visitAnalysisResultEditReason2Change(e) {
    log("....dataItem=" + JSON.stringify(this.dataItem()));
    var data = this.dataItem();
    visitAnalysisResult.reasonId2 = data.reasonId;
    visitAnalysisResult.useQnt = data.useQnt;
    visitAnalysisResult.useDate = data.useDate;
    visitAnalysisResultEditEnableControls();
}
