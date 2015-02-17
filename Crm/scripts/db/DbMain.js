var dbTools = {};
dbTools.db = null;             // SQLite database
dbTools.pointLst = null;
dbTools.pointId = null;
dbTools.objectList = []; // [{name: <name>, needReloadData: <true|false>, callback: <callback function>}, ...]

function dbInit() {
    log("dbInit()");
    dbTools.openDB();
    dbTools.createSystemTables();
    dbTools.loadSettings(onLoadSettings);
}

function onLoadSettings() {
    log("onLoadSettings() nodeId=" + settings.nodeId);
}

dbTools.openDB = function() {
    log("openDB()");
    if (window.sqlitePlugin != undefined) {
        dbTools.db = window.sqlitePlugin.openDatabase("Crm", function() {log("====1");}, function() {log("====2");});
    } else {
        // For debugging in simulator fallback to native SQL Lite
        dbTools.db = window.openDatabase("Crm", "1.0", "Cordova Demo", 200000);
    }
}

dbTools.createSystemTables = function() {
    log("createSystemTables()");
    dbTools.db.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS Script(versionId int, sql varchar(8000), constraint pkScript primary key(versionId))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS Parm(nodeId int, dataVersionId int, constraint pkParm primary key(nodeId))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataIn(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataIn primary key(blockId, irow))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataOut(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataOut primary key(blockId, irow))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailExchParm(blockId int, nodeId int, exchDate datetime)", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailToDelete(blockId int, refTypeId int, refId int)", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS RefType(refTypeId int, name varchar(100), parentId int, test int, useNodeId int, dir int, updateDate datetime, sendAll int, lvl int, flds varchar(1000), constraint pkRefType primary key (refTypeId))", [], undefined, dbTools.onSqlError);
        if (settings.nodeId > 0) {
            tx.executeSql("INSERT INTO Parm(nodeId, dataVersionId) SELECT ?, 0 WHERE NOT EXISTS(SELECT 1 FROM Parm WHERE nodeId = ?)", [settings.nodeId, settings.nodeId], undefined, dbTools.onSqlError);
        }
    }, dbTools.onTransError);
}

dbTools.loadSettings = function(onSuccess) {
    log("loadSettings()");
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT nodeId, dataVersionId FROM Parm", [], 
            function(tx, rs) {
                if (rs.rows.length > 0) {
                    settings.nodeId = rs.rows.item(0)["nodeId"];
                    if (onSuccess != undefined) {onSuccess();}
                }
            }, 
            dbTools.onSqlError
        );
    }, dbTools.onTransError);
}

dbTools.onTransError = function(error) {
    log("!!! SQLite transaction error, " + dbTools.errorMsg(error));
}

dbTools.onSqlError = function(tx, error, sql) {
    var errMsg = "!!! SQLite sql error, " + dbTools.errorMsg(error);
    if (sql != undefined) {
        errMsg += ", sql: " + sql;
    }
    log(errMsg);
}

dbTools.errorName = function(errorCode) {
    var codeStr = ""
    switch (errorCode) {
        case -1:
            codeStr = "UNDEFINED_CODE"
            break
        case 0:
            codeStr = "UNKNOWN_ERR"
            break
        case 1:
            codeStr = "DATABASE_ERR"
            break
        case 2:
            codeStr = "VERSION_ERR"
            break
        case 3:
            codeStr = "TOO_LARGE_ERR"
            break
        case 4:
            codeStr = "QUOTA_ERR"
            break
        case 5:
            codeStr = "SYNTAX_ERR"
            break
        case 6:
            codeStr = "CONSTRAINT_ERR"
            break
        case 7:
            codeStr = "TIMEOUT_ERR"
            break
        default:
            break
    }
    return codeStr;
}

dbTools.errorMsg = function(error) {
    var errMsg = "[undefined error]";
    if (error != undefined) {
        if (error.message != undefined) {
            errMsg = error.message;
            if (error.code != undefined) {
                errMsg = "code: " + error.code + " (" + dbTools.errorName(error.code) + "), message: " + errMsg;
            } else {
                errMsg = "code: -1 (" + dbTools.errorName(-1) + "), message: " + errMsg;
            }
        } else {
            errMsg = "";
            for (var key in error) {
                if (errMsg == "") {
                    errMsg = "(" + key + "=" + error[key];
                } else {
                    errMsg += ', ' + key + "=" + error[key];
                }
            }
            if (errMsg == "") {
                errMsg = error;
            } else {
                errMsg += ")";
            }
            errMsg = "code: -1 (" + dbTools.errorName(-1) + "), message: " + errMsg;
        }
    }
    return errMsg;
}

dbTools.rsToJson = function (rs) {
    var data = [];
    for (var i = 0; i < rs.rows.length; i++) {
        data.push(rs.rows.item(i));
    }
    return data;
}

dbTools.objectListItemGet = function(name) {
    for (var i = 0; i < dbTools.objectList.length; i++) {
        if (dbTools.objectList[i].name = name) {
            return dbTools.objectList[i];
        }
    }
    return {name: undefined, needReloadData: undefined, callback: undefined};
}

dbTools.objectListItemSet = function(name, needReloadData, callback) {
    if (name != undefined) {
        var found = false;
        for (var i = 0; i < dbTools.objectList.length && !found; i++) {
            if (dbTools.objectList[i].name = name) {
                found = true;
                dbTools.objectList[i].needReloadData = needReloadData;
                //if (callback !== undefined) {
                    dbTools.objectList[i].callback = callback;
                //}
                break;
            }
        }
        if (!found) {
            dbTools.objectList.push({name: name, needReloadData: needReloadData, callback: callback});
        }
    }
}

dbTools.dropAllTables = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'android%' AND name NOT LIKE '%WebKit%'", [], function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                var sql = "DROP TABLE " + rs.rows.item(i)["name"];
                tx.executeSql(sql, [], undefined, dbTools.onSqlError);
            }
        }, dbTools.onSqlError);
    }, dbTools.onTransError);
}



//-- AK: TO DEL --

dbTools.tableCount = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT count(*) AS cnt FROM sqlite_master WHERE type='table'", [], function(tx, rs) {
            log("Table count = " + rs.rows.item(0)["cnt"].toString());
        }, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.tableRowCount = function(tableName) {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT count(*) AS cnt FROM " + tableName, [], function(tx, rs) {
            log(tableName + " row count = " + rs.rows.item(0)["cnt"].toString());
        }, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.getTablesInfo = function() {
    log("----Tables info:");
    dbTools.tableCount();
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                dbTools.tableRowCount(rs.rows.item(i)["name"]);
            }
            logSqlResult("select * from parm");
        }, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.getSQLiteInfo = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT sqlite_version() AS version, sqlite_source_id() AS sourceId", [], function(tx, rs) {
            if (rs.rows.length > 0) {
                log("SQLite version: " + rs.rows.item(0)["version"]);
                log("SQLite sourceId: " + rs.rows.item(0)["sourceId"]);
            }
        }, dbTools.onSqlError);
    }, dbTools.onTransError);
}
