function startOnInit(e) {
    log("..startOnInit(e)");
}

function startOnShow(e) {
    log("..startOnShow(e)");
    //$("#start-exchange-button").data("kendoMobileButton").enable(settings.nodeId > 0);
    if (settings.password != "") {
        $("#start-exit-button").removeClass("hidden");
    } else {
        $("#start-exit-button").addClass("hidden");
    }
}

function startErrorOnClick(e) {
    dialogHelper.warning("#start-dialog", false, "Установите идентификатор устройства (nodeId)");
}

function startExitButtonClick(e) {
    navigateBackTo("views/Login.html");
}
