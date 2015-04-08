//----------------------------------------
// settings-view
//----------------------------------------

function settingsInit() {
    log("..settingsInit");
}

function settingsShow() {
    log("..settingsShow");
    renderSettings();
}
 
function renderSettings() {
    log("..renderSettings");
    $("#settings-date-in-send").val(dateToStr(settings.exchange.dataInDateSend, "DD.MM.YYYY HH:NN"));
    $("#settings-date-in-receive").val(dateToStr(settings.exchange.dataInDateReceive, "DD.MM.YYYY HH:NN"));
    $("#settings-date-out-send").val(dateToStr(settings.exchange.dataOutDateSend, "DD.MM.YYYY HH:NN"));
    $("#settings-node-id").val(settings.nodeId);
    $("#settings-server").val(settings.serverName + (settings.serverPort != undefined ? ":" + settings.serverPort : ""));
    $("#settings-password").val(settings.password);
}

function settingsNavBackClick(e) {
    navigateBack(1);
}

//----------------------------------------
// settings-node-id-edit-view
//----------------------------------------

function settingsNodeIdEditShow(e) {
    log("..settingsNodeIdEditShow");
    $("#settings-node-id-edit-node-id").val(settings.nodeId);
}

function settingsNodeIdEditSave(e) {
    log("..settingsNodeIdEditSave");
    var newNodeId = $("#settings-node-id-edit-node-id").val();
    if (newNodeId > 0) {
        if (newNodeId != settings.nodeId) {
            if (settings.nodeId > 0) {
                var msg = "Вы действительно намерены изменить код узла? После изменениия кода узла база данных приложения будет очищена.";
                dialogHelper.confirm("#settings-node-id-edit-dialog", false, msg,
                    function() {
                        nodeIdSet(newNodeId);
                        renderSettings();
                        settingsModalViewClose("#settings-node-id-edit-view");
                    }
                );
            } else {
                nodeIdSet(newNodeId);
                renderSettings();
                settingsModalViewClose("#settings-node-id-edit-view");
            }
        } else {
            settingsModalViewClose("#settings-node-id-edit-view");
        }
    }
}
 
//----------------------------------------
// settings-server-edit-view
//----------------------------------------

function settingsServerEditShow(e) {
    log("..settingsServerEditShow");
    $("#settings-server-edit-server-name").val(settings.serverName);
    $("#settings-server-edit-server-port").val(settings.serverPort);
}

function settingsServerEditSave(e) {
    log("..settingsServerEditSave");
    var serverName = $("#settings-server-edit-server-name").val();
    var serverPort = $("#settings-server-edit-server-port").val();
    dbTools.settingsServerUpdate(serverName, serverPort, function() {
        settings.serverName = serverName;
        settings.serverPort = serverPort;
        renderSettings();
    });
    settingsModalViewNavBackClick(e);
}

//----------------------------------------
// settings-password-edit-view
//----------------------------------------

function settingsPasswordEditShow(e) {
    log("..settingsPasswordEditShow");
    $("#settings-password-edit-password-old").val("");
    $("#settings-password-edit-password-new").val("");
    $("#settings-password-edit-password-new-confirm").val("");
    
    if (settings.password != "") {
        $("#settings-password-edit-password-old-li").removeAttr("style");
    } else {
        $("#settings-password-edit-password-old-li").attr("style", "display: none;");
    }
}

function settingsPasswordEditSave(e) {
    log("..settingsPasswordEditSave");
    
    var passwordSave = function(newPassword) {
        dbTools.settingsPasswordUpdate(newPassword, function() {
            settings.password = newPassword;
            renderSettings();
        });
    }
    
    var oldPassword = $("#settings-password-edit-password-old").val();
    var newPassword = $("#settings-password-edit-password-new").val();
    var newPasswordConfirm = $("#settings-password-edit-password-new-confirm").val();
    
    if (oldPassword == settings.password) {
        if (newPassword != newPasswordConfirm) {
            dialogHelper.warning("#settings-password-edit-dialog", false, 
                "Новый пароль и подтверждение нового пароля не совпадают!"
            );
        } else {
            if (newPassword == "") {
                if (settings.password != "") {
                    dialogHelper.confirm("#settings-password-edit-dialog", false, 
                        "Вы действительно намерены очистить пароль?",
                        function() {
                            passwordSave(newPassword);
                            settingsModalViewClose("#settings-password-edit-view");
                        }
                    );
                } else {
                    settingsModalViewClose("#settings-password-edit-view");
                }
            } else {
                passwordSave(newPassword);
                settingsModalViewClose("#settings-password-edit-view");
            }
        }
    } else {
        dialogHelper.warning("#settings-password-edit-dialog", false, 
            "Введен неправильный текущий пароль!"
        );
    }
}

//----------------------------------------
// common
//----------------------------------------

function settingsModalViewNavBackClick(e) {
    settingsModalViewClose(e.sender.view().id);
}

function settingsModalViewClose(modalViewSelector) {
    $(modalViewSelector).kendoMobileModalView("close");
}

