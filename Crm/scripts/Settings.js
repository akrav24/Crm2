var settings;

//document.addEventListener("deviceready", settingsInit, false);

function settingsInit() {
    log("..settingsInit()");
    
    settings = {};
    
    settings.nodeId = 0;
    
    settings.rootFolderName = "com.bizlg.crm";
    settings.planogamFilePrefix = "plan";
    settings.promoPhotoFilePrefix = "promo";
    
    settings.filterPoints = {};
    settings.filterPoints.chainId = "-1";
    settings.filterPoints.cityId = "-1";
    settings.filterPoints.channelId = "-1";
    settings.filterPoints.orgCatId = "-1";
    settings.filterPoints.orgTypeId = "-1";
    
    settings.skuCatId = -1;
    settings.skuCatName = "Все";
}
