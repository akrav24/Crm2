// Exchange begin (get blockId)
dbTools.exchangeBlockIdGet = function(onSuccess, onError) {
    var blockId = 0;
    var url = dbTools.serverUrl(serverName, port) + "Api/ExchangeStart/?nodeId=" + nodeId;
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            if (data.length !== 0) {
                blockId = data[0].blockId;
            }
            if (onSuccess !== undefined) {
                onSuccess(blockId);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (onError !== undefined) {
                onError("Ajax Get Error: " + url);
            }
        }
    });
    return blockId;
}

// Get data from web service
dbTools.exchangeDataGet = function(blockId, onSuccess, onError) {
    var res = [];
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            res = data;
            if (onSuccess !== undefined) {
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (onError !== undefined) {
                onError("Ajax Get Error: " + url);
            }
        }
    });
    return res;
}

// Send data to web service
dbTools.exchangeDataPost = function(blockId, data, onSuccess, onError) {
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data) {
            if (onSuccess !== undefined) {
                log("exchangeDataPost data sent");
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (onError !== undefined) {
                onError("Ajax Post Error: " + url);
            }
        }
    });
}

dbTools.exchangeError = function(errorMsg) {
    log(errorMsg);
}

// Exchange data between app and web service
dbTools.exchange = function(nodeId, onSuccess, onError) {
    var blockId = dbTools.exchangeBlockIdGet(
        function(blockId) {
            dbTools.exchangeExport(blockId, 
                function(blockId) {
                    dbTools.exchangeImport(blockId);
                }
            );
        },
        function(errorMsg) {
            if (onError !== undefined) {
                onError(errorMsg);
            }
        }
    );
    
}

dbTools.exchangeExport = function(blockId, onSuccess, onError) {
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
                        log("exchangeExport dataOut: " + JSON.stringify(dataOut));
                        // TODO: uncomment
                        /*dbTools.exchangeDataPost(blockId, dataOut, 
                            function(blockId, data) {
                                if (onSuccess !== undefined) {
                                    onSuccess(blockId);
                                }
                            }, 
                            function(msg) {
                                if (onError !== undefined) {
                                    onError(msg);
                                }
                            }
                        );*/
                    });
                }, 
                function(error) {
                    dbTools.onTransError;
                    if (onError !== undefined) {
                        onError("SQLite error: " + error.message);
                    }
                }
            );
        }
    );
}

dbTools.exchangeImport = function(blockId, onSuccess, onError) {
    log("exchangeImport(blockId=" + blockId + ")");
    
    // TODO:
    /*dbTools.exchangeMailBlockDataIn(blockId
    );
    */
    /*var dataIn = dbTools.exchangeDataGet(blockId);
    log("insert into MailBlockDataIn begin");
    dbTools.db.transaction(
        function(tx) {
            $.each(dataIn, function(i, item) {
                tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [item.blockId, item.irow, item.data]
                    , function(tx, rs) {if (i === dataIn.length - 1) {log("insert into MailBlockDataIn done: " + dataIn.length)}}
                );
            });
        },
        function(error) {
            dbTools.onTransError;
            if (onError !== undefined) {
                onError("SQLite error: " + error.message);
            }
        }
    );
    */
    /*dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT data FROM MailBlockDataIn WHERE blockId = ? ORDER BY blockId, irow", [blockId], function(tx, rs) {
            var stage = 0, cmdBgn = "";
            for (var i = 0; i < rs.rows.length; i++) {
                var data = rs.rows.item(i)["data"];
                if (data.charAt(0) == "@") {
                    var j = tail.indexOf(":");
                    if (j >= 0) {
                        var tblName = tail.substring(1, j);
                        var tblFlds = tail.substring(j + 1);
                    } else {
                        var tblName = tail;
                        var tblFlds = "";
                    }
                    if (tblName.tolowerCase() == "script") {
                        stage = 1;
                        cmdBgn = "insert into #tmpScript(" + tblFlds + ") values("
                    } else {
                        
                    }
                } else {
                    
                }
            }
        });
    });
    */
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
                        var sql = "SELECT @1, @2, updateDate FROM @3";
                        var tblName = rs.rows.item(i)["name"];
                        var refTypeIdName = rs.rows.item(i)["refTypeId"];
                        var refIdName = rs.rows.item(i)["name"] + "Id";
                        sql = sql.replace("@1", refTypeIdName).replace("@2", refIdName).replace("@3", tblName);
                        tx.executeSql(sql, [],
                            function(tx, rs) {
                                for (var i = 0; i < rs.rows.length; i++) {
                                    irow++;
                                    tx.executeSql(sql, [blockId, irow, "" + rs.rows.item(i)[refTypeIdName] + "," + rs.rows.item(i)[refIdName] + ",'" + rs.rows.item(i)["updateDate"] + "'"]);
                                }
                            }
                        );
                    }
                }
            );
        },
        function(error) {
            dbTools.onTransError;
            if (onError !== undefined) {
                onError("SQLite error: " + error.message);
            }
        },
        function() {
            if (onSuccess !== undefined) {
                onSuccess(blockId);
            }
        }
    );
}


dbTools.exchangeMailBlockDataIn = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataIn(blockId=" + blockId + ")");
    
    var dataIn = dbTools.exchangeDataGet(blockId, 
        function(data) {
            log("insert into MailBlockDataIn begin");
            dbTools.db.transaction(
                function(tx) {
                    $.each(data, function(i, item) {
                        tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [item.blockId, item.irow, item.data]
                            , function(tx, rs) {if (i === dataIn.length - 1) {log("insert into MailBlockDataIn done: " + data.length)}}
                        );
                    });
                },
                function(error) {
                    dbTools.onTransError;
                    if (onError !== undefined) {
                        onError("SQLite error: " + error.message);
                    }
                },
                function() {
                    if (onSuccess !== undefined) {
                        onSuccess(blockId);
                    }
                }
            );
        },
        function(msg) {
            if (onError !== undefined) {
                onError(msg);
            }
        }
    );
}


//-------------------------------------------------
// test exhcange
//-------------------------------------------------

function testGetBlockId() {
    var blockId = dbTools.exchangeBlockIdGet(undefined, function(errMsg) {log(errMsg)});
    log("blockId: " + blockId);
}

function testGetData() {
    var data = dbTools.exchangeDataGet(130);
    log("Row count: " + data.length);
}

function testPostData() {
    var data = [{"blockId":130,"irow":1,"data":"@ExchParm:nodeId, exchDate","EntityKey":null},{"blockId":130,"irow":2,"data":"11,'20141001 13:00:00'","EntityKey":null}];
    dbTools.exchangeDataPost(130, data);
}

function testExchange() {
    dbTools.exchange(nodeId);
}

