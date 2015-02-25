var settings = {};

//document.addEventListener("deviceready", settingsInit, false);

function settingsInit() {
    log("..settingsInit()");
    
    settings.nodeId = 0;
    
    settings.filterPoints = {};
    settings.filterPoints.chainId = "-1";
    settings.filterPoints.cityId = "-1";
    settings.filterPoints.channelId = "-1";
    settings.filterPoints.orgCatId = "-1";
    settings.filterPoints.orgTypeId = "-1";
    
    settings.skuCatId = -1;
    settings.skuCatName = "Все";
    
    log("....settings=" + JSON.stringify(settings));
}
