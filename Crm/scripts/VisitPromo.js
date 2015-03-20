var visitPromos;
var visitPromoItem;
var visitPromoPhotoData;

//----------------------------------------
// visit-promo-promos-view
//----------------------------------------

function visitPromoPromosInit(e) {
    log("..visitPromoPromosInit");
    visitPromoObjInit();
}

function visitPromoPromosShow(e) {
    log("..visitPromoPromosShow navBackCount=" + e.view.params.navBackCount);
    visitPromos.navBackCount = e.view.params.navBackCount;
    if (visitPromos.navBackCount < 1) {
        visitPromos.navBackCount = 1;
    }
    dbTools.visitPromoListGet(visit.visitId, settings.skuCatId, renderVisitPromoPromosView);
}

function renderVisitPromoPromosView(tx, rs) {
    log("..renderVisitPromoPromosView");
    renderListView(rs, "#visit-promo-promos-list");
    visitPromos.Count = rs.rows.length;
    if (visitPromos.Count === 0) {
        if (visitPromos.goToNextViewIfEmpty) {
            app.navigate("#visit-promo-gender-view");
        }
    }
    visitPromos.goToNextViewIfEmpty = true;
}

function visitPromoPromosNavBackClick(e) {
    log("..visitPromoPromosNavBackClick");
    navigateBack(visitPromos.navBackCount);
}

function visitPromoAddClick(e) {
    log("..visitPromoAddClick");
    visitPromoItemClear();
    app.navigate("#visit-promo-gender-view");
}

function visitPromoPromosListClick(e) {
    log("..visitPromoPromosListClick");
    visitPromoItem.visitPromoId = e.dataItem.visitPromoId;
    visitPromoItem.genderId = e.dataItem.genderId;
    visitPromoItem.genderName = e.dataItem.genderName;
    visitPromoItem.brandId = e.dataItem.brandId;
    visitPromoItem.brandName = e.dataItem.brandName;
    visitPromoItem.promoGrpId = e.dataItem.promoGrpId;
    visitPromoItem.promoGrpName = e.dataItem.promoGrpName;
    visitPromoItem.promoId = e.dataItem.promoId;
    visitPromoItem.promoName = e.dataItem.promoName;
    visitPromoItem.extInfoKind = e.dataItem.extInfoKind;
    visitPromoItem.extInfoVal = e.dataItem.extInfoVal;
    visitPromoItem.extInfoVal2 = e.dataItem.extInfoVal2;
    visitPromoItem.extInfoName = e.dataItem.extInfoName;
    app.navigate("#visit-promo-edit-view");
}

//----------------------------------------
// visit-promo-gender-view
//----------------------------------------

function visitPromoGenderShow(e) {
    log("..visitPromoGenderShow");
    visitPromoItemClear();
    dbTools.visitPromoGenderListGet(renderVisitPromoGenderView);
}

function renderVisitPromoGenderView(tx, rs) {
    log("..renderVisitPromoGenderView");
    renderListView(rs, "#visit-promo-gender-list");
}

function visitPromoGenderNavBackClick(e) {
    log("..visitPromoGenderNavBackClick");
    visitPromos.goToNextViewIfEmpty = false;
    if (visitPromos.Count > 0) {
        navigateBackTo("views/VisitPromo.html");
    } else {
        navigateBackTo("views/Visit.html");
    }
}

function visitPromoGenderListClick(e) {
    log("..visitPromoGenderListClick");
    visitPromoItem.genderId = e.dataItem.genderId;
    visitPromoItem.genderName = e.dataItem.name;
    app.navigate("#visit-promo-brand-view");
}

//----------------------------------------
// visit-promo-brand-view
//----------------------------------------

function visitPromoBrandShow(e) {
    log("..visitPromoBrandShow");
    dbTools.visitPromoBrandListGet(settings.skuCatId, renderVisitPromoBrandView);
}

function renderVisitPromoBrandView(tx, rs) {
    log("..renderVisitPromoBrandView");
    renderListView(rs, "#visit-promo-brand-list");
}
 
function visitPromoBrandNavBackClick(e) {
    log("..visitPromoBrandNavBackClick");
    navigateBackTo("#visit-promo-gender-view");
}

function visitPromoBrandListClick(e) {
    log("..visitPromoBrandListClick");
    visitPromoItem.brandId = e.dataItem.brandId;
    visitPromoItem.brandName = e.dataItem.name;
    app.navigate("#visit-promo-promo-grp-view");
}

//----------------------------------------
// visit-promo-promo-grp-view
//----------------------------------------

function visitPromoPromoGrpShow(e) {
    log("..visitPromoPromoGrpShow");
    dbTools.visitPromoPromoGrpListGet(renderVisitPromoPromoGrpView);
}

function renderVisitPromoPromoGrpView(tx, rs) {
    log("..renderVisitPromoPromoGrpView");
    renderListView(rs, "#visit-promo-promo-grp-list");
}
 
function visitPromoPromoGrpNavBackClick(e) {
    log("..visitPromoPromoGrpNavBackClick");
    navigateBackTo("#visit-promo-brand-view");
}

function visitPromoPromoGrpListClick(e) {
    log("..visitPromoPromoGrpListClick");
    visitPromoItem.promoGrpId = e.dataItem.promoGrpId;
    visitPromoItem.promoGrpName = e.dataItem.name;
    app.navigate("#visit-promo-promo-view");
}

//----------------------------------------
// visit-promo-promo-view
//----------------------------------------

function visitPromoPromoShow(e) {
    log("..visitPromoPromoShow");
    dbTools.visitPromoPromoListGet(visitPromoItem.promoGrpId, renderVisitPromoPromoView);
}

function renderVisitPromoPromoView(tx, rs) {
    log("..renderVisitPromoPromoView");
    renderListView(rs, "#visit-promo-promo-list");
}
 
function visitPromoPromoNavBackClick(e) {
    log("..visitPromoPromoNavBackClick");
    navigateBackTo("#visit-promo-promo-grp-view");
}

function visitPromoPromoListClick(e) {
    log("..visitPromoPromoListClick");
    visitPromoItem.promoId = e.dataItem.promoId;
    visitPromoItem.promoName = e.dataItem.name;
    visitPromoItem.extInfoKind = e.dataItem.extInfoKind;
    /*if (visitPromoItem.extInfoKind > 0) {*/
        app.navigate("#visit-promo-edit-view");
    /*} else {
        visitPromoSave(function() {navigateBackTo("views/VisitPromo.html");});
    }*/
}

function visitPromoSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitPromoUpdate(visit.visitId, visitPromoItem.visitPromoId, settings.skuCatId, visitPromoItem.genderId, visitPromoItem.brandId, 
            visitPromoItem.promoId, visitPromoItem.extInfoVal, visitPromoItem.extInfoVal2, visitPromoItem.extInfoName, 
        function(visitPromoId) {if (onSuccess != undefined) {onSuccess(visitPromoId);}}, 
        dbTools.onSqlError
    );
}

//----------------------------------------
// visit-promo-edit-view
//----------------------------------------

function visitPromoEditInit(e) {
    log("..visitPromoEditInit");
    visitPromoPhotoObjInit();
}

function visitPromoEditShow(e) {
    log("..visitPromoEditShow");
    visitPromoItem.isEdited = false;
    dbTools.visitPromoGet(visitPromoItem.visitPromoId, visit.visitId, settings.skuCatId, visitPromoItem.genderId, visitPromoItem.brandId, 
        visitPromoItem.promoId, renderVisitPromoEditView);
    dbTools.visitPromoPhotoListGet(visitPromoItem.visitPromoId, visitPromoPhotoObjFill);
}

function renderVisitPromoEditView(tx, rs) {
    log("..renderVisitPromoEditView");
    if (visitPromoItem.visitPromoId == null && rs.rows.length > 0) {
        visitPromoItem.visitPromoId = rs.rows.item(0).visitPromoId;
        visitPromoItem.extInfoVal = rs.rows.item(0).extInfoVal;
        visitPromoItem.extInfoVal2 = rs.rows.item(0).extInfoVal2;
        visitPromoItem.extInfoName = rs.rows.item(0).extInfoName;
    }
    visitPromoEditFillControls();
    visitPromoEditEnableControls();
    app.scroller().reset();
}

function visitPromoPhotoObjFill(tx, rs) {
    visitPromoPhotoObjInit();
    for (var i = 0; i < rs.rows.length; i++) {
        visitPromoPhotoData.push({fileId: rs.rows.item(i).visitPromoPhotoId, filePath: rs.rows.item(i).fileName, title: ""});
    }
}

function visitPromoEditNavBackClick() {
    navigateBack(1);
}

function visitPromoEditFillControls() {
    $("#visit-promo-edit-gender-name").text(visitPromoItem.genderName);
    $("#visit-promo-edit-brand-name").text(visitPromoItem.brandName);
    $("#visit-promo-edit-promo-name").text(visitPromoItem.promoName);
    $("#visit-promo-edit-ext-discount").val(null);
    $("#visit-promo-edit-ext-qty-pay").val(null);
    $("#visit-promo-edit-ext-qty-get").val(null);
    $("#visit-promo-edit-ext-name").val(null);
    $("#visit-promo-edit-ext-volume").val(null);
    switch (visitPromoItem.extInfoKind) {
        case 1:
            if (visitPromoItem.extInfoVal != null) {
                $("#visit-promo-edit-ext-discount").val(Math.round(visitPromoItem.extInfoVal * 100));
            } else {
                $("#visit-promo-edit-ext-discount").val(visitPromoItem.extInfoVal);
            }
            break;
        case 2:
            $("#visit-promo-edit-ext-qty-pay").val(visitPromoItem.extInfoVal);
            $("#visit-promo-edit-ext-qty-get").val(visitPromoItem.extInfoVal2);
            break;
        case 3:
            $("#visit-promo-edit-ext-name").val(visitPromoItem.extInfoName);
            $("#visit-promo-edit-ext-volume").val(visitPromoItem.extInfoVal);
            break;
    }
}

function visitPromoEditEnableControls() {
    log("..visitPromoEditEnableControls");
    if (!visit.readonly) {
        if (visitPromoItem.isEdited) {
            $("#visit-promo-edit-save-button").removeClass("hidden");
            $("#visit-promo-edit-del-button").addClass("hidden");
        } else {
            if (visitPromoItem.visitPromoId == null) {
                $("#visit-promo-edit-save-button").removeClass("hidden");
                $("#visit-promo-edit-del-button").addClass("hidden");
            } else {
                $("#visit-promo-edit-save-button").addClass("hidden");
                $("#visit-promo-edit-del-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-promo-edit-save-button").addClass("hidden");
        $("#visit-promo-edit-del-button").addClass("hidden");
    }
    for (var i = 1; i <= 3; i++) { 
        if (i === visitPromoItem.extInfoKind) { 
            $(".visit-promo-edit-ext-kind" + i).removeAttr("style");
        } else {
            $(".visit-promo-edit-ext-kind" + i).attr("style", "display: none;");
        }
    }
    $(".editable").prop("readonly", visit.readonly);
}

function visitPromoEditControlChange(id, value) {
    log("..visitPromoEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitPromoItem.isEdited = true;
    switch (id) {
        case "visit-promo-edit-ext-discount":
            visitPromoItem.extInfoVal = val / 100;
            break;
        case "visit-promo-edit-ext-qty-pay":
            visitPromoItem.extInfoVal = val;
            break;
        case "visit-promo-edit-ext-qty-get":
            visitPromoItem.extInfoVal2 = val;
            break;
        case "visit-promo-edit-ext-name":
            visitPromoItem.extInfoName = val;
            break;
        case "visit-promo-edit-ext-volume":
            visitPromoItem.extInfoVal = val;
            break;
    }
    visitPromoEditEnableControls();
}

function visitPromoEditSaveClick() {
    log("..visitPromoEditSaveClick");
    visitPromoEditSave(function() {navigateBackTo("views/VisitPromo.html");});
}

function visitPromoEditDelClick() {
    log("..visitPromoEditDelClick");
    visitPromoEditDel(function() {navigateBackTo("views/VisitPromo.html");});
}

function visitPromoEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    if (visitPromoItem.visitPromoId == null) {
        visitPromos.Count++;
    }
    dbTools.visitPromoUpdate(visit.visitId, visitPromoItem.visitPromoId, settings.skuCatId, visitPromoItem.genderId, visitPromoItem.brandId, 
            visitPromoItem.promoId, visitPromoItem.extInfoVal, visitPromoItem.extInfoVal2, visitPromoItem.extInfoName, 
        function(visitPromoId) {if (onSuccess != undefined) {onSuccess(visitPromoId);}}, 
        dbTools.onSqlError
    );
}

function visitPromoEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    visitPromos.Count--;
    dbTools.visitPromoUpdate(null, visitPromoItem.visitPromoId, null, null, null, null, null, null, null, 
        function(visitPromoId) {if (onSuccess != undefined) {onSuccess(visitPromoId);}}, 
        dbTools.onSqlError
    );
}

function visitPromoEditPhotoGalleryClick() {
    if (!visit.readonly && (visitPromoItem.visitPromoId == null || visitPromoItem.isEdited)) {
        visitPromoEditSave(function() {app.navigate("views/PhotoGallery.html?galleryType=VisitPromoPhoto");});
    } else {
        app.navigate("views/PhotoGallery.html?galleryType=VisitPromoPhoto");
    }
}

//----------------------------------------
// common
//----------------------------------------

function visitPromoObjInit() {
    visitPromos = {};
    visitPromos.navBackCount = 1;
    visitPromos.Count = 0;
    visitPromos.goToNextViewIfEmpty = true;
    
    visitPromoItem = {};
    visitPromoItemClear();
    
    visitPromoPhotoObjInit();
}

function visitPromoPhotoObjInit() {
    visitPromoPhotoData = [];
    //visitPromoPhotoData.push({fileId: 0, filePath: "styles/images/TakePhoto.png", title: ""});
}

function visitPromoItemClear() {
    visitPromoItem.visitPromoId = null;
    visitPromoItem.isEdited = false;
    visitPromoItem.genderId = null;
    visitPromoItem.genderName = null;
    visitPromoItem.brandId = null;
    visitPromoItem.brandName = null;
    visitPromoItem.promoGrpId = null;
    visitPromoItem.promoGrpName = null;
    visitPromoItem.promoId = null;
    visitPromoItem.promoName = null;
    visitPromoItem.extInfoKind = null;
    visitPromoItem.extInfoVal = null;
    visitPromoItem.extInfoVal2 = null;
    visitPromoItem.extInfoName = null;
}

