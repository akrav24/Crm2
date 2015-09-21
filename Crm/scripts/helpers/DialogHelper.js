var dialogHelper = {};

dialogHelper.confirm = function(title, msg, onYes, onNo) {
    if (!title) {
        title = app.view()
            .header
            .find(".km-navbar [data-role=view-title]")
            .text();
    }
    var onConfirm = function (buttonIndex) {
        if (buttonIndex === 2) {
            if (onYes != undefined) {onYes();}
        } else {
            if (onNo != undefined) {onNo();}
        }
    }
    navigator.notification.confirm(
        msg,
        onConfirm,
        title,
        ["Нет", "Да"]
    );
}

dialogHelper.warning = function(title, msg) {
    if (!title) {
        title = app.view()
            .header
            .find(".km-navbar [data-role=view-title]")
            .text();
    }
    navigator.notification.alert(
        msg,
        undefined,
        title,
        "Ок"
    );
}

dialogHelper.confirmW = function(dialogSelector, title, msg, onYes, onNo) {
    var kendoWindow = $(dialogSelector).kendoWindow({
        actions: [],
        draggable: false,
        modal: true,
        resizable: false,
        title: title,
        width: "90%"
    });
    
    var content = '<div id="dialog-confirm-content" class="dialog">'
        + '<div class="dialog-message-wrapper" align="center">' + msg + '</div>'
        + '<div class="dialog-button-wrapper" align="center">'
        + '<a id="dialog-button-yes" class="dialog-button" data-role="button">Да</a>'
        + '<a id="dialog-button-no" class="dialog-button" data-role="button">Нет</a>'
        + '</div>'
        + '</div>';
    var template = kendo.template(content);
    $(dialogSelector).html(template({}));
    kendo.mobile.init($(dialogSelector));
    
    kendoWindow.find("#dialog-button-yes").click(function() {
        if (onYes != undefined) {onYes();}
        kendoWindow.data("kendoWindow").close();
    });
    kendoWindow.find("#dialog-button-no").click(function() {
        if (onNo != undefined) {onNo();}
        kendoWindow.data("kendoWindow").close();
    });
    
    kendoWindow.data("kendoWindow")
        .center().open();
}

dialogHelper.warningW = function(dialogSelector, title, msg) {
    var kendoWindow = $(dialogSelector).kendoWindow({
        actions: [],
        draggable: false,
        modal: true,
        resizable: false,
        title: title,
        width: "90%"
    });
    
    var content = '<div id="dialog-confirm-content" class="dialog">'
        + '<div class="dialog-message-wrapper" align="center">' + msg + '</div>'
        + '<div class="dialog-button-wrapper" align="center">'
        + '<a class="dialog-button" data-role="button">Ок</a>'
        + '</div>'
        + '</div>';
    var template = kendo.template(content);
    $(dialogSelector).html(template({}));
    kendo.mobile.init($(dialogSelector));
    
    kendoWindow.find(".dialog-button").click(function() {
        kendoWindow.data("kendoWindow").close();
    });
    
    kendoWindow.data("kendoWindow")
        .center().open();
}
