var exchangeProgressStepName = ["Подготовка к обмену данными", "Отправка данных", "Получение данных", "Обработка данных", "Обмен данными завершен"];

function exchangeOnInit(e) {
    log("..exchangeOnInit(e)");
    var pb = $("#exchange-progress").kendoProgressBar({
        type: "percent",
        min: 0,
        max: 4,
        value: 0
    }).data("kendoProgressBar");
}

function exchangeOnShow(e) {
    log("..exchangeOnShow(e)");
    $("#exchange-close-button").addClass("hidden");
    //$("#exchange-error-button").addClass("hidden");
    $("#exchange-error").text("");
    
    var pb = $("#exchange-progress").data("kendoProgressBar");
    pb.value(0);
    $("#exchange-caption").text(exchangeProgressStepName[pb.value()]);
    
    dbTools.exchange(
        function() {
            log("----Exchange SUCCSESS");
            exchangeViewClose();
        }, 
        function(errMsg) {
            log("----Exchange ERROR: " + errMsg);
            $("#exchange-close-button").removeClass("hidden");
            //$("#exchange-error-button").removeClass("hidden");
            $("#exchange-error").text("Ошибка обмена: " + errMsg);
        }, 
        exchangeProgressInc
    );
}

function exchangeViewClose() {
    $("#exchange-view").kendoMobileModalView("close");
    var pb = $("#exchange-progress").data("kendoProgressBar");
    pb.value(0);
}

function exchangeProgressInc() {
    var pb = $("#exchange-progress").data("kendoProgressBar");
    pb.value(pb.value() + 1);
    if (pb.value() === 4) {
        $("#exchange-close-button").removeClass("hidden");
    }
    $("#exchange-caption").text(exchangeProgressStepName[pb.value()]);
}