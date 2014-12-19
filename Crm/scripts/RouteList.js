var prdBgn = new Date();
// TODO: DEL
var prdBgn = new Date(2014, 0, 2);
prdBgn.setHours(0,0,0,0);
dbTools.objectListItemSet("route-list", true, renderRouteList);

function routeListInit(e) {
    log("..routeListInit");
    $("#route-prdbgn").data("kendoDatePicker").value(prdBgn);
    /*$(".checkbox").iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green',
        increaseArea: '20%' // optional
    });*/
}

function routeListShow(e) {
    log("..routeListShow");
    renderRouteList();
    /* // select item
    var listView = $("#route-list").data("kendoMobileListView");
    listView.selectable = true;
    listView.select(listView.element.children().first());*/
}

function renderRouteList() {
    if (dbTools.objectListItemGet("route-list").needReloadData) {
        dbTools.routeListGet(prdBgn, renderRouteListView);
        dbTools.objectListItemSet("route-list", false);
    }
}

function renderRouteListView(tx, rs) {
    log("..renderRouteView");
    var data = dbTools.rsToJson(rs);
    $("#route-list").data("kendoMobileListView").dataSource.data(data);
}

function routeListOnClick(e) {
    log("..routeListOnClick visitPlanItemId=" + e.dataItem.visitPlanItemId);
    //e.item.toggleClass("list-item-selected");
    //kendo.mobile.application.navigate("#route-view-edit?visitPlanItemId=" + e.dataItem.visitPlanItemId);
    kendo.mobile.application.navigate("views/RouteListEdit.html?visitPlanItemId=" + e.dataItem.visitPlanItemId);
}

function routePrdBgnOnChange(e) {
    log("..routePrdBgnOnChange");
    prdBgn = e.sender.value();
    dbTools.routeListGet(prdBgn, renderRouteListView);
}

//-- TODO: DEl Test -----------------------------------------------

function ShowViewOnClick() {
    var parm = "&checkbutton=" + ($('#show-checkbutton-checkbox').is(":checked") ? "1" : "0");
    parm += "&switch=" + ($('#show-switch-checkbox').is(":checked") ? "1" : "0");
    parm += "&grouped=" + ($('#grouped-view-checkbox').is(":checked") ? "1" : "0");
    if ($('#simple-view-radio').is(":checked"))
    {
        kendo.mobile.application.navigate("views/RouteListEditSimple.html?visitPlanItemId=1377782" + parm);
    } else {
        if ($('#show-switch-checkbox').is(":checked"))
        {
            kendo.mobile.application.navigate("views/RouteListEditTmpl2.html?visitPlanItemId=1377782" + parm);
        } else {
            kendo.mobile.application.navigate("views/RouteListEditTmpl.html?visitPlanItemId=1377782" + parm);
        }
    }
}

function testOnClick() {
    alert($("#route-prdbgn").data("kendoDatePicker").value());
    var o = $("#route-prdbgn");
    alert("o:" + o.toString());
    var keys = "";
    for (var key in o) {
        keys += key + ";";
        //log("...." + key + "=" + o[key]);
    }
    alert("o.keys:" + keys);
    log("------------------------------------------------------------");
    var d = o.data("kendoDatePicker");
    alert("d:" + d);
    var keys = "";
    for (var key in d) {
        keys += key + ";";
        log("...." + key + "=" + d[key]);
    }
    alert("d.keys:" + keys);
    alert("d.v:" + d.value());
}

