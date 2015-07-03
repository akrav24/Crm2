var visitSkuPriceList;
var visitSkuPriceItem;

//----------------------------------------
// visit-sku-price-list-view
//----------------------------------------

function visitSkuPriceInit(e) {
    log("..visitSkuPriceInit");
    visitSkuPriceObjInit();
}
 
function visitSkuPriceShow(e) {
    log("..visitSkuPriceShow navBackCount=" + e.view.params.navBackCount);
    visitSkuPriceList.navBackCount = e.view.params.navBackCount;
    if (visitSkuPriceList.navBackCount < 1) {
        visitSkuPriceList.navBackCount = 1;
    }
    renderVisitSkuPrice(visit.visitId, settings.skuCatId);
}

function visitSkuPriceAfterShow(e) {
    viewTitleSet(app.view(), "Прайс-аудит - " + settings.skuCatName);
}

function renderVisitSkuPrice(visitId, skuCatId) {
    dbTools.visitSkuPriceListGet(visitId, skuCatId, renderVisitSkuPriceView);
}

function renderVisitSkuPriceView(tx, rs) {
    log("..renderVisitSkuPriceView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-sku-price-list").data("kendoMobileListView").setDataSource(dataSource);
    if (visitSkuPriceList.scrollerReset) {
        app.scroller().reset();
        visitSkuPriceList.scrollerReset = false;
    }
}

function visitSkuPriceNavBackClick(e) {
    log("..visitSkuPriceNavBackClick");
    navigateBack(visitSkuPriceList.navBackCount);
}

function visitSkuPriceListClick(e) {
    log("..visitSkuPriceListClick");
    visitSkuPriceItem.isEdited = false;
    visitSkuPriceItem.skuId = e.dataItem.skuId;
    visitSkuPriceItem.name = e.dataItem.name;
    visitSkuPriceItem.code = e.dataItem.code;
    visitSkuPriceItem.suppName = e.dataItem.suppName;
    visitSkuPriceItem.price = e.dataItem.price;
    app.navigate("#visit-sku-price-edit-view");
}

//----------------------------------------
// visit-sku-price-edit-view
//----------------------------------------

function visitSkuPriceEditInit(e) {
    log("..visitSkuPriceEditInit");
}

function visitSkuPriceEditShow(e) {
    log("..visitSkuPriceEditShow");
    dbTools.visitSkuPriceGet(visit.visitId, visitSkuPriceItem.skuId, renderVisitSkuPriceEditView);
}

function visitSkuPriceEditAfterShow(e) {
    viewTitleSet(app.view(), "Прайс-аудит - " + settings.skuCatName);
}

function renderVisitSkuPriceEditView(tx, rs) {
    log("..renderVisitSkuPriceEditView");
    visitSkuPriceItem.isEdited = false;
    if (rs.rows.length > 0) {
        visitSkuPriceItem.skuId = rs.rows.item(0).skuId;
        visitSkuPriceItem.name = rs.rows.item(0).name;
        visitSkuPriceItem.code = rs.rows.item(0).code;
        visitSkuPriceItem.suppName = rs.rows.item(0).suppName;
        visitSkuPriceItem.price = rs.rows.item(0).price;
    }
    visitSkuPriceEditFillControls();
    visitSkuPriceEditEnableControls();
    //app.scroller().reset();
}

function visitSkuPriceEditFillControls() {
    log("..visitSkuPriceEditFillControls");
    $("#visit-sku-price-edit-name").text((visitSkuPriceItem.code != "" ? visitSkuPriceItem.code + " " : "") + visitSkuPriceItem.name + (visitSkuPriceItem.suppName != "" ? ", " + visitSkuPriceItem.suppName : ""));
    $("#visit-sku-price-edit-price").val(visitSkuPriceItem.price);
}

function visitSkuPriceEditEnableControls() {
    log("..visitSkuPriceEditEnableControls");
    if (!visit.readonly) {
        if (visitSkuPriceItem.isEdited) {
            $("#visit-sku-price-edit-save-button").removeClass("hidden");
            $("#visit-sku-price-edit-del-button").addClass("hidden");
        } else {
            if (visitSkuPriceItem.price == null) {
                $("#visit-sku-price-edit-save-button").removeClass("hidden");
                $("#visit-sku-price-edit-del-button").addClass("hidden");
            } else {
                $("#visit-sku-price-edit-save-button").addClass("hidden");
                $("#visit-sku-price-edit-del-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-sku-price-edit-save-button").addClass("hidden");
        $("#visit-sku-price-edit-del-button").addClass("hidden");
    }
    $(".editable").prop("readonly", visit.readonly);
}

function visitSkuPriceEditNavBackClick(e) {
    log("..visitSkuPriceEditNavBackClick");
    navigateBackTo("views/VisitSkuPrice.html");
}

function visitSkuPriceEditSaveClick(e) {
    log("..visitSkuPriceEditSaveClick");
    visitSkuPriceEditSave(function() {navigateBackTo("views/VisitSkuPrice.html");});
}

function visitSkuPriceEditDelClick(e) {
    log("..visitSkuPriceEditDelClick");
    visitSkuPriceEditDel(function() {navigateBackTo("views/VisitSkuPrice.html");});
}

function visitSkuPriceEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitSkuPriceUpdate(visit.visitId, visitSkuPriceItem.skuId, visitSkuPriceItem.price, 
        function(visitId, skuId) {if (onSuccess != undefined) {onSuccess(visitId, skuId);}}, 
        dbTools.onSqlError
    );
}

function visitSkuPriceEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitSkuPriceUpdate(visit.visitId, visitSkuPriceItem.skuId, null, 
        function(visitId, skuId) {if (onSuccess != undefined) {onSuccess(visitId, skuId);}}, 
        dbTools.onSqlError
    );
}

function visitSkuPriceEditControlChange(id, value) {
    log("..visitSkuPriceEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitSkuPriceItem.isEdited = true;
    switch (id) {
        case "visit-sku-price-edit-price":
            visitSkuPriceItem.price = val;
            break;
    }
    visitSkuPriceEditEnableControls();
}

//----------------------------------------
// common
//----------------------------------------

function visitSkuPriceObjInit() {
    visitSkuPriceList = {};
    visitSkuPriceList.navBackCount = 1;
    visitSkuPriceList.scrollerReset = true;
    visitSkuPriceItem = {};
    visitSkuPriceItem.isEdited = false;
    visitSkuPriceItem.skuId = 0;
    visitSkuPriceItem.name = "";
    visitSkuPriceItem.code = "";
    visitSkuPriceItem.suppName = "";
    visitSkuPriceItem.price = null;
}

