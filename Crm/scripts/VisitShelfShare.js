var visitShelfShare;
var visitShelfShareItem;

//----------------------------------------
// visit-shelf-share-view
//----------------------------------------

function visitShelfShareInit(e) {
    log("..visitShelfShareInit");
    visitShelfShare = {};
    visitShelfShare.navBackCount = 1;
    visitShelfShare.rs = null;
    visitShelfShareItem = {};
    visitShelfShareItemClear();
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

function visitShelfShareNavBackClick() {
    app.navigate("#:back");
}

function visitShelfShareListClick(e) {
    log("..visitShelfShareListClick");
    visitShelfShareItem.skuCatId = e.dataItem.skuCatId;
    visitShelfShareItem.name = e.dataItem.name;
    visitShelfShareItem.shelfShare = e.dataItem.shelfShare;
    visitShelfShareItem.shelfWidthTotal = e.dataItem.shelfWidthTotal;
    visitShelfShareItem.shelfWidthOur = e.dataItem.shelfWidthOur;
    visitShelfShareItem.isEdited = 0;
    app.navigate("#visit-shelf-share-edit-view");
}

//----------------------------------------
// visit-shelf-share-edit-view
//----------------------------------------

function visitShelfShareEditInit(e) {
    log("..visitShelfShareEditInit");
}

function visitShelfShareEditShow(e) {
    log("..visitShelfShareEditShow");
    renderVisitShelfEditShare(visit.visitId);
}

function renderVisitShelfEditShare(visitId) {
    visitShelfShareEditFillControls();
    visitShelfShareEditEnableControls();
}

function visitShelfShareEditFillControls() {
    $("#visit-shelf-share-edit-name").val(visitShelfShareItem.name);
    if (visitShelfShareItem.shelfShare != null) {
        $("#visit-shelf-share-edit-shelf-share").val(Math.round(visitShelfShareItem.shelfShare * 100));
    } else {
        $("#visit-shelf-share-edit-shelf-share").val(visitShelfShareItem.shelfShare);
    }
    $("#visit-shelf-share-edit-shelf-width-total").val(visitShelfShareItem.shelfWidthTotal);
    $("#visit-shelf-share-edit-shelf-width-our").val(visitShelfShareItem.shelfWidthOur);
}

function visitShelfShareItemClear() {
    visitShelfShareItem.skuCatId = null;
    visitShelfShareItem.name = null;
    visitShelfShareItem.shelfShare = null;
    visitShelfShareItem.shelfWidthTotal = null;
    visitShelfShareItem.shelfWidthOur = null;
    visitShelfShareItem.isEdited = 0;
}

function visitShelfShareEditNavBackClick() {
    app.navigate("#:back");
}

function visitShelfShareEditControlChange(id, value) {
    log("..visitShelfShareEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitShelfShareItem.isEdited = 1;
    switch (id) {
        case "visit-shelf-share-edit-shelf-share":
            visitShelfShareItem.shelfShare = val / 100;
            break;
        case "visit-shelf-share-edit-shelf-width-total":
            visitShelfShareItem.shelfWidthTotal = val;
            visitShelfShareEditCalcShelfShare();
            break;
        case "visit-shelf-share-edit-shelf-width-our":
            visitShelfShareItem.shelfWidthOur = val;
            visitShelfShareEditCalcShelfShare();
            break;
    }
    visitShelfShareEditEnableControls();
}

function visitShelfShareEditCalcShelfShare() {
    log("..visitShelfShareEditCalcShelfShare");
    if (visitShelfShareItem.shelfWidthTotal > 0 && visitShelfShareItem.shelfWidthOur > 0) {
        visitShelfShareItem.shelfShare = visitShelfShareItem.shelfWidthOur / visitShelfShareItem.shelfWidthTotal;
        $("#visit-shelf-share-edit-shelf-share").val(Math.round(visitShelfShareItem.shelfShare * 100));
    }
}

function visitShelfShareEditSaveClick() {
    visitShelfShareEditSave(function() {navigateBack(1);});
}

function visitShelfShareEditDelClick() {
    visitShelfShareEditDel(function() {navigateBack(1);});
}

function visitShelfShareEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitShelfShareUpdate(visit.visitId, visitShelfShareItem.skuCatId, visitShelfShareItem.shelfShare, visitShelfShareItem.shelfWidthTotal, visitShelfShareItem.shelfWidthOur, 
        function(visitId, skuCatId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}}, 
        dbTools.onSqlError
    );
}

function visitShelfShareEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitShelfShareUpdate(visit.visitId, visitShelfShareItem.skuCatId, null, null, null, 
        function(visitId, skuCatId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}}, 
        dbTools.onSqlError
    );
}

function visitShelfShareEditEnableControls() {
    log("..visitShelfShareEditEnableControls");
    if (!visit.readonly) {
        if (visitShelfShareItem.isEdited == 1) {
            $("#visit-shelf-share-edit-save-button").removeClass("hidden");
            $("#visit-shelf-share-edit-del-button").addClass("hidden");
        } else {
            if (visitShelfShareItem.shelfShare == null && visitShelfShareItem.shelfWidthTotal == null && visitShelfShareItem.shelfWidthOur == null) {
                $("#visit-shelf-share-edit-save-button").addClass("hidden");
                $("#visit-shelf-share-edit-del-button").addClass("hidden");
            } else {
                $("#visit-shelf-share-edit-save-button").addClass("hidden");
                $("#visit-shelf-share-edit-del-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-shelf-share-edit-save-button").addClass("hidden");
        $("#visit-shelf-share-edit-del-button").addClass("hidden");
    }
    $("#visit-shelf-share-edit-shelf-share").prop("disabled", visit.readonly);
    $("#visit-shelf-share-edit-shelf-width-total").prop("disabled", visit.readonly);
    $("#visit-shelf-share-edit-shelf-width-our").prop("disabled", visit.readonly);
}
