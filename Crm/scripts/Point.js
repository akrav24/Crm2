var point;

function pointInit(e) {
    log("..pointInit");
    dbTools.objectListItemSet("point", true);
}
 
function pointShow(e) {
    log("..pointShow");
    renderPoint(point.custId);
}

function pointSwipe(e) {
    log("..pointSwipe=" + e.direction);
    var found = 0;
    var index = 0;
    while (found == 0 && index < dbTools.pointLst.rows.length) {
        if (dbTools.pointLst.rows.item(index)["custId"] == point.custId) {
            found = 1;
        } else {
            index++;
        }
    }
    if (found == 1) {
        if (e.direction == "right") {
            if (index > 0) {
                renderPoint(dbTools.pointLst.rows.item(index - 1)["custId"]);
            }
        } else {
            if (index < dbTools.pointLst.rows.length - 1) {
                renderPoint(dbTools.pointLst.rows.item(index + 1)["custId"]);
            }
        }
    }
}    

function renderPoint(custId) {
    dbTools.pointGet(custId, renderPointView);
}

function renderPointView(tx, rs) {
    log("..renderPointView");
    var data = dbTools.rsToJson(rs);
    //log("..data=" + JSON.stringify(data));
    point.custId = rs.rows.item(0)["custId"];
    point.name = rs.rows.item(0).name;
    point.addr = rs.rows.item(0).addr;
    point.fmtId = rs.rows.item(0).fmtId;
    $("#custName").val(rs.rows.item(0)["name"]);
    $("#custAddr").val(rs.rows.item(0)["addr"]);
    $("#custOrgCat").val(rs.rows.item(0)["orgCatName"]);
    $("#custOrgType").val(rs.rows.item(0)["orgTypeName"]);
    $("#custChannel").val(rs.rows.item(0)["channelName"]);
}

function pointObjInit() {
    point = {};
    point.custId = 0;
    point.name = "";
    point.addr = "";
    point.fmtId = null;
}

