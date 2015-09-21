dbTools.settingsServerUpdate = function(serverName, serverPort, onSuccess, onError) {
    log("settingsServerUpdate('" + serverName + "', " + serverPort + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "Parm", ["nodeId"], ["serverName", "serverPort"], [settings.nodeId], [serverName, serverPort], 
            function() {if (onSuccess != undefined) {onSuccess(settings.nodeId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.settingsPasswordUpdate = function(password, onSuccess, onError) {
    log("settingsPasswordUpdate()");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "Parm", ["nodeId"], ["password"], [settings.nodeId], [password], 
            function() {if (onSuccess != undefined) {onSuccess(settings.nodeId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}
