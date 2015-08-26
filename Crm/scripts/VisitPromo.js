var visitPromos;
var visitPromoItem;

//----------------------------------------
// visit-promo-promos-view
//----------------------------------------

function visitPromoPromosInit(e) {
    log("..visitPromoPromosInit");
    visitPromoObjInit();
}

function visitPromoPromosShow(e) {
    log("..visitPromoPromosShow navBackCount=" + e.view.params.navBackCount);
    visitPromoItemClear(0);
    visitPromos.navBackCount = e.view.params.navBackCount;
    if (visitPromos.navBackCount < 1) {
        visitPromos.navBackCount = 1;
    }
    goToNextViewIfEmpty = visitPromos.goToNextViewIfEmpty;
    dbTools.visitPromoListGet(visit.visitId, settings.skuCatId, function(tx, rs) {renderVisitPromoPromosView(tx, rs, goToNextViewIfEmpty);});
}

function visitPromoPromosAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
}

function renderVisitPromoPromosView(tx, rs, goToNextViewIfEmpty) {
    log("..renderVisitPromoPromosView(tx, rs, " + goToNextViewIfEmpty + ")");
    renderListView(rs, "#visit-promo-promos-list");
    visitPromos.Count = rs.rows.length;
    if (visitPromos.Count === 0) {
        if (goToNextViewIfEmpty) {
            navigateTo("#visit-promo-sub-cat-view");
        }
    }
}

function visitPromoPromosNavBackClick(e) {
    log("..visitPromoPromosNavBackClick");
    navigateBack(visitPromos.navBackCount);
}

function visitPromoAddClick(e) {
    log("..visitPromoAddClick");
    navigateTo("#visit-promo-sub-cat-view");
}

function visitPromoPromosListClick(e) {
    log("..visitPromoPromosListClick");
    copyObjValues(e.dataItem, visitPromoItem);
    navigateTo("#visit-promo-edit-view");
}

//----------------------------------------
// visit-promo-sub-cat-view
//----------------------------------------

function visitPromoSubCatShow(e) {
    log("..visitPromoSubCatShow");
    visitPromoItemClear(1);
    goToNextViewIfEmpty = visitPromoItem.subCatGoToNextViewIfEmpty
    dbTools.visitPromoSubCatListGet(settings.skuCatId, function(tx, rs) {renderVisitPromoSubCatView(tx, rs, goToNextViewIfEmpty);});
}

function visitPromoSubCatAfterShow(e) {
    viewTitleSet(app.view(), "Подкатегория - " + settings.skuCatName);
}

function renderVisitPromoSubCatView(tx, rs, goToNextViewIfEmpty) {
    log("..renderVisitPromoSubCatView(tx, rs, " + goToNextViewIfEmpty + ")");
    renderListView(rs, "#visit-promo-sub-cat-list");
    visitPromoItem.skuSubCatCount = rs.rows.length;
    if (visitPromoItem.skuSubCatCount === 0) {
        if (goToNextViewIfEmpty) {
            navigateTo("#visit-promo-brand-view");
        }
    }
}
 
function visitPromoSubCatNavBackClick(e) {
    log("..visitPromoSubCatNavBackClick");
    if (visitPromos.Count > 0) {
        navigateBackTo("views/VisitPromo.html");
    } else {
        navigateBackTo("views/Visit.html");
    }
}

function visitPromoSubCatListClick(e) {
    log("..visitPromoSubCatListClick");
    visitPromoItem.skuSubCatId = e.dataItem.skuSubCatId;
    visitPromoItem.skuSubCatName = e.dataItem.name;
    navigateTo("#visit-promo-brand-view");
}

//----------------------------------------
// visit-promo-brand-view
//----------------------------------------

function visitPromoBrandShow(e) {
    log("..visitPromoBrandShow");
    visitPromoItemClear(2);
    dbTools.visitPromoBrandListGet(settings.skuCatId, renderVisitPromoBrandView);
}

function visitPromoBrandAfterShow(e) {
    viewTitleSet(app.view(), "Бренд - " + settings.skuCatName);
}

function renderVisitPromoBrandView(tx, rs) {
    log("..renderVisitPromoBrandView");
    renderListView(rs, "#visit-promo-brand-list");
}
 
function visitPromoBrandNavBackClick(e) {
    log("..visitPromoBrandNavBackClick");
    if (visitPromoItem.skuSubCatCount > 0) {
        navigateBackTo("#visit-promo-sub-cat-view");
    } else {
        if (visitPromos.Count > 0) {
            navigateBackTo("views/VisitPromo.html");
        } else {
            navigateBackTo("views/Visit.html");
        }
    }
}

function visitPromoBrandListClick(e) { 
    log("..visitPromoBrandListClick");
    visitPromoItem.brandId = e.dataItem.brandId;
    visitPromoItem.brandName = e.dataItem.name;
    navigateTo("#visit-promo-promo-grp-view");
}

//----------------------------------------
// visit-promo-promo-grp-view
//----------------------------------------

function visitPromoPromoGrpShow(e) {
    log("..visitPromoPromoGrpShow");
    visitPromoItemClear(3);
    dbTools.visitPromoPromoGrpListGet(renderVisitPromoPromoGrpView);
}

function visitPromoPromoGrpAfterShow(e) {
    viewTitleSet(app.view(), "Группа промо-активности - " + settings.skuCatName);
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
    navigateTo("#visit-promo-promo-view");
}

//----------------------------------------
// visit-promo-promo-view
//----------------------------------------

function visitPromoPromoShow(e) {
    log("..visitPromoPromoShow");
    visitPromoItemClear(4);
    dbTools.visitPromoPromoListGet(visitPromoItem.promoGrpId, renderVisitPromoPromoView);
}

function visitPromoPromoAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
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
    visitPromoItem.photoEnabled = e.dataItem.photoEnabled;
    navigateTo("#visit-promo-edit-view");
}

function visitPromoSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitPromoUpdate(visit.visitId, visitPromoItem.visitPromoId, settings.skuCatId, visitPromoItem.skuSubCatId, visitPromoItem.brandId, 
            visitPromoItem.promoId, visitPromoItem.extInfoType, visitPromoItem.extInfoVal, visitPromoItem.extInfoVal2, visitPromoItem.extInfoName, 
        function(visitPromoId) {if (onSuccess != undefined) {onSuccess(visitPromoId);}}, 
        dbTools.onSqlError
    );
}

//----------------------------------------
// visit-promo-edit-view
//----------------------------------------

function visitPromoEditInit(e) {
    log("..visitPromoEditInit");
    $("#visit-promo-edit-ext-type").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "extInfoType",
        dataSource: [
            {name: "% скидки", extInfoType: 1},
            {name: "Сумма скидки", extInfoType: 2},
            {name: "Старая/новая цена", extInfoType: 3}
        ],
        value: "1",
        height: 800,
        change: visitPromoEditExtTypeChange
    });
}

function visitPromoEditShow(e) {
    log("..visitPromoEditShow");
    if (!visitPromoItem.isNotDataReload) {
        visitPromoItemClear(5);
        dbTools.visitPromoGet(visitPromoItem.visitPromoId, visit.visitId, settings.skuCatId, visitPromoItem.skuSubCatId, visitPromoItem.brandId, 
            visitPromoItem.promoId, renderVisitPromoEditView);
    }
    visitPromoItem.isNotDataReload = false;
}

function visitPromoEditAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
}

function renderVisitPromoEditView(tx, rs) {
    log("..renderVisitPromoEditView");
    if (rs.rows.length > 0) {
        copyObjValues(rs.rows.item(0), visitPromoItem);
        if (visitPromoItem.extInfoType == undefined) {
            visitPromoItem.extInfoType = 1;
        }
        if (rs.rows.item(0).visitPromoPhotoCnt != undefined) {
            visitPromoItem.photoCount = rs.rows.item(0).visitPromoPhotoCnt;
        } else {
            visitPromoItem.photoCount = 0;
        }
    }
    visitPromoEditFillControls();
    visitPromoEditEnableControls();
    //app.scroller().reset();
    visitPromoItem.isEdited = false;
}

function visitPromoEditNavBackClick() {
    if (visitPromoItem.isEdited) {
        dialogHelper.confirm(false, "Сохранить?", 
            function() {
                visitPromoEditSave(function() {navigateBackTo("views/VisitPromo.html");});
            }, 
            function() {
                navigateBack(1);
            }
        );
    } else {
        navigateBack(1);
    }
}

function visitPromoEditFillControls() {
    log("..visitPromoEditFillControls");
    $("#visit-promo-edit-brand-name").text(visitPromoItem.brandName);
    $("#visit-promo-edit-sub-cat-name").text(visitPromoItem.skuSubCatName != null ? (" (" + visitPromoItem.skuSubCatName + ")") : "");
    $("#visit-promo-edit-promo-name").text(visitPromoItem.promoName);
    $("#visit-promo-edit-ext-type").data("kendoDropDownList").value(visitPromoItem.extInfoType);
    $("#visit-promo-edit-ext-discount-percent").val(null);
    $("#visit-promo-edit-ext-discount-value").val(null);
    $("#visit-promo-edit-ext-discount-price-old").val(null);
    $("#visit-promo-edit-ext-discount-price-new").val(null);
    $("#visit-promo-edit-ext-qty-pay").val(null);
    $("#visit-promo-edit-ext-qty-get").val(null);
    $("#visit-promo-edit-ext-name").val(null);
    $("#visit-promo-edit-ext-name2").val(null);
    $("#visit-promo-edit-ext-name3").val(null);
    $("#visit-promo-edit-ext-volume").val(null);
    switch (visitPromoItem.extInfoKind) {
        case 1:
            $("#visit-promo-edit-ext-type").data("kendoDropDownList").value(visitPromoItem.extInfoType);
            switch (visitPromoItem.extInfoType) {
                case 1:
                    if (visitPromoItem.extInfoVal != null) {
                        $("#visit-promo-edit-ext-discount-percent").val(Math.round(visitPromoItem.extInfoVal * 100));
                    } else {
                        $("#visit-promo-edit-ext-discount-percent").val(visitPromoItem.extInfoVal);
                    }
                    break;
                case 2:
                    $("#visit-promo-edit-ext-discount-value").val(visitPromoItem.extInfoVal);
                    break;
                case 3:
                    $("#visit-promo-edit-ext-discount-price-old").val(visitPromoItem.extInfoVal);
                    $("#visit-promo-edit-ext-discount-price-new").val(visitPromoItem.extInfoVal2);
                    break;
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
        case 4:
            $("#visit-promo-edit-ext-name2").val(visitPromoItem.extInfoName);
            break;
        case 5:
            $("#visit-promo-edit-ext-name3").val(visitPromoItem.extInfoName);
            break;
    }
    visitPromoEditFillPhotoControls();
}
 
function visitPromoEditFillPhotoControls() {
    if (visitPromoItem.photoCount > 0) {
        $("#visit-promo-edit-photo-gallery").css("background-image", "url(styles/images/TakePhoto2.png)");
    } else {
        $("#visit-promo-edit-photo-gallery").css("background-image", "url(styles/images/TakePhoto1.png)");
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
    for (var i = 1; i <= 9; i++) { 
        if (i == visitPromoItem.extInfoKind) { 
            $(".visit-promo-edit-ext-kind" + i).removeAttr("style");
            if (i === 1) {
                for (var j = 1; j <= 3; j++) {
                    if (j == visitPromoItem.extInfoType) { 
                        $(".visit-promo-edit-ext-type" + j).removeAttr("style");
                    } else {
                        $(".visit-promo-edit-ext-type" + j).attr("style", "display: none;");
                    }
                }
            }
        } else {
            $(".visit-promo-edit-ext-kind" + i).attr("style", "display: none;");
        }
    }
    if (visitPromoItem.photoEnabled != 0) { 
        $("#visit-promo-edit-li-photo-gallery").removeAttr("style");
    } else {
        $("#visit-promo-edit-li-photo-gallery").attr("style", "display: none;");
    }
    $(".editable").prop("readonly", visit.readonly);
}

function visitPromoEditExtTypeChange(e) {
    var data = this.dataItem();
    visitPromoItem.isEdited = true;
    visitPromoItem.extInfoType = data.extInfoType;
    switch (visitPromoItem.extInfoType) {
        case 1:
            visitPromoItem.extInfoVal = $("#visit-promo-edit-ext-discount-percent").val() / 100;
            break;
        case 2:
            visitPromoItem.extInfoVal = $("#visit-promo-edit-ext-discount-value").val();
            break;
        case 3:
            visitPromoItem.extInfoVal = $("#visit-promo-edit-ext-discount-price-old").val();
            visitPromoItem.extInfoVal2 = $("#visit-promo-edit-ext-discount-price-new").val();
            break;
    }
    visitPromoEditEnableControls();
}

function visitPromoEditControlChange(id, value) {
    log("..visitPromoEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitPromoItem.isEdited = true;
    switch (id) {
        case "visit-promo-edit-ext-discount-percent":
            visitPromoItem.extInfoVal = val / 100;
            break;
        case "visit-promo-edit-ext-discount-value":
            visitPromoItem.extInfoVal = val;
            break;
        case "visit-promo-edit-ext-discount-price-old":
            visitPromoItem.extInfoVal = val;
            break;
        case "visit-promo-edit-ext-discount-price-new":
            visitPromoItem.extInfoVal2 = val;
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
        case "visit-promo-edit-ext-name2":
            visitPromoItem.extInfoName = val;
            break;
        case "visit-promo-edit-ext-name3":
            visitPromoItem.extInfoName = val;
            break;
    }
    visitPromoEditEnableControls();
}

function visitPromoEditControlKeyUp(sender) {
    log("..visitPromoEditControlKeyUp(sender)");
    visitPromoItem.isEdited = true;
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
    dbTools.visitPromoUpdate(visit.visitId, visitPromoItem.visitPromoId, settings.skuCatId, visitPromoItem.skuSubCatId, visitPromoItem.brandId, 
            visitPromoItem.promoId, visitPromoItem.extInfoType, visitPromoItem.extInfoVal, visitPromoItem.extInfoVal2, visitPromoItem.extInfoName, 
        function(visitPromoId) {
            for (; visitPromoItem.newPhotoLst.length > 0; ) {
                dbTools.visitPromoPhotoUpdate(visit.visitId, visitPromoId, null, visitPromoItem.newPhotoLst[0].fileId, 
                    function() {
                        visitPromoEditFillPhotoControls();
                    }
                );
                visitPromoItem.newPhotoLst.shift();
            }
            if (onSuccess != undefined) {onSuccess(visitPromoId);}
        }, 
        dbTools.onSqlError
    );
}

function visitPromoEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    visitPromos.Count--;
    dbTools.visitPromoUpdate(null, visitPromoItem.visitPromoId, null, null, null, null, null, null, null, null, 
        function(visitPromoId) {
            visitPromoItem.newPhotoLst = [];
            if (onSuccess != undefined) {onSuccess(visitPromoId);}
        }, 
        dbTools.onSqlError
    );
}

function visitPromoEditListClick(e) {
    if (e.item.attr("id") == "visit-promo-edit-li-photo-gallery") {
        visitPromoItem.isNotDataReload = true;
        photoGalleryObjInit();
        photoGallery.title = "Фотоотчет - " + settings.skuCatName;
        photoGallery.fileTableName = "FileOut";
        photoGallery.onAdd = visitPromoEditPhotoGalleryPhotoAdd;
        /*if (!visit.readonly && (visitPromoItem.visitPromoId == null || visitPromoItem.isEdited)) {
            photoGallery.addNewPhotoEnable = true;
            visitPromoEditSave(function(visitPromoId) {
                    visitPromoItem.visitPromoId = visitPromoId;
                    dbTools.visitPromoPhotoListGet(visitPromoItem.visitPromoId, 
                        function(tx, rs) {
                            visitPromoEditPhotoGalleryFileIdLstSet(rs);
                            navigateTo("views/PhotoGallery.html");
                        }
                    );
                }
            );
        } else */{
            photoGallery.addNewPhotoEnable = !visit.readonly;
            dbTools.visitPromoPhotoListGet(visitPromoItem.visitPromoId, 
                function(tx, rs) {
                    photoGallery.fileIdLst = visitPromoEditPhotoGalleryFileIdLstSet(rs);
                    navigateTo("views/PhotoGallery.html");
                }
            );
        }
    }
}

function visitPromoEditPhotoGalleryFileIdLstSet(rs) {
    var res = [];
    for (var i = 0; i < rs.rows.length; i++) {
        res.push({fileId: rs.rows.item(i).fileId, linkId: rs.rows.item(i).visitPromoPhotoId});
    }
    res = res.concat(visitPromoItem.newPhotoLst);
    return res;
}

function visitPromoEditPhotoGalleryPhotoAdd(fileTableName, fileId) {
    log("..visitPromoEditPhotoGalleryPhotoAdd(" + fileTableName + ", " + fileId + ")");
    /*dbTools.visitPromoPhotoUpdate(visit.visitId, visitPromoItem.visitPromoId, null, fileId, 
        function() {
            visitPromoItem.photoCount++;
            visitPromoEditFillControls();
            visitPromoEditEnableControls();
        }
    );*/
    visitPromoItem.isEdited = true;
    visitPromoItem.photoCount++;
    visitPromoItem.newPhotoLst.push({fileId: fileId, linkId: null});
    visitPromoEditFillPhotoControls();
    visitPromoEditEnableControls();
}

//----------------------------------------
// common
//----------------------------------------

function visitPromoObjInit() {
    log("..visitPromoObjInit");
    visitPromos = {};
    visitPromos.navBackCount = 1;
    visitPromos.Count = 0;
    visitPromos.goToNextViewIfEmpty = true;
    
    visitPromoItem = {};
    visitPromoItemClear(0);
}

function visitPromoItemClear(step) {
    log("..visitPromoItemClear(" + step + ")");
    if (step == undefined) {
        step = 0;
    }
    if (step <= 0) {
        visitPromoItem.visitPromoId = null;
        visitPromoItem.isNotDataReload = false;
        visitPromoItem.isEdited = false;
        visitPromoItem.subCatGoToNextViewIfEmpty = true;
    }
    if (step <= 1) {
        visitPromoItem.skuSubCatCount = 0;
        visitPromoItem.skuSubCatId = null;
        visitPromoItem.skuSubCatName = null;
    }
    if (step <= 2) {
        visitPromoItem.brandId = null;
        visitPromoItem.brandName = null;
    }
    if (step <= 3) {
        visitPromoItem.promoGrpId = null;
        visitPromoItem.promoGrpName = null;
    }
    if (step <= 4) {
        visitPromoItem.promoId = null;
        visitPromoItem.promoName = null;
        visitPromoItem.extInfoKind = null;
        visitPromoItem.photoEnabled = null;
    }
    if (step <= 5) {
        visitPromoItem.extInfoType = 1;
        visitPromoItem.extInfoVal = null;
        visitPromoItem.extInfoVal2 = null;
        visitPromoItem.extInfoName = null;
        visitPromoItem.photoCount = 0;
        visitPromoItem.newPhotoLst = [];
    }
    if (step >= 1) {
        visitPromos.goToNextViewIfEmpty = false;
    }
    if (step >= 2) {
        visitPromoItem.subCatGoToNextViewIfEmpty = false;
    }
}

