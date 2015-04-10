var isObjNeedInit;

function loginInit(e) {
    log("..loginInit");
    isObjNeedInit = true;
}

function loginShow(e) {
    log("..loginShow");
    
    kendo.ui.progress($("#login-progress"), true);
    
    $("#login-dialog-password").val("");
    /*$("#login-dialog").kendoWindow({
        actions: [],
        draggable: false,
        modal: true,
        resizable: false,
        title: "Вход",
        visible: false,
        width: "90%"
    });
    */
    if (isObjNeedInit) {
        settingsObjInit(
            function(settings) {
                dbInit(loginWindowOpen);
            }
        );
        isObjNeedInit = false;
    } else {
        loginWindowOpen();
    }
}

function loginWindowOpen() {
    log("..loginWindowOpen");
    kendo.ui.progress($("#login-progress"), false);
    if (settings.password != "") {
        //$("#login-dialog").data("kendoWindow").center().open();
        $(".login-dialog").removeClass("hidden");
    } else {
        $(".login-dialog").addClass("hidden");
        app.navigate("views/Start.html");
    }
}

function loginDialogButtonYesClick(e) {
    if ($("#login-dialog-password").val() == settings.password) {
        //$("#login-dialog").data("kendoWindow").close();
        app.navigate("views/Start.html");
    } else {
        dialogHelper.warning(/*"#login-info-dialog", */false, 
            "Вы ввели неправильный пароль!"
        );
    }
}
