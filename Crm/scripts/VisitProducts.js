var visitProducts;
var visitProduct;

function visitProductsInit(e) {
    log("..visitProductsInit");
    visitProducts = {};
    visitProducts.navigateBack = 1;
    visitProducts.rs = null;
}

function visitProductsShow(e) {
    log("..visitProductsShow navigateBack=" + e.view.params.navigateBack);
    visitProducts.navigateBack = e.view.params.navigateBack;
    if (visitProducts.navigateBack < 1) {
        visitProducts.navigateBack = 1;
    }
    renderVisitProducts(visit.visitPlanItemId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}

function renderVisitProducts(visitPlanItemId, skucatId, fmtFilterType, fmtId) {
    dbTools.visitProductsGet(visitPlanItemId, skucatId, fmtFilterType, fmtId, renderVisitProductsView);
}

function renderVisitProductsView(tx, rs) {
    log("..renderVisitProductsView");
    visitProducts.rs = rs;
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data/*, group: "brandGrpName"*/});
    log("..renderVisitProductsView render beg");
    $("#visit-products-list").data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
    $(".checkbox").iCheck({
        checkboxClass: "icheckbox_flat-green",
        radioClass: "iradio_flat-green",
        increaseArea: "100%" // optional
    });
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
    renderVisitProductEdit(visit.visitPlanItemId, visitProduct.skuId);
}

function renderVisitProductEdit(visitPlanItemId, skuId) {
    log("..renderVisitProductEdit(" + visitPlanItemId + ", " + skuId + ")");
    dbTools.visitProductGet(visitPlanItemId, skuId, renderVisitProductEditView);
}

function renderVisitProductEditView(tx, rs) {
    log("..renderVisitProductEditView");
    if (rs.rows.length > 0) {
        visitProduct.name = rs.rows.item(0).name;
        visitProduct.code = rs.rows.item(0).code;
        visitProduct.fullName = rs.rows.item(0).fullName;
        visitProduct.sel = rs.rows.item(0).sel;
        visitProduct.qntRest = rs.rows.item(0).qntRest;
        visitProduct.qntOrder = rs.rows.item(0).qntOrder;
        visitProduct.reasonId = rs.rows.item(0).reasonId;
    } else {
        visitProductClear();
    }
    $("#visit-product-edit-full-name").val(visitProduct.fullName);
    $("#visit-product-edit-sel").val(visitProduct.sel);
    $("#visit-product-edit-qnt-rest").val(visitProduct.qntRest);
    $("#visit-product-edit-qnt-order").val(visitProduct.qntOrder);
}

function visitProductsNavBackClick(e) {
    log("..visitProductsNavBackClick");
    navigateBack(visitProducts.navigateBack);
}

function visitProductsShowAll(e) {
    visit.fmtFilterType = e.index;
    renderVisitProducts(visit.visitPlanItemId, settings.skuCatId, visit.fmtFilterType, visit.fmtId);
}

function visitProductEditNavBackClick() {
    log("..visitProductsEditNavBackClick");
    app.navigate("#:back");
}

function visitProductClear() {
    visitProduct.name = null;
    visitProduct.code = null;
    visitProduct.fullName = null;
    visitProduct.sel = null;
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
                visitProduct.skuId = visitProducts.rs.rows.item(index - 1).skuId;
                renderVisitProductEdit(visit.visitPlanItemId, visitProduct.skuId);
            }
        } else {
            if (index < visitProducts.rs.rows.length - 1) {
                visitProduct.skuId = visitProducts.rs.rows.item(index + 1).skuId;
                renderVisitProductEdit(visit.visitPlanItemId, visitProduct.skuId);
            }
        }
    }
}