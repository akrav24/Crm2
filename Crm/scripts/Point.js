function pointShow(e) {
    log("..pointShow custId=" + e.view.params.custId);
    renderPoint(e.view.params.custId);
}

function renderPoint(custId) {
    dbTools.pointGet(custId, renderPointView);
}

function renderPointView(tx, rs) {
    log("..renderPointView");
    var data = dbTools.rsToJson(rs);
    //log("..data=" + JSON.stringify(data));
    $("#custName").val(rs.rows.item(0)["name"]);
}

