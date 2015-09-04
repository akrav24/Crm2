// кеш системных настроек
var settings;

//document.addEventListener("deviceready", settingsInit, false);

// инициализация объекта кеша системных настроек
function settingsObjInit(onSuccess) {
    log("..settingsInit()");
    
    settings = {};
    
    // версия приложения
    settings.appVersion = 1056;
    
    // признак выполнения приложения в симуляторе
    settings.simulator = (window.navigator.simulator === true);
    
    // http сервер
    settings.serverName = "93.190.44.9";
    settings.serverPort = 331;
    // код узла
    settings.nodeId = 0;
    // пользовательский пароль
    settings.password = "";
    
    // корневая папка для сохранения получаемых и отправляемых файлов
    settings.rootFolderName = "com.bizlg.crm";
    
    // максимальное количество записей для вставки в таблицу SQLite в рамках отдельной транзакции
    // если количество слишком малое (< 100) или слишком большое (> 50000), то происходит резкое замедление операции вставки
    settings.bulkRecordCount = 2000;
    settings.fileBulkRecordCount = 5;
    
    // задержка при при программном переходе на предыдущую страницу (ms)
    settings.backDelay = 60;
    
    // даты последнего обмена информацией с сервером
    settings.exchange = {};
    settings.exchange.appVersion = null;
    settings.exchange.dataInDateSend = null;
    settings.exchange.dataInDateReceive = null;
    settings.exchange.dataOutDateSend = null;
    
    // фильтр точек
    settings.filterPoints = {};
    settings.filterPoints.chainId = "-1";
    settings.filterPoints.cityId = "-1";
    settings.filterPoints.channelId = "-1";
    settings.filterPoints.orgCatId = "-1";
    settings.filterPoints.orgTypeId = "-1";
    
    // настройки новых фотографий
    settings.newPhoto = {};
    settings.newPhoto.quality = 85;
    settings.newPhoto.height = 600;
    settings.newPhoto.width = 600;
    
    // фильтр категорий продуктов
    settings.skuCatId = -1;
    settings.skuCatName = "Все";
    
    if (onSuccess != undefined) {onSuccess(settings);}
}
