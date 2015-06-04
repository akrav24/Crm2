var dbTools = {};

function dbInit(onSuccsess) {
    log("dbInit()");
    dbTools.db = null;             // SQLite database
    dbTools.pointLst = null;
    dbTools.objectList = []; // [{name: <name>, needReloadData: <true|false>, callback: <callback function>}, ...]
    dbTools.openDB();
    dbTools.createSystemTables(
        function(tx) {
            dbTools.loadSettings(tx,
                function(tx) {
                    dbTools.onLoadSettings(tx);
                    if (onSuccsess != undefined) {onSuccsess();}
                }
            );
        }
    );
}

dbTools.onLoadSettings = function() {
    log("onLoadSettings()");
    log("settings.nodeId=" + settings.nodeId);
    log("settings.serverName=" + settings.serverName);
    log("settings.serverPort=" + settings.serverPort);
    log("settings.password=" + (settings.password != "" ? "Yes" : "No"));
    logSqlResult(undefined, "select * from parm");
}

dbTools.openDB = function() {
    log("openDB()");
    if (window.sqlitePlugin != undefined) {
        dbTools.db = window.sqlitePlugin.openDatabase("Crm");
    } else {
        // For debugging in simulator fallback to native SQL Lite
        log("==SIMULATOR");
        dbTools.db = window.openDatabase("Crm", "1.0", "Cordova Demo", 5 * 1024 * 1024);
    }
}

dbTools.createSystemTables = function(onSuccess) {
    log("createSystemTables()");
    dbTools.db.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataIn(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataIn primary key(blockId, irow))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataOut(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataOut primary key(blockId, irow))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailExchParm(blockId int, nodeId int, exchDate datetime)", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS MailToDelete(blockId int, refTypeId int, refId int)", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS ExtRef(refTypeId int, refId int, updateDate datetime, constraint pkExtRef primary key(refTypeId, refId))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS Parm(nodeId int, dataVersionId int, constraint pkParm primary key(nodeId))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS RefType(refTypeId int, name varchar(100), parentId int, test int, useNodeId int, dir int, updateDate datetime, sendAll int, lvl int, flds varchar(1000), constraint pkRefType primary key (refTypeId))", [], undefined, dbTools.onSqlError);
        tx.executeSql("CREATE TABLE IF NOT EXISTS Script(versionId int, sql varchar(8000), constraint pkScript primary key(versionId))", [], undefined, dbTools.onSqlError);
        
        dbTools.tableFieldListGet(tx, "MailExchParm", function(tx, tableName, fieldList) {
            if (!inArray(fieldList, "appVersion")) {tx.executeSql("ALTER TABLE MailExchParm ADD appVersion int", [], undefined, dbTools.onSqlError);}
         }, function(errMsg) {log(errMsg);});
        
        dbTools.tableFieldListGet(tx, "parm", function(tx, tableName, fieldList) {
            if (!inArray(fieldList, "password")) {tx.executeSql("ALTER TABLE Parm ADD password varchar(250)", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "exchDataFromOfficeSent")) {tx.executeSql("ALTER TABLE Parm ADD exchDataFromOfficeSent datetime", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "exchDataFromOfficeReceived")) {tx.executeSql("ALTER TABLE Parm ADD exchDataFromOfficeReceived datetime", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "exchDataToOfficeSent")) {tx.executeSql("ALTER TABLE Parm ADD exchDataToOfficeSent datetime", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "serverName")) {tx.executeSql("ALTER TABLE Parm ADD serverName varchar(250)", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "serverPort")) {tx.executeSql("ALTER TABLE Parm ADD serverPort int", [], undefined, dbTools.onSqlError);}
            if (!inArray(fieldList, "appVersion")) {tx.executeSql("ALTER TABLE Parm ADD appVersion int", [], undefined, dbTools.onSqlError);}
            
            if (settings.nodeId > 0) {
                tx.executeSql("INSERT INTO Parm(nodeId, dataVersionId, password, serverName, serverPort) SELECT ?, 0, ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM Parm WHERE nodeId = ?)", 
                        [settings.nodeId, settings.password, settings.serverName, settings.serverPort, settings.nodeId], 
                    function() {if (onSuccess != undefined) {onSuccess(tx);}}, 
                    dbTools.onSqlError
                );
            } else {
                if (onSuccess != undefined) {onSuccess(tx);}
            }
         }, function(errMsg) {log(errMsg);});
        /*tx.executeSql("INSERT INTO Parm(nodeId, dataVersionId) SELECT ?, 0 WHERE NOT EXISTS(SELECT 1 FROM Parm WHERE nodeId = ?)", 
            [settings.nodeId, settings.nodeId], undefined, dbTools.onSqlError);*/
    }, 
    dbTools.onTransError
    );
}

dbTools.loadSettings = function(tx, onSuccess) {
    log("loadSettings()");
    tx.executeSql("SELECT * FROM Parm", [], 
        function(tx, rs) {
            if (rs.rows.length > 0) {
                settings.nodeId = rs.rows.item(0).nodeId;
                settings.password = rs.rows.item(0).password != null ? rs.rows.item(0).password : "";
                settings.exchange.appVersion = rs.rows.item(0).appVersion;
                settings.exchange.dataInDateSend = sqlDateToDate(rs.rows.item(0).exchDataFromOfficeSent);
                settings.exchange.dataInDateReceive = sqlDateToDate(rs.rows.item(0).exchDataFromOfficeReceived);
                settings.exchange.dataOutDateSend = sqlDateToDate(rs.rows.item(0).exchDataToOfficeSent);
                settings.serverName = rs.rows.item(0).serverName;
                settings.serverPort = rs.rows.item(0).serverPort;
            }
            if (onSuccess != undefined) {onSuccess(tx);}
        }, 
        dbTools.onSqlError
    );
}

dbTools.tableFieldListGet = function(tx, tableName, onSuccess/*(tx, tableName, fldLst, fldTypeLst)*/, onError) {
    //log("tableFieldListGet(tx, '" + tableName + "')");
    var errMsg = "tableFieldListGet function error: ";
    if (tx != undefined) {
        tx.executeSql("SELECT * FROM sqlite_master WHERE name = ? COLLATE NOCASE", [tableName], 
            function(tx, rs) {
                var fldLst = [];
                var fldTypeLst = [];
                if (rs.rows.length > 0) {
                    var table = rs.rows.item(0);
                    var s = table.sql.split(',');
                    s[0] = s[0].replace(new RegExp('create\\s+table\\s+' + table.name + '\\s*\\(', 'i'),'');
                    fldLst = s.map(function(i){
                        return i.trim().split(/\s/).shift();
                    })
                    .filter(function(i){
                        return (!!i && i.indexOf(')') === -1 && i !== "constraint")
                    });
                    fldTypeLst = s.map(function(i){
                        var arr = i.trim().split(/\s/);
                        if (arr[0] != "constraint") {
                            arr.shift();
                        }
                        return arr.shift();
                    })
                    .filter(function(i){
                        return (!!i && i.indexOf("constraint") < 0)
                    })
                    .slice(0, fldLst.length);
                    for (; fldTypeLst.length < fldLst.length;) {
                        fldTypeLst.push("");
                    }
                }
                if (onSuccess != undefined) {onSuccess(tx, tableName, fldLst, fldTypeLst);}
            }, 
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}

dbTools.tableNextIdGet = function(tx, tableName, onSuccess, onError) {
    log("tableNextIdGet(tx, '" + tableName + "', onSuccess, onError)");
    var errMsg = "tableNextIdGet function error: ";
    if (tx != undefined) {
        var sql = "SELECT RT.refTypeId, IFNULL(C.refId, 0) + 1 AS refId"
            + "  FROM RefType RT"
            + "  LEFT JOIN Counter C ON RT.refTypeId = C.refType"
            + "  WHERE RT.name = ?";
        tx.executeSql(sql, [tableName],
            function(tx, rs) {
                if (rs.rows.length > 0) {
                    var refTypeId = rs.rows.item(0).refTypeId;
                    var refId = rs.rows.item(0).refId;
                    tx.executeSql("REPLACE INTO Counter (refType, refId, updateDate) VALUES(?, ?, ?)", [refTypeId, refId, dateToSqlDate(new Date())],
                        function(tx, rs) {log("tableNextIdGet tableName='" + tableName + "', refId=" + refId); if (onSuccess != undefined) {onSuccess(tx, refId);}},
                        function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
                    );
                } else {
                    if (onError != undefined) {onError(errMsg + "table '" + tableName + "' not found");}
                }
            },
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}

dbTools.tableUpdateDateFieldExists = function(tableName) {
    return !inArray(["parm", "visitpromo", "visitsku", "visitskucat", "visitpromophoto", "visitsurveyanswer", "visittask", "visitskuprice", "visitphoto", "visitplanogramanswer", "visitphototag"], tableName.toLowerCase());
}

dbTools.sqlInsert = function(tx, tableName, keyFieldNameArray, fieldNameArray, keyFieldValueArray, fieldValueArray, onSuccess, onError) {
    var errMsg = "sqlInsert function error: ";
    if (tx != undefined) {
        var fldArray = keyFieldNameArray.concat(fieldNameArray);
        var valArray = keyFieldValueArray.concat(fieldValueArray);
        if (dbTools.tableUpdateDateFieldExists(tableName)) {
            fldArray = fldArray.concat("updateDate");
            valArray = valArray.concat(dateToSqlDate(new Date()));
        }
        var flds = fldArray.join(", ");
        var vals = "";
        for (var i = 0; i < valArray.length; i++) {
            vals += (vals.length == 0 ? "" : ", ") + "?";
        }
        sql = "INSERT INTO " + tableName + "(" + flds + ")"
            + "  VALUES(" + vals + ")";
        tx.executeSql(sql, valArray,
            function(tx, rs) {if (onSuccess != undefined) {onSuccess(keyFieldValueArray);}},
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}

dbTools.sqlUpdate = function(tx, tableName, keyFieldNameArray, fieldNameArray, keyFieldValueArray, fieldValueArray, onSuccess, onError) {
    var errMsg = "sqlUpdate function error: ";
    if (tx != undefined) {
        var sql = "";
        if (dbTools.tableUpdateDateFieldExists(tableName)) {
            sql = "updateDate = ?";
        }
        for (var i = 0; i < fieldNameArray.length; i++) {
            sql += (sql.length == 0 ? "" : ", ") + fieldNameArray[i] + " = ?";
        }
        var sqlWhere = "";
        for (i = 0; i < keyFieldNameArray.length; i++) {
            sqlWhere += (sqlWhere.length == 0 ? "" : " AND ") + keyFieldNameArray[i] + " = ?";
        }
        sql = "UPDATE " + tableName
            + "  SET " + sql
            + "  WHERE " + sqlWhere;
        var params;
        if (dbTools.tableUpdateDateFieldExists(tableName)) {
            params = (new Array()).concat(dateToSqlDate(new Date()), fieldValueArray, keyFieldValueArray);
        } else {
            params = (new Array()).concat(fieldValueArray, keyFieldValueArray);
        }
        tx.executeSql(sql, params,
            function(tx, rs) {if (onSuccess != undefined) {onSuccess(keyFieldValueArray);}},
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}


dbTools.sqlDelete = function(tx, tableName, keyFieldNameArray, keyFieldValueArray, onSuccess, onError) {
    var errMsg = "sqlDelete function error: ";
    if (tx != undefined) {
        var sqlWhere = "";
        for (i = 0; i < keyFieldNameArray.length; i++) {
            sqlWhere += (sqlWhere.length == 0 ? "" : " AND ") + keyFieldNameArray[i] + " = ?";
        }
        var sql = "DELETE FROM " + tableName
            + "  WHERE " + sqlWhere;
        tx.executeSql(sql, keyFieldValueArray,
            function(tx, rs) {if (onSuccess != undefined) {onSuccess(keyFieldValueArray);}},
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}

dbTools.sqlInsertUpdate = function(tx, tableName, keyFieldNameArray, fieldNameArray, keyFieldValueArray, fieldValueArray, onSuccess, onError) {
    //log("sqlInsertUpdate('" + tableName + "', " + keyFieldNameArray + ", " + fieldNameArray + ", " + keyFieldValueArray + ", " + fieldValueArray);
    var errMsg = "sqlInsertUpdate function error: ";
    if (tx != undefined) {
        var sqlWhere = "";
        for (var i = 0; i < keyFieldNameArray.length; i++) {
            sqlWhere += (sqlWhere.length == 0 ? "" : " AND ") + keyFieldNameArray[i] + " = ?";
        }
        var sql = "SELECT * FROM " + tableName
            + "  WHERE " + sqlWhere;
        tx.executeSql(sql, keyFieldValueArray,
            function(tx, rs) {
                if (rs.rows.length == 0) {
                    dbTools.sqlInsert(tx, tableName, keyFieldNameArray, fieldNameArray, keyFieldValueArray, fieldValueArray, onSuccess, onError);
                } else {
                    dbTools.sqlUpdate(tx, tableName, keyFieldNameArray, fieldNameArray, keyFieldValueArray, fieldValueArray, onSuccess, onError);
                }
            },
            function(tx, error) {if (onError != undefined) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (onError != undefined) {onError(errMsg + "parameter 'tx' undefined");}
    }
}

dbTools.onTransError = function(error) {
    log("!!! SQLite transaction error, " + dbTools.errorMsg(error));
}

// TODO: проверить вызовы на соответствие параметров
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
        if (dbTools.objectList[i].name === name) {
            return dbTools.objectList[i];
        }
    }
    return {name: undefined, needReloadData: undefined, callback: undefined};
}

dbTools.objectListItemSet = function(name, needReloadData, callback) {
    if (name != undefined) {
        var found = false;
        for (var i = 0; i < dbTools.objectList.length && !found; i++) {
            if (dbTools.objectList[i].name === name) {
                found = true;
                dbTools.objectList[i].needReloadData = needReloadData;
                dbTools.objectList[i].callback = callback;
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

dbTools.vacuum = function() {
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("DELETE FROM MailBlockDataIn", []);
            tx.executeSql("DELETE FROM MailBlockDataOut", []);
            tx.executeSql("DELETE FROM MailToDelete", []);
        }, 
        dbTools.onTransError
    );
}

dbTools.tableFieldValueListSqlGet = function(tx, tableName, alias, onSuccess/*(tx, tableName, fieldValueListSql)*/, onError) {
    //log("tableFieldValueListSqlGet(tx, '" + tableName + "')");
    var errMsg = "tableFieldValueListSqlGet function error: ";
    if (!!tx) {
        tx.executeSql("SELECT flds FROM RefType WHERE name = ? COLLATE NOCASE", [tableName], 
            function(tx, rs) {
                if (rs.rows.length > 0) {
                    var tblFlds = rs.rows.item(0).flds;
                    dbTools.tableFieldListGet(tx, tableName,
                        function(tx, tableName, fieldList, fieldTypeList) {
                            var res = [];
                            var tblFldsList = tblFlds.split(",");
                            for (var i = 0; i < tblFldsList.length; i++) {
                                var tblFld = tblFldsList[i];
                                var tblFldType = "";
                                for (var j = 0; j < fieldList.length; j++) {
                                    if (fieldList[j].toLowerCase() == tblFld.toLowerCase()) {
                                        tblFldType = fieldTypeList[j];
                                        break;
                                    }
                                }
                                tblFld = alias + tblFld;
                                var fldValSql = "'NULL'";
                                if (tblFldType.length !== 0) {
                                    if (tblFldType.toLowerCase().indexOf("char") >= 0) {
                                        fldValSql = "''''||replace(" + tblFld + ",'''','''''')||''''";
                                    } else if (tblFldType.toLowerCase().indexOf("date") >= 0) {
                                        fldValSql = "''''||" + tblFld + "||''''";
                                    } else {
                                        fldValSql = "CAST(CASE WHEN " + tblFld + " = '' THEN NULL ELSE " + tblFld + " END AS varchar)";
                                    }
                                }
                                fldValSql = "IFNULL(" + fldValSql + ",'NULL')";
                                res.push(fldValSql);
                            }
                            if (!!onSuccess) {onSuccess(tx, tableName, res.join("||','||"));}
                        },
                        onError
                    );
                } else {
                    if (!!onError) {onError(errMsg + dbTools.errorMsg(error));}
                }
            }, 
            function(tx, error) {if (!!onError) {onError(errMsg + dbTools.errorMsg(error));}}
        );
    } else {
        if (!!onError) {onError(errMsg + "parameter 'tx' undefined");}
    }
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

dbTools.getTablesInfo = function(onSuccess) {
    log("----Tables info:");
    dbTools.tableCount();
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                dbTools.tableRowCount(rs.rows.item(i)["name"]);
            }
            logSqlResult(tx, "select * from parm");
        }, dbTools.onSqlError);
    }, dbTools.onTransError, onSuccess);
}

dbTools.getSQLiteInfo = function(onSuccess) {
    log("----SQLite info:");
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT sqlite_version() AS version, sqlite_source_id() AS sourceId", [], function(tx, rs) {
            if (rs.rows.length > 0) {
                log("SQLite version: " + rs.rows.item(0)["version"]);
                log("SQLite sourceId: " + rs.rows.item(0)["sourceId"]);
            }
        }, dbTools.onSqlError);
        logSqlResult(tx, "PRAGMA auto_vacuum");
        //logSqlResult(tx, "PRAGMA table_info(parm)");
    }, dbTools.onTransError, onSuccess);
}
