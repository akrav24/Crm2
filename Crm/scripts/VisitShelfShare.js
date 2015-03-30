var visitShelfShareItem;

//----------------------------------------
// visit-shelf-share-edit-view
//----------------------------------------

function visitShelfShareEditInit(e) {
    log("..visitShelfShareEditInit");
    visitShelfShareItem = {};
    visitShelfShareItemClear();
    visitShelfShareItem.navBackCount = 1;
}

function visitShelfShareEditShow(e) {
    log("..visitShelfShareEditShow navBackCount=" + e.view.params.navBackCount);
    visitShelfShareItem.navBackCount = e.view.params.navBackCount;
    if (visitShelfShareItem.navBackCount < 1) {
        visitShelfShareItem.navBackCount = 1;
    }
    renderVisitShelfShareEdit(visit.visitId, settings.skuCatId);
}

function renderVisitShelfShareEdit(visitId, skuCatId) {
    dbTools.visitShelfShareGet(visitId, skuCatId, renderVisitShelfShareEditView);
}

function renderVisitShelfShareEditView(tx, rs) {
    log("..renderVisitShelfShareEditView");
    if (rs.rows.length > 0) {
        visitShelfShareItem.shelfShare = rs.rows.item(0).shelfShare;
        visitShelfShareItem.shelfWidthTotal = rs.rows.item(0).shelfWidthTotal;
        visitShelfShareItem.shelfWidthOur = rs.rows.item(0).shelfWidthOur;
        visitShelfShareItem.isEdited = false;
    } else {
        visitShelfShareItemClear();
    }
    visitShelfShareEditFillControls();
    visitShelfShareEditEnableControls();
    app.scroller().reset();
}

function visitShelfShareEditFillControls() {
    $("#visit-shelf-share-edit-name").val(settings.skuCatName);
    if (visitShelfShareItem.shelfShare != null) {
        $("#visit-shelf-share-edit-shelf-share").val(Math.round(visitShelfShareItem.shelfShare * 100));
    } else {
        $("#visit-shelf-share-edit-shelf-share").val(visitShelfShareItem.shelfShare);
    }
    $("#visit-shelf-share-edit-shelf-width-total").val(visitShelfShareItem.shelfWidthTotal);
    $("#visit-shelf-share-edit-shelf-width-our").val(visitShelfShareItem.shelfWidthOur);
}

function visitShelfShareItemClear() {
    visitShelfShareItem.shelfShare = null;
    visitShelfShareItem.shelfWidthTotal = null;
    visitShelfShareItem.shelfWidthOur = null;
    visitShelfShareItem.isEdited = false;
}

function visitShelfShareEditNavBackClick() {
    navigateBack(visitShelfShareItem.navBackCount);
}

function visitShelfShareEditControlChange(id, value) {
    log("..visitShelfShareEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitShelfShareItem.isEdited = true;
    switch (id) {
        case "visit-shelf-share-edit-shelf-share":
            visitShelfShareItem.shelfShare = val / 100;
            visitShelfShareEditCalcShelfWidthOur();
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

function visitShelfShareEditCalcShelfWidthOur() {
    log("..visitShelfShareEditCalcShelfWidthOur");
    if (visitShelfShareItem.shelfWidthTotal > 0 && visitShelfShareItem.shelfShare > 0) {
        visitShelfShareItem.shelfWidthOur = Math.round(visitShelfShareItem.shelfWidthTotal * visitShelfShareItem.shelfShare);
        $("#visit-shelf-share-edit-shelf-width-our").val(visitShelfShareItem.shelfWidthOur);
    }
}

function visitShelfShareEditSaveClick() {
    visitShelfShareEditSave(function() {navigateBack(visitShelfShareItem.navBackCount);});
}

function visitShelfShareEditDelClick() {
    visitShelfShareEditDel(function() {navigateBack(visitShelfShareItem.navBackCount);});
}

function visitShelfShareEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitShelfShareUpdate(visit.visitId, settings.skuCatId, visitShelfShareItem.shelfShare, visitShelfShareItem.shelfWidthTotal, visitShelfShareItem.shelfWidthOur, 
        function(visitId, skuCatId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}}, 
        dbTools.onSqlError
    );
}

function visitShelfShareEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitShelfShareUpdate(visit.visitId, settings.skuCatId, null, null, null, 
        function(visitId, skuCatId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}}, 
        dbTools.onSqlError
    );
}

function visitShelfShareEditEnableControls() {
    log("..visitShelfShareEditEnableControls");
    if (!visit.readonly) {
        if (visitShelfShareItem.isEdited) {
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
