// Exchange begin (get blockId)
dbTools.exchangeBlockIdGet = function(onSuccess, onError) {
    var blockId = 0;
    var url = dbTools.serverUrl(serverName, port) + "Api/ExchangeStart/?nodeId=" + nodeId;
    log("exchangeBlockIdGet()");
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            if (data.length !== 0) {
                blockId = data[0].blockId;
            }
            log("exchangeBlockIdGet blockId=" + blockId);
            if (onSuccess != undefined) {onSuccess(blockId);}
        },
        error: function (jqXHR, textStatus, errorThrown) {if (onError != undefined) {onError("Ajax Get Error: " + url);}}
    });
    return blockId;
}

// Get data from web service
dbTools.exchangeDataGet = function(blockId, onSuccess, onError) {
    log("exchangeDataGet(blockId=" + blockId + ")");
    var res = [];
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            res = data;
            if (onSuccess != undefined) {
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {if (onError != undefined) {onError("Ajax Get Error: " + url);}}
    });
    return res;
}

// Send data to web service
dbTools.exchangeDataPost = function(blockId, data, onSuccess, onError) {
    log("exchangeDataPost(blockId=" + blockId  + ", data=" + JSON.stringify(data).substring(0, 500) +  ")");
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data) {
            if (onSuccess != undefined) {
                log("exchangeDataPost data sent");
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {if (onError != undefined) {onError("Ajax Post Error: " + url);}}
    });
}

dbTools.exchangeError = function(errorMsg) {
    log(errorMsg);
}

// Exchange data between app and web service
dbTools.exchange = function(onSuccess, onError) {
    log("exchange()");
    var blockId = dbTools.exchangeBlockIdGet(
        function(blockId) {
            dbTools.exchangeExport(blockId, 
                function(blockId) {
                    dbTools.exchangeImport(blockId, onSuccess, onError);
                },
                onError
            );
        },
        onError
    );
    for (var i = 0; i < dbTools.objectList.length; i++) {
        dbTools.objectList[i].needReloadData = true;
        if (dbTools.objectList[i].callback != undefined) {
            dbTools.objectList[i].callback();
        }
    }
}

dbTools.exchangeExport = function(blockId, onSuccess, onError) {
    log("----------------------------");
    log("exchangeExport(blockId=" + blockId + ")");
    dbTools.exchangeMailExport(blockId, 
        function(blockId) {
            var dataOut = [];
            dbTools.db.transaction(
                function(tx) {
                    tx.executeSql("SELECT irow, data FROM MailBlockDataOut WHERE blockId = ?", [blockId], function(tx, rs) {
                        for (var i = 0; i < rs.rows.length; i++) {
                            dataOut.push({"blockId":blockId, "irow":rs.rows.item(i)["irow"], "data":rs.rows.item(i)["data"]});
                        }
                        log("exchangeExport dataOut: " + JSON.stringify(dataOut).substring(0, 500));
                        dbTools.exchangeDataPost(blockId, dataOut, 
                            function(blockId, data) {
                                if (onSuccess != undefined) {
                                    onSuccess(blockId);
                                }
                            }, 
                            onError
                        );
                    });
                }, 
                function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}}
            );
        },
        onError
    );
}

dbTools.exchangeImport = function(blockId, onSuccess, onError) {
    log("----------------------------");
    log("exchangeImport(blockId=" + blockId + ")");
    
    dbTools.exchangeMailBlockDataIn(blockId,
        function(blockId) {
            dbTools.exchangeMailBlockDataInProc(blockId, 
                function(blockId) {
                    dbTools.exchangeMailImport(blockId, onSuccess, onError);
                }, 
                onError
            );
        },
        onError
    );
}

dbTools.exchangeMailExport = function(blockId, onSuccess, onError) {
    log("exchangeMailExport(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "INSERT INTO MailBlockDataOut(blockId, irow, data) VALUES(?, ?, ?)";
            tx.executeSql(sql, [blockId, 1, "@ExchParm:nodeId, exchDate"]);
            tx.executeSql(sql, [blockId, 2, nodeId + ", '" + dateToStr(new Date(), "YYYYMMDD HH:NN:SS:ZZZ") + "'"]);
            tx.executeSql(sql, [blockId, 3, "@ExtRef:refTypeId,refId,updateDate"]);
            var irow = 3;
            tx.executeSql("SELECT refTypeId, name FROM RefType WHERE dir < 0 AND parentId IS NULL AND IFNULL(sendAll, 0) = 0", [],
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var tblName = rs.rows.item(i)["name"];
                        var refTypeId = rs.rows.item(i)["refTypeId"];
                        var mailBlockDataOutInsert = function(tblName, refTypeId) {
                            var sql = "SELECT @1Id AS id, updateDate FROM @1";
                            sql = sql.replace(new RegExp("@1", "g"), tblName);
                            tx.executeSql(sql, [],
                                function(tx, rs) {
                                    for (var i = 0; i < rs.rows.length; i++) {
                                        irow++;
                                        var sql = "INSERT INTO MailBlockDataOut(blockId, irow, data) VALUES(?, ?, ?)";
                                        tx.executeSql(sql, [blockId, irow, "" + refTypeId + "," + rs.rows.item(i)["id"] + ",'" + rs.rows.item(i)["updateDate"] + "'"]);
                                    }
                                }
                            );
                        }
                        mailBlockDataOutInsert(tblName, refTypeId);
                    }
                }
            );
        },
        function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}


dbTools.exchangeMailBlockDataIn = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataIn(blockId=" + blockId + ")");
    
    var dataIn = dbTools.exchangeDataGet(blockId, 
        function(blockId, data) {
            dbTools.db.transaction(
                function(tx) {
                    $.each(data, function(i, item) {
                        tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [item.blockId, item.irow, item.data]);
                    });
                    log("exchangeMailBlockDataIn " + data.length + " rows inserted");
                },
                function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}},
                function() {if (onSuccess != undefined) {onSuccess(blockId);}}
            );
        },
        onError
    );
}

dbTools.exchangeMailBlockDataInProc = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProc(blockId=" + blockId + ")");
    
    dbTools.exchangeMailBlockDataInProcScriptExec(blockId,
        function(blockId) {
            dbTools.exchangeMailBlockDataInProcMailAdd(blockId, onSuccess, onError);
        },
        onError
    );
}

dbTools.exchangeMailBlockDataInProcScriptExec = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcScriptAdd(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "SELECT A.data FROM MailBlockDataIn A"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%') B"
                + " WHERE A.blockId = ? AND (B.irow IS NULL OR A.irow < B.irow) ORDER BY A.irow";
            tx.executeSql(sql, [blockId, blockId], function(tx, rs) {
                var sql = "";
                for (var i = 0; i < rs.rows.length; i++) {
                    var data = rs.rows.item(i)["data"];
                    var j;
                    if (data.charAt(0) === "@") {
                        j = data.indexOf(":");
                        var tblName = data.substring(1, j);
                        var tblFlds = data.substring(j + 1);
                        sql = "INSERT INTO " + tblName + "(" + tblFlds + ") SELECT @1 WHERE @2 NOT IN (SELECT versionId FROM " + tblName + ")";
                    } else {
                        j = data.indexOf(",");
                        var id = data.substring(0, j);
                        tx.executeSql(sql.replace("@1", data).replace("@2", id), []);
                    }
                }
                tx.executeSql("SELECT versionId, sql FROM Script WHERE versionId > (SELECT dataVersionId FROM Parm)", [], function(tx, rs) {
                    var errCode = 0;
                    for (var i = 0; (i < rs.rows.length) && (errCode === 0); i++) {
                        var versionId = rs.rows.item(i)["versionId"];
                        var sql = rs.rows.item(i)["sql"];
                        log(".." + sqlPrepare(sql));
                        tx.executeSql(sqlPrepare(sql), [], 
                            function(tx, rs) {
                                tx.executeSql("UPDATE Parm SET dataVersionId = ?", [versionId]);
                            }, 
                            function(tx, error) {
                                errCode = 1;
                            }
                        );
                    }
                });
            });
        },
        function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.exchangeMailBlockDataInProcMailAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailAdd(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT A.data FROM MailBlockDataIn A"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%') B"
                + " WHERE A.blockId = ? AND A.irow >= B.irow ORDER BY A.irow";
            tx.executeSql(sql, [blockId, blockId], function(tx, rs) {
                var sql = "";
                for (var i = 0; i < rs.rows.length; i++) {
                    var data = rs.rows.item(i)["data"];
                    var j;
                    if (data.charAt(0) === "@") {
                        j = data.indexOf(":");
                        var tblName = data.substring(1, j);
                        var tblFlds = data.substring(j + 1);
                        sql = "INSERT INTO Mail" + tblName + "(blockId," + tblFlds + ") VALUES(@1, @2)";
                    } else {
                        tx.executeSql(sql.replace("@1", blockId).replace("@2", data), []);
                    }
                }
            });
        },
        function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.exchangeMailImport = function(blockId, onSuccess, onError) {
    log("exchangeMailImport(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("DELETE FROM RefType", [], function(tx) {
                tx.executeSql("SELECT flds FROM MailRefType WHERE name = 'RefType'", [], function(tx, rs) {
                    var flds = rs.rows.item(0)["flds"];
                    var sql = "INSERT INTO RefType (@flds) SELECT @flds FROM MailRefType WHERE blockId = ?";
                    var sqlExec = sql.replace(new RegExp("@flds", "g"), flds);
                    tx.executeSql(sqlExec, [blockId], function(tx, rs) {
                        var sql = "SELECT refTypeId, name, flds FROM RefType WHERE dir < 0 and parentId iS NULL AND name <> 'RefType'";
                        tx.executeSql(sql, [], function(tx, rs) {
                            for (var i = 0; i < rs.rows.length; i++) {
                                var refTypeId = rs.rows.item(i)["refTypeId"];
                                var tblName = rs.rows.item(i)["name"];
                                var flds = rs.rows.item(i)["flds"];
                                var tableUpdate = function(tblName, refTypeId, flds) {
                                    var sql = "DELETE FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? AND B.updateDate>@tblName.updateDate)";
                                    var sqlExec = sql.replace(new RegExp("@tblName","g"), tblName);
                                    tx.executeSql(sqlExec, [blockId]);
                                    sql = "SELECT @tblNameId AS id FROM Mail@tblName WHERE blockId = ? AND @tblNameId NOT IN (SELECT @tblNameId FROM @tblName)";
                                    sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName);
                                    tx.executeSql(sqlExec, [blockId], function(tx, rs) {
                                        var idLst = [];
                                        for (var i = 0; i < rs.rows.length; i++) {
                                            idLst.push(rs.rows.item(i).id);
                                        }
                                        var sql = "INSERT INTO @tblName(@flds) SELECT @flds FROM Mail@tblName WHERE blockId=? AND @tblNameId IN (@idLst)";
                                        var sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName).replace(new RegExp("@flds", "g"), flds).replace(new RegExp("@idLst", "g"), idLst.join(","));
                                        tx.executeSql(sqlExec, [blockId], function(tx) {
                                            var sql = "SELECT name, flds FROM RefType WHERE dir<0 AND parentId=?";
                                            tx.executeSql(sql, [refTypeId], function(tx, rs){
                                                var sql = "INSERT INTO @dtlName(@dtlFlds) SELECT @dtlFlds FROM Mail@dtlName WHERE blockId=? AND @tblNameId IN (@idLst)";
                                                for (var i = 0; i < rs.rows.length; i++) {
                                                    var dtlName = rs.rows.item(i).name;
                                                    var dtlFlds = rs.rows.item(i).flds;
                                                    var sqlExec = sql.replace(new RegExp("@dtlName", "g"), dtlName).replace(new RegExp("@dtlFlds", "g"), dtlFlds).replace(new RegExp("@tblName", "g"), tblName).replace(new RegExp("@idLst", "g"), idLst.join(","));
                                                    tx.executeSql(sqlExec, [blockId]);
                                                }
                                            });
                                        });
                                    });
                                }
                                tableUpdate(tblName, refTypeId, flds);
                            }
                        });
                    });
                });
            });
        },
        function(error) {if (onError != undefined) {onError("SQLite error: " + error.message);}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}


//-------------------------------------------------
// test exhcange
//-------------------------------------------------

function testGetBlockId() {
    var blockId = dbTools.exchangeBlockIdGet(undefined, function(errMsg) {log(errMsg);});
    log("blockId: " + blockId);
}

function testGetData() {
    var data = dbTools.exchangeDataGet(130, undefined, function(errMsg) {log(errMsg);});
    log("Row count: " + data.length);
}

function testPostData() {
    var data = [{"blockId":130,"irow":1,"data":"@ExchParm:nodeId, exchDate","EntityKey":null},{"blockId":130,"irow":2,"data":"11,'20141001 13:00:00'","EntityKey":null}];
    dbTools.exchangeDataPost(130, data, undefined, function(errMsg) {log(errMsg);});
}

function testExchange() {
    dbTools.exchange(function() {log("----SUCCSESS----------------");}, function(errMsg) {log("----ERROR----" + errMsg);});
}

