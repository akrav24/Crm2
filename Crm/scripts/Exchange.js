var exchangeProgressStepName;

function exchangeOnInit(e) {
    log("..exchangeOnInit(e)");
    exchangeProgressStepName = ["Подготовка к обмену данными", "Отправка данных", "Получение данных", "Обработка полученных данных", "Обмен данными завершен"];
    var pb = $("#exchange-progress").kendoProgressBar({
        type: "percent",
        animation: false,
        min: 0,
        max: exchangeProgressStepName.length - 1,
        value: 0
    }).data("kendoProgressBar");
}

function exchangeOnShow(e) {
    log("..exchangeOnShow(e)");
    $("#exchange-close-button").addClass("hidden");
    //$("#exchange-error-button").addClass("hidden");
    $("#exchange-error").text("");
    
    exchangeProgress(1);
    
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
        exchangeProgressNext
    );
}

function exchangeViewClose() {
    $("#exchange-view").kendoMobileModalView("close");
    var pb = $("#exchange-progress").data("kendoProgressBar");
    pb.value(0);
}

function exchangeProgress(stepId) {
    log("..exchangeProgress(" + stepId + ")");
    var pb = $("#exchange-progress").data("kendoProgressBar");
    pb.value(stepId - 1);
    $("#exchange-caption").text(exchangeProgressStepName[pb.value()]);
    if (pb.value() === (exchangeProgressStepName.length - 1)) {
        $("#exchange-close-button").removeClass("hidden");
    }
}

function exchangeProgressNext(stepId) {
    var pb = $("#exchange-progress").data("kendoProgressBar");
    if (stepId != undefined) {
        exchangeProgress(stepId);
    } else {
        var newStepId = pb.value() + 2;
        exchangeProgress(newStepId);
    }
}
