var visitProducts;
var visitProduct;

function visitProductsInit(e) {
    log("..visitProductsInit");
    visitProducts = {};
    visitProducts.stageId = 1;
    visitProducts.navigateBack = 1;
    visitProducts.rs = null;
}

function visitProductsShow(e) {
    log("..visitProductsShow stageId=" + e.view.params.stageId + ", navigateBack=" + e.view.params.navigateBack);
    visitProducts.stageId = e.view.params.stageId;
    visitProducts.navigateBack = e.view.params.navigateBack;
    if (visitProducts.navigateBack < 1) {
        visitProducts.navigateBack = 1;
    }
    renderVisitProducts(visit.visitId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}

function renderVisitProducts(visitId, skucatId, fmtFilterType, fmtId) {
    dbTools.visitProductsGet(visitId, skucatId, fmtFilterType, fmtId, renderVisitProductsView);
}

function renderVisitProductsView(tx, rs) {
    log("..renderVisitProductsView");
    visitProducts.rs = rs;
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data/*, group: "brandGrpName"*/});
    log("..renderVisitProductsView render beg");
    $("#visit-products-list").data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
    $('input').on('ifChecked', visitProductOnCheck);
    $('input').on('ifUnchecked', visitProductOnUncheck);
    $(".checkbox").iCheck({
        checkboxClass: "icheckbox_flat-green",
        radioClass: "iradio_flat-green",
        increaseArea: "100%" // optional
    });
    //iCheck class="iradio icheckbox checked hover focus disabled"
    log("..renderVisitProductsView render end");
}

function visitProductEditInit(e) {
    log("..visitProductEditInit");
    visitProduct = {};
    visitProduct.skuId = 0;
    visitProductClear();
}

function visitProductEditShow(e) {
    log("..visitProductEditShow skuId=" + e.view.params.skuId);
    visitProduct.skuId = e.view.params.skuId;
    visitProductClear();
    renderVisitProductEdit(visit.visitId, visitProduct.skuId);
}

function renderVisitProductEdit(visitId, skuId) {
    log("..renderVisitProductEdit(" + visitId + ", " + skuId + ")");
    dbTools.visitProductGet(visitId, skuId, renderVisitProductEditView);
}

function renderVisitProductEditView(tx, rs) {
    log("..renderVisitProductEditView");
    if (rs.rows.length > 0) {
        visitProduct.name = rs.rows.item(0).name;
        visitProduct.code = rs.rows.item(0).code;
        visitProduct.fullName = rs.rows.item(0).fullName;
        visitProduct.sel = rs.rows.item(0).sel;
        visitProduct.sel0 = rs.rows.item(0).sel0;
        visitProduct.qntRest = rs.rows.item(0).qntRest;
        visitProduct.qntOrder = rs.rows.item(0).qntOrder;
    } else {
        visitProductClear();
    }
    $("#visit-product-edit-full-name").val(visitProduct.fullName);
    if (visitProduct.sel == 1) {
        $("#visit-product-edit-sel").prop("checked", true);
    } else {
        $("#visit-product-edit-sel").prop("checked", false);
    }
    $("#visit-product-edit-qnt-rest").val(visitProduct.qntRest);
    $("#visit-product-edit-qnt-order").val(visitProduct.qntOrder);
}

function visitProductsNavBackClick(e) {
    log("..visitProductsNavBackClick");
    navigateBack(visitProducts.navigateBack);
}

function visitProductsShowAll(e) {
    visit.fmtFilterType = e.index;
    renderVisitProducts(visit.visitId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}

function visitProductEditNavBackClick() {
    log("..visitProductsEditNavBackClick");
    visitProductSave();
    app.navigate("#:back");
}

function visitProductClear() {
    visitProduct.name = null;
    visitProduct.code = null;
    visitProduct.fullName = null;
    visitProduct.sel = null;
    visitProduct.sel0 = null;
    visitProduct.qntRest = null;
    visitProduct.qntOrder = null;
    visitProduct.reasonId = null;
}

function visitProductEditTouchSwipe(e) {
    log("..visitProductEditTouchSwipe direction=" + e.direction);
    var found = 0;
    var index = 0;
    while (found == 0 && index < visitProducts.rs.rows.length) {
        if (visitProducts.rs.rows.item(index).skuId == visitProduct.skuId) {
            found = 1;
        } else {
            index++;
        }
    }
    if (found == 1) {
        if (e.direction == "right") {
            if (index > 0) {
                visitProductSave();
                visitProduct.skuId = visitProducts.rs.rows.item(index - 1).skuId;
                renderVisitProductEdit(visit.visitId, visitProduct.skuId);
            }
        } else {
            if (index < visitProducts.rs.rows.length - 1) {
                visitProductSave();
                visitProduct.skuId = visitProducts.rs.rows.item(index + 1).skuId;
                renderVisitProductEdit(visit.visitId, visitProduct.skuId);
            }
        }
    }
}

function visitProductOnCheck(e) {
    dbTools.visitProductSelUpdate(visit.visitId, $(this).attr("data-sku-id"), visitProducts.stageId, 1, undefined, dbTools.onSqlError);
}

function visitProductOnUncheck(e) {
    dbTools.visitProductSelUpdate(visit.visitId, $(this).attr("data-sku-id"), visitProducts.stageId, 0, undefined, dbTools.onSqlError);
}

function visitProductSave() {
    var sel = 0;
    if ($("#visit-product-edit-sel").prop("checked")) {
        sel = 1;
    }
    dbTools.visitProductUpdate(visit.visitId, visitProduct.skuId, sel, $("#visit-product-edit-qnt-rest").val(), $("#visit-product-edit-qnt-order").val(), undefined, dbTools.onSqlError);
}
