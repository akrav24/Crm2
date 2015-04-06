// Exchange data between app and web service
dbTools.exchange = function(onSuccess, onError, onProgress) {
    log("----------------------------");
    log("exchange()");
    if (onProgress != undefined) {onProgress(1);}
    if (settings.nodeId > 0) {
        if (dbTools.checkConnection()) {
            for (var i = 0; i < dbTools.objectList.length; i++) {
                dbTools.objectList[i].needReloadData = true;
                if (dbTools.objectList[i].callback != undefined) {
                    dbTools.objectList[i].callback();
                }
            }
            var blockId = dbTools.exchangeBlockIdGet(
                function(blockId) {
                    dbTools.exchangeExport(blockId, 
                        function(blockId) {
                            dbTools.exchangeImport(blockId, 
                                function(blockId) {
                                    dbTools.exchangeDelMailBlockData(blockId, 
                                        function(blockId) {
                                            if (onProgress != undefined) {onProgress();}
                                            if (onSuccess != undefined) {onSuccess(blockId);}
                                            logSqlResult("select * from parm");
                                        }, 
                                        onError/*, 
                                        onProgress*/
                                    );
                                },
                                onError,
                                onProgress
                            );
                        },
                        onError,
                        onProgress
                    );
                },
                onError
            );
        } else {
            var errMsg = "Отсутствует соединение с сетью передачи данных";
            log(errMsg);
            if (onError != undefined) {onError(errMsg);}
        }
    } else {
        var errMsg = "Не установлен код узла";
        log(errMsg);
        if (onError != undefined) {onError(errMsg);}
    }
}

// Exchange. Send data to web service
dbTools.exchangeExport = function(blockId, onSuccess, onError, onProgress) {
    log("----------------------------");
    log("exchangeExport(blockId=" + blockId + ")");
    if (onProgress != undefined) {onProgress();}
    dbTools.exchangeMailExport(blockId, 
        function(blockId) {
            var dataOut = [];
            dbTools.db.transaction(
                function(tx) {
                    tx.executeSql("SELECT irow, data FROM MailBlockDataOut WHERE blockId = ?", [blockId], function(tx, rs) {
                        for (var i = 0; i < rs.rows.length; i++) {
                            dataOut.push({"blockId":blockId, "irow":rs.rows.item(i)["irow"], "data":rs.rows.item(i)["data"]});
                        }
                        /*log("exchangeExport dataOut: " + JSON.stringify(dataOut).substring(0, 500));*/
                        dbTools.exchangeDataPost(blockId, dataOut, 
                            function(blockId, data) {
                                // TODO: get datetime from server
                                settings.exchange.dataOutDateSend = new Date();
                                dbTools.db.transaction(
                                    function(tx) {
                                        dbTools.sqlInsertUpdate(tx, "Parm", ["nodeId"], ["exchDataToOfficeSent"], [settings.nodeId], [dateToSqlDate(settings.exchange.dataOutDateSend)], undefined, onError);
                                    },
                                    function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}}
                                );
                                if (onSuccess != undefined) {onSuccess(blockId);}
                            }, 
                            onError
                        );
                    });
                }, 
                function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}}
            );
        },
        onError
    );
}

// Exchange. Receive data from web service
dbTools.exchangeImport = function(blockId, onSuccess, onError, onProgress) {
    log("----------------------------");
    log("exchangeImport(blockId=" + blockId + ")");
    if (onProgress != undefined) {onProgress();}
    
    dbTools.exchangeMailBlockDataIn(blockId,
        function(blockId) {
            dbTools.exchangeMailBlockDataInProc(blockId, 
                function(blockId) {
                    dbTools.exchangeMailImportParm(blockId, 
                        function(blockId) {
                            dbTools.exchangeMailImportDelete(blockId, 
                                function(blockId) {
                                    dbTools.exchangeMailImport(blockId, 
                                        function(blockId) {
                                            settings.exchange.dataInDateReceive = new Date();
                                            dbTools.db.transaction(
                                                function(tx) {
                                                    dbTools.sqlInsertUpdate(tx, "Parm", ["nodeId"], ["exchDataFromOfficeReceived"], [settings.nodeId], [dateToSqlDate(settings.exchange.dataInDateReceive)], undefined, onError);
                                                },
                                                function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}}
                                            );
                                            if (onSuccess != undefined) {onSuccess(blockId);}
                                        },
                                        onError
                                    );
                                    dbTools.getAllImages(blockId, function() {log("----Get images success");}, function(errMsg) {log("----Get images error: " + errMsg);});
                                }, 
                                onError
                            );
                        }, 
                        onError
                    );
                }, 
                onError,
                onProgress
            );
        },
        onError
    );
}

// Exchange. Delete MailBlockData
dbTools.exchangeDelMailBlockData = function(blockId, onSuccess, onError, onProgress) {
    log("----------------------------");
    log("exchangeDelMailBlockData(blockId=" + blockId + ")");
    if (onProgress != undefined) {onProgress();}
    
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("DELETE FROM MailBlockDataOut", [],
                function(tx, rs) {
                    tx.executeSql("DELETE FROM MailBlockDataIn", [], 
                        function(tx, rs) {
                            if (onSuccess != undefined) {onSuccess(blockId);}
                        }
                    );
                }
            );
        }, 
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}}
    );
}

dbTools.exchangeMailExport = function(blockId, onSuccess, onError) {
    log("exchangeMailExport(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "INSERT INTO MailBlockDataOut(blockId, irow, data) VALUES(?, ?, ?)";
            tx.executeSql(sql, [blockId, 1, "@ExchParm:nodeId, exchDate"]);
            tx.executeSql(sql, [blockId, 2, settings.nodeId + ", '" + dateToStr(new Date(), "YYYYMMDD HH:NN:SS:ZZZ") + "'"]);
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
                                        var data = "" + refTypeId + "," + rs.rows.item(i)["id"] + ",";
                                        if (rs.rows.item(i)["updateDate"] == null){
                                            data += "null";
                                        } else {
                                            data += "'" + rs.rows.item(i)["updateDate"] + "'"
                                        }
                                        tx.executeSql(sql, [blockId, irow, data]);
                                    }
                                }
                            );
                        }
                        mailBlockDataOutInsert(tblName, refTypeId);
                    }
                }
            );
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}


dbTools.exchangeMailBlockDataIn = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataIn(blockId=" + blockId + ")");
    
    dbTools.exchangeDataGet(blockId, 
        function(blockId, data) {
            dbTools.db.transaction(
                function(tx) {
                    $.each(data, function(i, item) {
                        tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [item.blockId, item.irow, item.data]);
                        /*if (item.irow == 9006 || item.irow >= 14500 && item.irow <= 14524) {
                            //log(JSON.stringify(item));
                            log("blockId=" + item.blockId + ", irow=" + item.irow + ", data=" + item.data);
                        }*/
                    });
                    /*log("exchangeMailBlockDataIn " + data.length + " rows inserted");*/
                },
                function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
                function() {if (onSuccess != undefined) {onSuccess(blockId);}}
            );
        },
        onError
    );
}

dbTools.exchangeMailBlockDataInProc = function(blockId, onSuccess, onError, onProgress) {
    log("exchangeMailBlockDataInProc(blockId=" + blockId + ")");
    if (onProgress != undefined) {onProgress();}
    
    dbTools.exchangeMailBlockDataInProcScriptExec(blockId,
        function(blockId) {
            dbTools.exchangeMailBlockDataInProcMailAdd(blockId, onSuccess, onError);
        },
        onError
    );
}

dbTools.exchangeMailBlockDataInProcScriptExec = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcScriptExec(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT dataVersionId FROM Parm WHERE nodeId = ?", [settings.nodeId],
                function(tx, rs) {
                    var dataVersionId = 0;
                    if (rs.rows.length > 0) {
                        dataVersionId = rs.rows.item(0).dataVersionId;
                    }
                    var sql = "SELECT A.data FROM MailBlockDataIn A"
                        + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%') SB"
                        + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%')) SE"
                        + " WHERE A.blockId = ? AND A.irow >= SB.irow AND (SE.irow IS NULL OR A.irow < SE.irow) ORDER BY A.irow";
                    tx.executeSql(sql, [blockId, blockId, blockId, blockId], 
                        function(tx, rs) {
                            if (rs.rows.length > 1) {
                                if (rs.rows.item(0).data.charAt(0) === "@") {
                                    var data = rs.rows.item(0).data;
                                    var j = data.indexOf(":");
                                    var tblName = data.substring(1, j);
                                    var tblFlds = data.substring(j + 1);
                                    var scriptSql = "INSERT INTO " + tblName + "(" + tblFlds + ") SELECT @1 WHERE @2 NOT IN (SELECT versionId FROM " + tblName + ")";
                                    
                                    var execScriptSql = function(recSet, i, scriptSql, execScriptSql) {
                                        var data = recSet.rows.item(i).data;
                                        j = data.indexOf(",");
                                        var id = data.substring(0, j);
                                        var sql = data.substring(j + 1).substring(1);
                                        sql = sql.substring(0, sql.length - 1);
                                        if (id > dataVersionId) {
                                            tx.executeSql(sqlPrepare(sql), [], 
                                                function(tx, rs) {
                                                    tx.executeSql("UPDATE Parm SET dataVersionId = ?", [id],
                                                        function(tx, rs) {
                                                            tx.executeSql(scriptSql.replace("@1", data).replace("@2", id), [],
                                                                function(tx, rs) {
                                                                    if (i < recSet.rows.length - 1) {
                                                                        execScriptSql(recSet, ++i, scriptSql, execScriptSql);
                                                                    } else {
                                                                        if (onSuccess != undefined) {onSuccess(blockId);}
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            );
                                        } else {
                                            if (i < recSet.rows.length - 1) {
                                                execScriptSql(recSet, ++i, scriptSql, execScriptSql);
                                            } else {
                                                if (onSuccess != undefined) {onSuccess(blockId);}
                                            }
                                        }
                                        
                                    }
                                    
                                    execScriptSql(rs, 1, scriptSql, execScriptSql);
                                }
                            }
                        }
                    );
                }
            );
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}}
    );
}

dbTools.exchangeMailBlockDataInProcMailAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailAdd(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT A.data FROM MailBlockDataIn A"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%') SB"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%')) SE"
                + " WHERE A.blockId = ? AND (SB.irow IS NULL OR A.irow < SB.irow OR A.irow >= SE.irow) ORDER BY A.irow";
            tx.executeSql(sql, [blockId, blockId, blockId, blockId], function(tx, rs) {
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
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.exchangeMailImportParm = function(blockId, onSuccess, onError) {
    log("exchangeMailImportParm(blockId=" + blockId + ")");
    
    var exchDate = null;
    dbTools.db.transaction(
        function(tx) {
            var sql = "SELECT exchDate FROM MailExchParm WHERE blockId=?";
            tx.executeSql(sql, [blockId], function(tx, rs) {
                if (rs.rows.length > 0) {
                    exchDate = rs.rows.item(0).exchDate;
                    var sql = "UPDATE Parm SET exchDataFromOfficeSent = ?";
                    tx.executeSql(sql, [exchDate]);
                    settings.exchange.dataInDateSend = sqlDateToDate(exchDate);
                }
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
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
                                    var sql = "SELECT group_concat(@tblNameId) AS idLst FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? AND B.updateDate>@tblName.updateDate)";
                                    var sqlExec = sql.replace(new RegExp("@tblName","g"), tblName);
                                    tx.executeSql(sqlExec, [blockId], function(tx, rs) {
                                        if (rs.rows.length > 0) {
                                            var idLst = rs.rows.item(0).idLst;
                                            if (idLst != null) {
                                                sqlExec = "SELECT name FROM refType WHERE parentId = ?";
                                                tx.executeSql(sqlExec, [refTypeId], function(tx, rs) {
                                                    for (var i = 0; i < rs.rows.length; i++) {
                                                        var delTblName = rs.rows.item(i).name;
                                                        sql = "DELETE FROM @delTblName WHERE @tblNameId IN (@idLst)";
                                                        sqlExec = sql.replace(new RegExp("@delTblName","g"), delTblName).replace(new RegExp("@tblName","g"), tblName).replace(new RegExp("@idLst","g"), idLst);
                                                        tx.executeSql(sqlExec, []);
                                                    }
                                                });
                                            }
                                        }
                                    });
                                    
                                    sql = "DELETE FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? AND B.updateDate>@tblName.updateDate)";
                                    sqlExec = sql.replace(new RegExp("@tblName","g"), tblName);
                                    tx.executeSql(sqlExec, [blockId]);
                                    
                                    sql = "SELECT @tblNameId AS id FROM Mail@tblName WHERE blockId = ? AND @tblNameId NOT IN (SELECT @tblNameId FROM @tblName)";
                                    sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName);
                                    tx.executeSql(sqlExec, [blockId], function(tx, rs) {
                                        if (rs.rows.length > 0) {
                                            var idLst = [];
                                            for (var i = 0; i < rs.rows.length; i++) {
                                                if (rs.rows.item(i).id != null) {
                                                    idLst.push(rs.rows.item(i).id);
                                                }
                                            }
                                            if (idLst.length === 0) {
                                                idLst.push(0);
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
                                        }
                                    });
                                }
                                
                                tableUpdate(tblName, refTypeId, flds);
                            }
                        });
                    });
                });
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.exchangeMailImportDelete = function(blockId, onSuccess, onError) {
    log("exchangeMailImportDelete(blockId=" + blockId + ")");
    //logSqlResult("SELECT D.refTypeId, RT.name, COUNT(*) AS cnt FROM MailToDelete D LEFT JOIN RefType RT ON D.refTypeId = RT.refTypeId WHERE D.blockId=" + blockId + " GROUP BY D.refTypeId, RT.name");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "SELECT RT.name, group_concat(D.refId) AS refIdLst FROM MailToDelete D INNER JOIN RefType RT ON D.refTypeId = RT.refTypeId WHERE D.blockId=? GROUP BY RT.parentId, D.refTypeId, RT.name ORDER BY RT.parentId DESC, D.refTypeId";
            tx.executeSql(sql, [blockId], function(tx, rs) {
                var sql = "DELETE FROM @tblName WHERE @fldName IN (@refIdLst)";
                for (var i = 0; i < rs.rows.length; i++) {
                    var tblName = rs.rows.item(i).name;
                    var fldName = tblName + "Id";
                    var refIdLst = rs.rows.item(i).refIdLst;
                    var sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName).replace(new RegExp("@fldName", "g"), fldName).replace(new RegExp("@refIdLst", "g"), refIdLst);
                    log("..DEL: " + tblName + ", " + fldName + " in (" + refIdLst + ")");
                    tx.executeSql(sqlExec, []);
                }
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.getAllImages = function(blockId, onSuccess, onError) {
    log("getAllImages()");
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileId FROM Planogram", [], 
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var fileDownload = function(blockId, fileId, isLastFile) {
                            dbTools.exchangeDataFileByIdDownload(blockId, fileId,
                                function(blockId, fileId, fileEntry) {
                                    //log("File downloaded: " + fileEntry.fullPath);
                                    if (isLastFile) {
                                        if (onSuccess != undefined) {onSuccess()}
                                    }
                                }, 
                                function(errMsg) {if (onError != undefined) {onError(errMsg)}}
                            );
                        }
                        fileDownload(blockId, rs.rows.item(i)["fileId"], (i === rs.rows.length - 1));
                    }
                },
                function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
            );
        }, 
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
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
    dbTools.exchangeDataGet(130, function(blockId, data) {log("Row count: " + data.length);}, function(errMsg) {log(errMsg);});
}

function testPostData() {
    var data = [{"blockId":130,"irow":1,"data":"@ExchParm:nodeId, exchDate","EntityKey":null},{"blockId":130,"irow":2,"data":"11,'20141001 13:00:00'","EntityKey":null}];
    dbTools.exchangeDataPost(130, data, undefined, function(errMsg) {log(errMsg);});
}

function testExchange() {
    dbTools.exchange(function() {log("----SUCCSESS----------------");}, function(errMsg) {log("----ERROR----" + errMsg);});
}

