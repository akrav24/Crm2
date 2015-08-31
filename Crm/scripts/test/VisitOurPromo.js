var visitOurPromos;
var visitOurPromoItem;

//----------------------------------------
// visit-our-promo-promos-view
//----------------------------------------

function visitOurPromoPromosInit(e) {
    log("..visitOurPromoPromosInit");
    visitOurPromoObjInit();
}

function visitOurPromoPromosShow(e) {
    log("..visitOurPromoPromosShow navBackCount=" + e.view.params.navBackCount);
    visitOurPromoItemClear(0);
    visitOurPromos.navBackCount = e.view.params.navBackCount;
    if (visitOurPromos.navBackCount < 1) {
        visitOurPromos.navBackCount = 1;
    }
    goToNextViewIfEmpty = visitOurPromos.goToNextViewIfEmpty;
    dbTools.visitOurPromoListGet(visit.visitId, settings.skuCatId, function(tx, rs) {renderVisitOurPromoPromosView(tx, rs, goToNextViewIfEmpty);});
}

function visitOurPromoPromosAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
}

function renderVisitOurPromoPromosView(tx, rs, goToNextViewIfEmpty) {
    log("..renderVisitOurPromoPromosView(tx, rs, " + goToNextViewIfEmpty + ")");
    renderListView(rs, "#visit-our-promo-promos-list");
    visitOurPromos.Count = rs.rows.length;
    if (visitOurPromos.Count === 0) {
        if (goToNextViewIfEmpty) {
            navigateTo("#visit-our-promo-sub-cat-view");
        }
    }
}

function visitOurPromoPromosNavBackClick(e) {
    log("..visitOurPromoPromosNavBackClick");
    navigateBack(visitOurPromos.navBackCount);
}

function visitOurPromoAddClick(e) {
    log("..visitOurPromoAddClick");
    navigateTo("#visit-our-promo-sub-cat-view");
}

function visitOurPromoPromosListClick(e) {
    log("..visitOurPromoPromosListClick");
    copyObjValues(e.dataItem, visitOurPromoItem);
    navigateTo("#visit-our-promo-edit-view");
}

//----------------------------------------
// visit-our-promo-sub-cat-view
//----------------------------------------

function visitOurPromoSubCatShow(e) {
    log("..visitOurPromoSubCatShow");
    visitOurPromoItemClear(1);
    dbTools.visitOurPromoSubCatListGet(settings.skuCatId, function(tx, rs) {renderVisitOurPromoSubCatView(tx, rs, visitOurPromoItem.subCatGoToNextViewIfEmpty);});
}

function visitOurPromoSubCatAfterShow(e) {
    viewTitleSet(app.view(), "Подкатегория - " + settings.skuCatName);
}

function renderVisitOurPromoSubCatView(tx, rs, goToNextViewIfEmpty) {
    log("..renderVisitOurPromoSubCatView(tx, rs, " + goToNextViewIfEmpty + ")");
    renderListView(rs, "#visit-our-promo-sub-cat-list");
    visitOurPromoItem.skuSubCatCount = rs.rows.length;
    if (visitOurPromoItem.skuSubCatCount === 0) {
        if (goToNextViewIfEmpty) {
            navigateTo("#visit-our-promo-brand-view");
        }
    }
}
 
function visitOurPromoSubCatNavBackClick(e) {
    log("..visitOurPromoSubCatNavBackClick");
    if (visitOurPromos.Count > 0) {
        navigateBackTo("views/VisitOurPromo.html");
    } else {
        navigateBackTo("views/Visit.html");
    }
}

function visitOurPromoSubCatListClick(e) {
    log("..visitOurPromoSubCatListClick");
    visitOurPromoItem.skuSubCatId = e.dataItem.skuSubCatId;
    visitOurPromoItem.skuSubCatName = e.dataItem.name;
    navigateTo("#visit-our-promo-promo-grp-view");
}

//----------------------------------------
// visit-our-promo-brand-view
//----------------------------------------

/*function visitOurPromoBrandShow(e) {
    log("..visitOurPromoBrandShow");
    visitOurPromoItemClear(2);
    dbTools.visitOurPromoBrandListGet(settings.skuCatId, renderVisitOurPromoBrandView);
}

function visitOurPromoBrandAfterShow(e) {
    viewTitleSet(app.view(), "Бренд - " + settings.skuCatName);
}

function renderVisitOurPromoBrandView(tx, rs) {
    log("..renderVisitOurPromoBrandView");
    renderListView(rs, "#visit-our-promo-brand-list");
}
 
function visitOurPromoBrandNavBackClick(e) {
    log("..visitOurPromoBrandNavBackClick");
    if (visitOurPromoItem.skuSubCatCount > 0) {
        navigateBackTo("#visit-our-promo-sub-cat-view");
    } else {
        if (visitOurPromos.Count > 0) {
            navigateBackTo("views/VisitOurPromo.html");
        } else {
            navigateBackTo("views/Visit.html");
        }
    }
}

function visitOurPromoBrandListClick(e) { 
    log("..visitOurPromoBrandListClick");
    visitOurPromoItem.brandId = e.dataItem.brandId;
    visitOurPromoItem.brandName = e.dataItem.name;
    navigateTo("#visit-our-promo-promo-grp-view");
}
*/
//----------------------------------------
// visit-our-promo-promo-grp-view
//----------------------------------------

function visitOurPromoPromoGrpShow(e) {
    log("..visitOurPromoPromoGrpShow");
    visitOurPromoItemClear(3);
    dbTools.visitOurPromoPromoGrpListGet(renderVisitOurPromoPromoGrpView);
}

function visitOurPromoPromoGrpAfterShow(e) {
    viewTitleSet(app.view(), "Группа промо-активности - " + settings.skuCatName);
}

function renderVisitOurPromoPromoGrpView(tx, rs) {
    log("..renderVisitOurPromoPromoGrpView");
    renderListView(rs, "#visit-our-promo-promo-grp-list");
}
 
function visitOurPromoPromoGrpNavBackClick(e) {
    log("..visitOurPromoPromoGrpNavBackClick");
    if (visitOurPromoItem.skuSubCatCount > 0) {
        navigateBackTo("#visit-our-promo-sub-cat-view");
    } else {
        if (visitOurPromos.Count > 0) {
            navigateBackTo("views/VisitOurPromo.html");
        } else {
            navigateBackTo("views/Visit.html");
        }
    }
}

function visitOurPromoPromoGrpListClick(e) {
    log("..visitOurPromoPromoGrpListClick");
    visitOurPromoItem.promoGrpId = e.dataItem.promoGrpId;
    visitOurPromoItem.promoGrpName = e.dataItem.name;
    navigateTo("#visit-our-promo-promo-view");
}

//----------------------------------------
// visit-our-promo-promo-view
//----------------------------------------

function visitOurPromoPromoShow(e) {
    log("..visitOurPromoPromoShow");
    visitOurPromoItemClear(4);
    dbTools.visitOurPromoPromoListGet(visitOurPromoItem.promoGrpId, renderVisitOurPromoPromoView);
}

function visitOurPromoPromoAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
}

function renderVisitOurPromoPromoView(tx, rs) {
    log("..renderVisitOurPromoPromoView");
    renderListView(rs, "#visit-our-promo-promo-list");
    if (rs.rows.length == 1) {
        if (visitOurPromoItem.promoGoForward) {
            visitOurPromoPromoGoForward(rs.rows.item(0).promoId, rs.rows.item(0).name, rs.rows.item(0).extInfoKind, rs.rows.item(0).photoEnabled);
        } else {
            navigateBackTo("#visit-our-promo-promo-grp-view");
        }
        visitOurPromoItem.promoGoForward = !visitOurPromoItem.promoGoForward;
    }
}
 
function visitOurPromoPromoNavBackClick(e) {
    log("..visitOurPromoPromoNavBackClick");
    navigateBackTo("#visit-our-promo-promo-grp-view");
}

function visitOurPromoPromoListClick(e) {
    log("..visitOurPromoPromoListClick");
    visitOurPromoPromoGoForward(e.dataItem.promoId, e.dataItem.name, e.dataItem.extInfoKind, e.dataItem.photoEnabled);
}
 
function visitOurPromoPromoGoForward(promoId, promoName, extInfoKind, photoEnabled) {
    log("..visitOurPromoPromoGoForward("+ promoId + ", " + promoName + ", " + extInfoKind + ", " + photoEnabled + ")");
    visitOurPromoItem.promoId = promoId;
    visitOurPromoItem.promoName = promoName;
    visitOurPromoItem.extInfoKind = extInfoKind;
    visitOurPromoItem.photoEnabled = photoEnabled;
    navigateTo("#visit-our-promo-edit-view");
}

function visitOurPromoSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitOurPromoUpdate(visit.visitId, visitOurPromoItem.visitOurPromoId, settings.skuCatId, visitOurPromoItem.skuSubCatId, visitOurPromoItem.brandId, 
            visitOurPromoItem.promoId, visitOurPromoItem.extInfoType, visitOurPromoItem.extInfoVal, visitOurPromoItem.extInfoVal2, visitOurPromoItem.extInfoName, 
        function(visitOurPromoId) {if (onSuccess != undefined) {onSuccess(visitOurPromoId);}}, 
        dbTools.onSqlError
    );
}

//----------------------------------------
// visit-our-promo-edit-view
//----------------------------------------

function visitOurPromoEditInit(e) {
    log("..visitOurPromoEditInit");
    $("#visit-our-promo-edit-ext-type").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "extInfoType",
        dataSource: [
            {name: "% скидки", extInfoType: 1},
            {name: "Сумма скидки", extInfoType: 2},
            {name: "Старая/новая цена", extInfoType: 3}
        ],
        value: "1",
        height: 800,
        change: visitOurPromoEditExtTypeChange
    });
}

function visitOurPromoEditShow(e) {
    log("..visitOurPromoEditShow");
    if (!visitOurPromoItem.isNotDataReload) {
        visitOurPromoItemClear(5);
        dbTools.visitOurPromoGet(visitOurPromoItem.visitOurPromoId, visit.visitId, settings.skuCatId, visitOurPromoItem.skuSubCatId, visitOurPromoItem.brandId, 
            visitOurPromoItem.promoId, renderVisitOurPromoEditView);
    }
    visitOurPromoItem.isNotDataReload = false;
}

function visitOurPromoEditAfterShow(e) {
    viewTitleSet(app.view(), "Промо-активность - " + settings.skuCatName);
}

function renderVisitOurPromoEditView(tx, rs) {
    log("..renderVisitOurPromoEditView");
    if (rs.rows.length > 0) {
        copyObjValues(rs.rows.item(0), visitOurPromoItem);
        if (visitOurPromoItem.extInfoType == undefined) {
            visitOurPromoItem.extInfoType = 1;
        }
        if (rs.rows.item(0).visitOurPromoPhotoCnt != undefined) {
            visitOurPromoItem.photoCount = rs.rows.item(0).visitOurPromoPhotoCnt;
        } else {
            visitOurPromoItem.photoCount = 0;
        }
    }
    visitOurPromoEditFillControls();
    visitOurPromoEditEnableControls();
    //app.scroller().reset();
    visitOurPromoItem.isEdited = false;
}

function visitOurPromoEditNavBackClick() {
    if (visitOurPromoItem.isEdited) {
        dialogHelper.confirm(false, "Сохранить?", 
            function() {
                visitOurPromoEditSave(function() {navigateBackTo("views/VisitOurPromo.html");});
            }, 
            function() {
                navigateBack(1);
            }
        );
    } else {
        navigateBack(1);
    }
}

function visitOurPromoEditFillControls() {
    log("..visitOurPromoEditFillControls");
    $("#visit-our-promo-edit-brand-name").text(visitOurPromoItem.brandName);
    $("#visit-our-promo-edit-sub-cat-name").text(visitOurPromoItem.skuSubCatName != null ? (" (" + visitOurPromoItem.skuSubCatName + ")") : "");
    $("#visit-our-promo-edit-promo-name").text(visitOurPromoItem.promoName);
    $("#visit-our-promo-edit-ext-type").data("kendoDropDownList").value(visitOurPromoItem.extInfoType);
    $("#visit-our-promo-edit-ext-discount-percent").val(null);
    $("#visit-our-promo-edit-ext-discount-value").val(null);
    $("#visit-our-promo-edit-ext-discount-price-old").val(null);
    $("#visit-our-promo-edit-ext-discount-price-new").val(null);
    $("#visit-our-promo-edit-ext-qty-pay").val(null);
    $("#visit-our-promo-edit-ext-qty-get").val(null);
    $("#visit-our-promo-edit-ext-name").val(null);
    $("#visit-our-promo-edit-ext-name2").val(null);
    $("#visit-our-promo-edit-ext-name3").val(null);
    $("#visit-our-promo-edit-ext-volume").val(null);
    switch (visitOurPromoItem.extInfoKind) {
        case 1:
            $("#visit-our-promo-edit-ext-type").data("kendoDropDownList").value(visitOurPromoItem.extInfoType);
            switch (visitOurPromoItem.extInfoType) {
                case 1:
                    if (visitOurPromoItem.extInfoVal != null) {
                        $("#visit-our-promo-edit-ext-discount-percent").val(Math.round(visitOurPromoItem.extInfoVal * 100));
                    } else {
                        $("#visit-our-promo-edit-ext-discount-percent").val(visitOurPromoItem.extInfoVal);
                    }
                    break;
                case 2:
                    $("#visit-our-promo-edit-ext-discount-value").val(visitOurPromoItem.extInfoVal);
                    break;
                case 3:
                    $("#visit-our-promo-edit-ext-discount-price-old").val(visitOurPromoItem.extInfoVal);
                    $("#visit-our-promo-edit-ext-discount-price-new").val(visitOurPromoItem.extInfoVal2);
                    break;
            }
            break;
        case 2:
            $("#visit-our-promo-edit-ext-qty-pay").val(visitOurPromoItem.extInfoVal);
            $("#visit-our-promo-edit-ext-qty-get").val(visitOurPromoItem.extInfoVal2);
            break;
        case 3:
            $("#visit-our-promo-edit-ext-name").val(visitOurPromoItem.extInfoName);
            $("#visit-our-promo-edit-ext-volume").val(visitOurPromoItem.extInfoVal);
            break;
        case 4:
            $("#visit-our-promo-edit-ext-name2").val(visitOurPromoItem.extInfoName);
            break;
        case 5:
            $("#visit-our-promo-edit-ext-name3").val(visitOurPromoItem.extInfoName);
            break;
    }
    visitOurPromoEditFillPhotoControls();
}
 
function visitOurPromoEditFillPhotoControls() {
    if (visitOurPromoItem.photoCount > 0) {
        $("#visit-our-promo-edit-photo-gallery").css("background-image", "url(styles/images/TakePhoto2.png)");
    } else {
        $("#visit-our-promo-edit-photo-gallery").css("background-image", "url(styles/images/TakePhoto1.png)");
    }
}

function visitOurPromoEditEnableControls() {
    log("..visitOurPromoEditEnableControls");
    if (!visit.readonly) {
        if (visitOurPromoItem.isEdited) {
            $("#visit-our-promo-edit-save-button").removeClass("hidden");
            $("#visit-our-promo-edit-del-button").addClass("hidden");
        } else {
            if (visitOurPromoItem.visitOurPromoId == null) {
                $("#visit-our-promo-edit-save-button").removeClass("hidden");
                $("#visit-our-promo-edit-del-button").addClass("hidden");
            } else {
                $("#visit-our-promo-edit-save-button").addClass("hidden");
                $("#visit-our-promo-edit-del-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-our-promo-edit-save-button").addClass("hidden");
        $("#visit-our-promo-edit-del-button").addClass("hidden");
    }
    for (var i = 1; i <= 9; i++) { 
        if (i == visitOurPromoItem.extInfoKind) { 
            $(".visit-our-promo-edit-ext-kind" + i).removeAttr("style");
            if (i === 1) {
                for (var j = 1; j <= 3; j++) {
                    if (j == visitOurPromoItem.extInfoType) { 
                        $(".visit-our-promo-edit-ext-type" + j).removeAttr("style");
                    } else {
                        $(".visit-our-promo-edit-ext-type" + j).attr("style", "display: none;");
                    }
                }
            }
        } else {
            $(".visit-our-promo-edit-ext-kind" + i).attr("style", "display: none;");
        }
    }
    if (visitOurPromoItem.photoEnabled != 0) { 
        $("#visit-our-promo-edit-li-photo-gallery").removeAttr("style");
    } else {
        $("#visit-our-promo-edit-li-photo-gallery").attr("style", "display: none;");
    }
    $(".editable").prop("readonly", visit.readonly);
}

function visitOurPromoEditExtTypeChange(e) {
    var data = this.dataItem();
    visitOurPromoItem.isEdited = true;
    visitOurPromoItem.extInfoType = data.extInfoType;
    switch (visitOurPromoItem.extInfoType) {
        case 1:
            visitOurPromoItem.extInfoVal = $("#visit-our-promo-edit-ext-discount-percent").val() / 100;
            break;
        case 2:
            visitOurPromoItem.extInfoVal = $("#visit-our-promo-edit-ext-discount-value").val();
            break;
        case 3:
            visitOurPromoItem.extInfoVal = $("#visit-our-promo-edit-ext-discount-price-old").val();
            visitOurPromoItem.extInfoVal2 = $("#visit-our-promo-edit-ext-discount-price-new").val();
            break;
    }
    visitOurPromoEditEnableControls();
}

function visitOurPromoEditControlChange(id, value) {
    log("..visitOurPromoEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitOurPromoItem.isEdited = true;
    switch (id) {
        case "visit-our-promo-edit-ext-discount-percent":
            visitOurPromoItem.extInfoVal = val / 100;
            break;
        case "visit-our-promo-edit-ext-discount-value":
            visitOurPromoItem.extInfoVal = val;
            break;
        case "visit-our-promo-edit-ext-discount-price-old":
            visitOurPromoItem.extInfoVal = val;
            break;
        case "visit-our-promo-edit-ext-discount-price-new":
            visitOurPromoItem.extInfoVal2 = val;
            break;
        case "visit-our-promo-edit-ext-qty-pay":
            visitOurPromoItem.extInfoVal = val;
            break;
        case "visit-our-promo-edit-ext-qty-get":
            visitOurPromoItem.extInfoVal2 = val;
            break;
        case "visit-our-promo-edit-ext-name":
            visitOurPromoItem.extInfoName = val;
            break;
        case "visit-our-promo-edit-ext-volume":
            visitOurPromoItem.extInfoVal = val;
            break;
        case "visit-our-promo-edit-ext-name2":
            visitOurPromoItem.extInfoName = val;
            break;
        case "visit-our-promo-edit-ext-name3":
            visitOurPromoItem.extInfoName = val;
            break;
    }
    visitOurPromoEditEnableControls();
}

function visitOurPromoEditControlKeyUp(sender) {
    log("..visitOurPromoEditControlKeyUp(sender)");
    visitOurPromoItem.isEdited = true;
    visitOurPromoEditEnableControls();
}

function visitOurPromoEditSaveClick() {
    log("..visitOurPromoEditSaveClick");
    visitOurPromoEditSave(function() {navigateBackTo("views/VisitOurPromo.html");});
}

function visitOurPromoEditDelClick() {
    log("..visitOurPromoEditDelClick");
    visitOurPromoEditDel(function() {navigateBackTo("views/VisitOurPromo.html");});
}

function visitOurPromoEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    if (visitOurPromoItem.visitOurPromoId == null) {
        visitOurPromos.Count++;
    }
    dbTools.visitOurPromoUpdate(visit.visitId, visitOurPromoItem.visitOurPromoId, settings.skuCatId, visitOurPromoItem.skuSubCatId, visitOurPromoItem.brandId, 
            visitOurPromoItem.promoId, visitOurPromoItem.extInfoType, visitOurPromoItem.extInfoVal, visitOurPromoItem.extInfoVal2, visitOurPromoItem.extInfoName, 
        function(visitOurPromoId) {
            for (; visitOurPromoItem.newPhotoLst.length > 0; ) {
                dbTools.visitOurPromoPhotoUpdate(visit.visitId, visitOurPromoId, null, visitOurPromoItem.newPhotoLst[0].fileId, 
                    function() {
                        visitOurPromoEditFillPhotoControls();
                    }
                );
                visitOurPromoItem.newPhotoLst.shift();
            }
            if (onSuccess != undefined) {onSuccess(visitOurPromoId);}
        }, 
        dbTools.onSqlError
    );
}

function visitOurPromoEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    visitOurPromos.Count--;
    dbTools.visitOurPromoUpdate(null, visitOurPromoItem.visitOurPromoId, null, null, null, null, null, null, null, null, 
        function(visitOurPromoId) {
            visitOurPromoItem.newPhotoLst = [];
            if (onSuccess != undefined) {onSuccess(visitOurPromoId);}
        }, 
        dbTools.onSqlError
    );
}

function visitOurPromoEditListClick(e) {
    if (e.item.attr("id") == "visit-our-promo-edit-li-photo-gallery") {
        visitOurPromoItem.isNotDataReload = true;
        photoGalleryObjInit();
        photoGallery.title = "Фотоотчет - " + settings.skuCatName;
        photoGallery.fileTableName = "FileOut";
        photoGallery.onAdd = visitOurPromoEditPhotoGalleryPhotoAdd;
        /*if (!visit.readonly && (visitOurPromoItem.visitOurPromoId == null || visitOurPromoItem.isEdited)) {
            photoGallery.addNewPhotoEnable = true;
            visitOurPromoEditSave(function(visitOurPromoId) {
                    visitOurPromoItem.visitOurPromoId = visitOurPromoId;
                    dbTools.visitOurPromoPhotoListGet(visitOurPromoItem.visitOurPromoId, 
                        function(tx, rs) {
                            visitOurPromoEditPhotoGalleryFileIdLstSet(rs);
                            navigateTo("views/PhotoGallery.html");
                        }
                    );
                }
            );
        } else */{
            photoGallery.addNewPhotoEnable = !visit.readonly;
            dbTools.visitOurPromoPhotoListGet(visitOurPromoItem.visitOurPromoId, 
                function(tx, rs) {
                    photoGallery.fileIdLst = visitOurPromoEditPhotoGalleryFileIdLstSet(rs);
                    navigateTo("views/PhotoGallery.html");
                }
            );
        }
    }
}

function visitOurPromoEditPhotoGalleryFileIdLstSet(rs) {
    var res = [];
    for (var i = 0; i < rs.rows.length; i++) {
        res.push({fileId: rs.rows.item(i).fileId, linkId: rs.rows.item(i).visitOurPromoPhotoId});
    }
    res = res.concat(visitOurPromoItem.newPhotoLst);
    return res;
}

function visitOurPromoEditPhotoGalleryPhotoAdd(fileTableName, fileId) {
    log("..visitOurPromoEditPhotoGalleryPhotoAdd(" + fileTableName + ", " + fileId + ")");
    /*dbTools.visitOurPromoPhotoUpdate(visit.visitId, visitOurPromoItem.visitOurPromoId, null, fileId, 
        function() {
            visitOurPromoItem.photoCount++;
            visitOurPromoEditFillControls();
            visitOurPromoEditEnableControls();
        }
    );*/
    visitOurPromoItem.isEdited = true;
    visitOurPromoItem.photoCount++;
    visitOurPromoItem.newPhotoLst.push({fileId: fileId, linkId: null});
    visitOurPromoEditFillPhotoControls();
    visitOurPromoEditEnableControls();
}

//----------------------------------------
// common
//----------------------------------------

function visitOurPromoObjInit() {
    log("..visitOurPromoObjInit");
    visitOurPromos = {};
    visitOurPromos.navBackCount = 1;
    visitOurPromos.Count = 0;
    visitOurPromos.goToNextViewIfEmpty = true;
    
    visitOurPromoItem = {};
    visitOurPromoItemClear(0);
}

function visitOurPromoItemClear(step) {
    log("..visitOurPromoItemClear(" + step + ")");
    if (step == undefined) {
        step = 0;
    }
    if (step <= 0) {
        visitOurPromoItem.isNotDataReload = false;
        visitOurPromoItem.isEdited = false;
        visitOurPromoItem.subCatGoToNextViewIfEmpty = true;
    }
    if (step <= 1) {
        visitOurPromoItem.skuSubCatCount = 0;
        visitOurPromoItem.skuSubCatId = null;
        visitOurPromoItem.skuSubCatName = null;
    }
    if (step <= 2) {
        visitOurPromoItem.brandId = null;
        visitOurPromoItem.brandName = null;
    }
    if (step <= 3) {
        visitOurPromoItem.promoGrpId = null;
        visitOurPromoItem.promoGrpName = null;
        visitOurPromoItem.promoGoForward = true;
    }
    if (step <= 4) {
        visitOurPromoItem.visitOurPromoId = null;
        visitOurPromoItem.promoId = null;
        visitOurPromoItem.promoName = null;
        visitOurPromoItem.extInfoKind = null;
        visitOurPromoItem.photoEnabled = null;
    }
    if (step <= 5) {
        visitOurPromoItem.extInfoType = 1;
        visitOurPromoItem.extInfoVal = null;
        visitOurPromoItem.extInfoVal2 = null;
        visitOurPromoItem.extInfoName = null;
        visitOurPromoItem.photoCount = 0;
        visitOurPromoItem.newPhotoLst = [];
    }
    if (step >= 1) {
        visitOurPromos.goToNextViewIfEmpty = false;
    }
    if (step >= 2) {
        visitOurPromoItem.subCatGoToNextViewIfEmpty = false;
    }
}

