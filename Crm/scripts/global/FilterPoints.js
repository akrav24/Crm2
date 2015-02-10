var filterPointsOnApply;

function filterPointsInit(e) {
    log("..filterPointsInit");
    dbTools.objectListItemSet("filter-points", true);
    
    $("#chain-list").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "chainId",
        height: 800
    });
    $("#city-list").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "cityId",
        height: 800
    });
    $("#channel-list").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "channelId",
        height: 800
    });
    $("#orgcat-list").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "orgCatId",
        height: 800
    });
    $("#orgtype-list").kendoDropDownList({
        dataTextField: "name",
        dataValueField: "orgTypeId",
        height: 800
    });
}

function filterPointsShow(e) {
    renderFilterPoints();
}

function renderFilterPoints() {
    log("..renderFilterPoints");
log("....settings=" + JSON.stringify(settings));
    if (dbTools.objectListItemGet("filter-points").needReloadData) {
        log("....renderFilterPoints ReloadData");
        dbTools.filterPointsListGet(1, function(tx, rs) {
            renderFilterPointsControl("#chain-list", "kendoDropDownList", rs, settings.filterPoints.chainId);
        });
        dbTools.filterPointsListGet(2, function(tx, rs) {
            renderFilterPointsControl("#city-list", "kendoDropDownList", rs, settings.filterPoints.cityId);
        });
        dbTools.filterPointsListGet(3, function(tx, rs) {
            renderFilterPointsControl("#channel-list", "kendoDropDownList", rs, settings.filterPoints.channelId);
        });
        dbTools.filterPointsListGet(4, function(tx, rs) {
            renderFilterPointsControl("#orgcat-list", "kendoDropDownList", rs, settings.filterPoints.orgCatId);
        });
        dbTools.filterPointsListGet(5, function(tx, rs) {
            renderFilterPointsControl("#orgtype-list", "kendoDropDownList", rs, settings.filterPoints.orgTypeId);
        });
        dbTools.objectListItemSet("filter-points", false);
    } else {
        filterRestore(settings.filterPoints);
    }
}

function renderFilterPointsView(tx, rs) {
    log("..renderFilterPointsView");
}

function renderFilterPointsControl(controlName, controlTypeName, rs, value) {
    log("..renderFilterPointsControl('" + controlName + "', '" + controlTypeName + "', [rs], " + value + ")");
    var data = dbTools.rsToJson(rs);
    var control = $(controlName).data(controlTypeName);
    control.dataSource.data(data);
    if (value != undefined) {
        control.value(value);
    }
}

function filterApply(e) {
    log("..filterApply");
    settings.filterPoints.chainId = $("#chain-list").data("kendoDropDownList").value();
    settings.filterPoints.cityId = $("#city-list").data("kendoDropDownList").value();
    settings.filterPoints.channelId = $("#channel-list").data("kendoDropDownList").value();
    settings.filterPoints.orgCatId = $("#orgcat-list").data("kendoDropDownList").value();
    settings.filterPoints.orgTypeId = $("#orgtype-list").data("kendoDropDownList").value();
    
    if (filterPointsOnApply != undefined) {
        log("..filterApply filterPointsOnApply");
        filterPointsOnApply(settings.filterPoints);
    }
    
    app.navigate("#:back");
}

function filterRestore(filterPoints) {
    log("..filterRestore");
    $("#chain-list").data("kendoDropDownList").value(filterPoints.chainId);
    $("#city-list").data("kendoDropDownList").value(filterPoints.cityId);
    $("#channel-list").data("kendoDropDownList").value(filterPoints.channelId);
    $("#orgcat-list").data("kendoDropDownList").value(filterPoints.orgCatId);
    $("#orgtype-list").data("kendoDropDownList").value(filterPoints.orgTypeId);
}
