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
                                            dbTools.exchangeFileImport(blockId,
                                                function(blockId) {
                                                    if (onProgress != undefined) {onProgress();}
                                                    if (onSuccess != undefined) {onSuccess(blockId);}
                                                    logSqlResult(undefined, "select * from parm");
                                                },
                                                onError
                                            );
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
        function(blockId, data) {
            var dataOut = [];
            dbTools.db.transaction(
                function(tx) {
                    tx.executeSql("SELECT rowid AS irow, data FROM MailBlockDataOut WHERE blockId = ? ORDER BY rowid", [blockId], function(tx, rs) {
                        var irow = 0;
                        for (var i = 0; i < rs.rows.length; i++) {
                            dataOut.push({"blockId":blockId, "irow":rs.rows.item(i)["irow"], "data":rs.rows.item(i)["data"]});
                            if (rs.rows.item(i).irow > irow) {
                                irow = rs.rows.item(i).irow;
                            }
                        }
                        if (!!data) {
                            for (var i = 0; i < data.length; i++) {
                                irow++;
                                dataOut.push({"blockId": blockId, "irow": irow, "data": data[i].data});
                            }
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
                                    //dbTools.getAllImages(blockId, function() {log("----Get images success");}, function(errMsg) {log("----Get images error: " + errMsg);});
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
                            tx.executeSql("DELETE FROM MailToDelete", [], 
                                function(tx, rs) {
                                    if (onSuccess != undefined) {onSuccess(blockId);}
                                }
                            );
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
            var sql = "INSERT INTO MailBlockDataOut(blockId, data) VALUES(?, ?)";
            tx.executeSql(sql, [blockId, "@ExchParm:nodeId, exchDate"]);
            tx.executeSql(sql, [blockId, settings.nodeId + ", '" + dateToStr(new Date(), "YYYYMMDD HH:NN:SS:ZZZ") + "'"]);
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {dbTools.exchangeMailExportExtRef(blockId, onSuccess, onError);}
    );
}
 
dbTools.exchangeMailExportExtRef = function(blockId, onSuccess, onError) {
    log("exchangeMailExportExtRef(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "INSERT INTO MailBlockDataOut(blockId, data) VALUES(?, ?)";
            tx.executeSql(sql, [blockId, "@ExtRef:refTypeId,refId,updateDate"]);
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
                                        var sql = "INSERT INTO MailBlockDataOut(blockId, data) VALUES(?, ?)";
                                        var data = "" + refTypeId + "," + rs.rows.item(i)["id"] + ",";
                                        if (rs.rows.item(i)["updateDate"] == null) {
                                            data += "null";
                                        } else {
                                            data += "'" + rs.rows.item(i)["updateDate"] + "'"
                                        }
                                        tx.executeSql(sql, [blockId, data]);
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
        function() {dbTools.exchangeMailExportLocalData(blockId, onSuccess, onError);}
    );
}

dbTools.exchangeMailExportLocalData = function(blockId, onSuccess, onError) {
    log("exchangeMailExportLocalData(blockId=" + blockId + ")");
    
    // TODO: заполнить данные для таблицы mail.ToDelete (пример в ХП mail.Export)
    
    dbTools.db.transaction(
        function(tx) {
            var sqlMain = "INSERT INTO MailBlockDataOut(blockId, data) VALUES(?, ?)";
            // список таблиц верхнего уровня
            tx.executeSql("SELECT refTypeId, name, IFNULL(sendAll, 0) AS sendAll, flds FROM RefType WHERE dir > 0 AND parentId IS NULL AND name <> 'FileOut'", [],
                function(tx, tblRs) {
                    // функция обработки таблицы верхнего уровня и подчиненных ей таблиц
                    var exportTbl = function(blockId, tx, tblRs, tblIndex) {
                        if (tblIndex < tblRs.rows.length) {
                            var tblRefTypeId = tblRs.rows.item(tblIndex).refTypeId, 
                                tblName = tblRs.rows.item(tblIndex).name, 
                                tblSendAll = tblRs.rows.item(tblIndex).sendAll,
                                tblFlds = tblRs.rows.item(tblIndex).flds
                            // формирование данных из таблицы верхнего уровня
                            tx.executeSql(sqlMain, [blockId, "@" + tblName + ":" + tblFlds]);
                            var tblSql = "";
                            if (tblSendAll != 0) {
                                tblSql = "INSERT INTO MailBlockDataOut(blockId, data)"
                                    + "  SELECT @blockId AS blockId, data"
                                    + "  FROM"
                                    + "    (SELECT @vals AS data "
                                    + "      FROM @tblName A"
                                    + "    ) A";
                            } else {
                                tblSql = "INSERT INTO MailBlockDataOut(blockId, data)"
                                    + "  SELECT @blockId AS blockId, data"
                                    + "  FROM"
                                    + "    (SELECT @vals AS data"
                                    + "      FROM @tblName A"
                                    + "      LEFT JOIN ExtRef B ON B.refTypeId = @refTypeId AND B.refId = A.@tblNameId"
                                    + "      WHERE (B.refId IS NULL OR SUBSTR(A.updateDate,1, 17) > SUBSTR(B.updateDate, 1, 17)) @filter"
                                    + "    ) A";
                            }
                            var sqlFilter = "";
                            if (tblName.toLowerCase() == "visit") {
                                sqlFilter += " AND A.timeEnd IS NOT NULL"
                            }
                            tblSql = tblSql.replace(/@tblName/g, tblName).replace(/@refTypeId/g, tblRefTypeId).replace(/@blockId/g, blockId).replace(/@filter/g, sqlFilter);
                            dbTools.tableFieldValueListSqlGet(tx, tblName, "A.", 
                                function(tx, tableName, fieldValueListSql) {
                                    tblSql = tblSql.replace(/@vals/g, fieldValueListSql);
                                    tx.executeSql(tblSql, [], 
                                        function(tx) {
                                            // список подчиненных таблиц
                                            tx.executeSql("SELECT name, flds FROM RefType WHERE dir > 0 AND parentId = ? ORDER BY lvl", [tblRefTypeId], 
                                                function(tx, dtlRs) {
                                                    // функция обработки подчиненной таблицы
                                                    var exportDtlTbl = function(blockId, tx, dtlRs, dtlIndex, tblName, tblRefTypeId, sqlFilter) {
                                                        if (dtlIndex < dtlRs.rows.length) {
                                                            var dtlName = dtlRs.rows.item(dtlIndex).name, 
                                                                dtlFlds = dtlRs.rows.item(dtlIndex).flds
                                                            // формирование данных из подчиненной таблицы
                                                            tx.executeSql(sqlMain, [blockId, "@" + dtlName + ":" + dtlFlds]);
                                                            var dtlSql = "INSERT INTO MailBlockDataOut(blockId, data)"
                                                                + "  SELECT @blockId AS blockId, data"
                                                                + "  FROM"
                                                                + "    (SELECT @vals AS data"
                                                                + "      FROM @tblName A"
                                                                + "      INNER JOIN @dtlName D ON D.@tblNameId = A.@tblNameId"
                                                                + "      LEFT JOIN ExtRef B ON B.refTypeId = @refTypeId AND B.refId = A.@tblNameId"
                                                                + "      WHERE (B.refId IS NULL OR SUBSTR(A.updateDate,1, 17) > SUBSTR(B.updateDate, 1, 17)) @filter"
                                                                + "    ) A";
                                                            dtlSql = dtlSql.replace(/@tblName/g, tblName).replace(/@dtlName/g, dtlName).replace(/@refTypeId/g, tblRefTypeId).replace(/@blockId/g, blockId).replace(/@filter/g, sqlFilter);
                                                            dbTools.tableFieldValueListSqlGet(tx, dtlName, "D.", 
                                                                function(tx, tableName, fieldValueListSql) {
                                                                    dtlSql = dtlSql.replace(/@vals/g, fieldValueListSql);
                                                                    tx.executeSql(dtlSql, [], 
                                                                        function(tx) {
                                                                            // обработка следующей подчиненной таблицы
                                                                            exportDtlTbl(blockId, tx, dtlRs, ++dtlIndex, tblName, tblRefTypeId, sqlFilter);
                                                                        }
                                                                    );
                                                                    
                                                                }
                                                            );
                                                        } else {
                                                            // обработка следующей таблицы верхнего уровня и подчиненных ей таблиц
                                                            exportTbl(blockId, tx, tblRs, ++tblIndex);
                                                        }
                                                    }
                                                    
                                                    // обработка первой подчиненной таблицы
                                                    exportDtlTbl(blockId, tx, dtlRs, 0, tblName, tblRefTypeId, sqlFilter);
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                            
                        }
                    }
                    
                    // обработка первой таблицы верхнего уровня и подчиненных ей таблиц
                    exportTbl(blockId, tx, tblRs, 0);
                }
            );
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {dbTools.exchangeMailExportLocalFileOut(blockId, onSuccess, onError);}
    );
}

dbTools.exchangeMailExportLocalFileOut = function(blockId, onSuccess, onError) {
    log("exchangeMailExportLocalFileOut(blockId=" + blockId + ")");
    
    var data = [];
    var idRs = {};
    idRs.rows = {length: 0};
    var tblName = "", 
        tblFlds = "",
        tblVals = "";
    
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT refTypeId, name, IFNULL(sendAll, 0) AS sendAll, flds FROM RefType WHERE dir > 0 AND name = 'FileOut'", [],
                function(tx, tblRs) {
                    if (tblRs.rows.length > 0) {
                        var tblRefTypeId = tblRs.rows.item(0).refTypeId;
                        tblName = tblRs.rows.item(0).name;
                        tblFlds = tblRs.rows.item(0).flds;
                        data.push({data: "@" + tblName + ":" + tblFlds});
                        var tblSql = "SELECT A.@tblNameId AS id"
                            + "  FROM @tblName A"
                            + "  LEFT JOIN ExtRef B ON B.refTypeId = @refTypeId AND B.refId = A.@tblNameId"
                            + "  WHERE (B.refId IS NULL OR SUBSTR(A.updateDate,1, 17) > SUBSTR(B.updateDate, 1, 17))";
                        tblSql = tblSql.replace(/@tblName/g, tblName).replace(/@refTypeId/g, tblRefTypeId);
                        dbTools.tableFieldValueListSqlGet(tx, tblName, "A.", 
                            function(tx, tableName, fieldValueListSql) {
                                tblVals = fieldValueListSql;
                            }
                        );
                        tx.executeSql(tblSql, [], function(tx, rs) {
                            idRs = rs;
                        });
                    }
                }
            );
        },
        function(error) {if (!!onError) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {
            var bulkInsert = function(idRs, data, begIndex, onSuccess, onError) {
                var bulkCnt = settings.fileBulkRecordCount;
                var endIndex = begIndex + bulkCnt < idRs.rows.length ? begIndex + bulkCnt : idRs.rows.length;
                log("......bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                var sql = "SELECT @vals AS data "
                                    + "  FROM @tblName A"
                                    + "  WHERE A.@tblNameId=@id";
                                sql = sql.replace(/@vals/g, tblVals).replace(/@tblName/g, tblName).replace(/@id/g, idRs.rows.item(i).id);
                                tx.executeSql(sql, [], function(tx, rs) {
                                    if (rs.rows.length > 0) {
                                        data.push({data: rs.rows.item(0).data});
                                    }
                                });
                            }
                        },
                        function(error) {
                            log("..exchangeMailExportLocalFileOut bulkInsert ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("......bulkInsert: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            bulkInsert(idRs, data, endIndex, onSuccess, onError);
                        }
                    );
                } else {
                    if (!!onSuccess) {onSuccess(blockId, data);}
                }
            }
            bulkInsert(idRs, data, 0, onSuccess, onError);
        }
    );
}

/*dbTools.exchangeMailBlockDataIn = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataIn(blockId=" + blockId + ")");
    
    dbTools.exchangeDataGet(blockId, 
        function(blockId, data) {
            log("..exchangeMailBlockDataIn: insert into MailBlockDataIn begin");
            
            var bulkInsert = function(blockId, data, begIndex, bulkCnt, onSuccess, onError) {
                var endIndex = begIndex + bulkCnt < data.length ? begIndex + bulkCnt : data.length;
                log("....bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [data[i].blockId, data[i].irow, data[i].data]);
                            }
                        },
                        function(error) {
                            log("..exchangeMailBlockDataIn ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("..exchangeMailBlockDataIn: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            bulkInsert(blockId, data, endIndex, bulkCnt, onSuccess, onError);
                        }
                    );
                } else {
                    if (onSuccess != undefined) {onSuccess(blockId);}
                }
            }
            
            bulkInsert(blockId, data, 0, settings.bulkRecordCount, onSuccess, onError);
        },
        onError
    );
}
*/
dbTools.exchangeMailBlockDataIn = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataIn(blockId=" + blockId + ")");
    
    dbTools.exchangeDataGet(blockId, 
        function(blockId, data) {
            log("..exchangeMailBlockDataIn: insert into MailBlockDataIn begin");
            
            var bulkRecordCountGet = function(data) {
                var result = settings.bulkRecordCount;
                if (data.toLowerCase().substring(0, 5) == "@file") {
                    result = settings.fileBulkRecordCount;
                }
                return result;
            }
            
            var bulkInsert = function(blockId, data, begIndex, bulkCnt, onSuccess, onError) {
                var endIndex = begIndex + bulkCnt < data.length ? begIndex + bulkCnt : data.length;
                log("......bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                if (i > begIndex && data[i].data != null && data[i].data.substring(0, 1) == "@") {
                                    endIndex = i;
                                } else {
                                    tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [data[i].blockId, data[i].irow, data[i].data]);
                                }
                            }
                        },
                        function(error) {
                            log("..exchangeMailBlockDataIn bulkInsert ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("......bulkInsert: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            if ((endIndex >= data.length) || (data[endIndex].data != null && data[endIndex].data.substring(0, 1) == "@")) {
                                blockInsert(blockId, data, endIndex, onSuccess, onError);
                            } else {
                                bulkInsert(blockId, data, endIndex, bulkCnt, onSuccess, onError);
                            }
                        }
                    );
                } else {
                    blockInsert(blockId, data, begIndex, onSuccess, onError);
                }
            }
            
            var blockInsert = function(blockId, data, begIndex, onSuccess, onError) {
                log("....blockInsert begIndex=" + begIndex + ", data[" + begIndex +"].data=" + (begIndex < data.length ? (data[begIndex].data != null ? "'" + data[begIndex].data.substring(0, 10) + "...'" : "null") : "<<End of data>>"));
                if (begIndex < data.length) {
                    var bulkCnt = bulkRecordCountGet(data[begIndex].data);
                    bulkInsert(blockId, data, begIndex, bulkCnt, onSuccess, onError);
                } else {
                    if (onSuccess != undefined) {onSuccess(blockId);}
                }
            }
            
            blockInsert(blockId, data, 0, onSuccess, onError);
        },
        onError
    );
}

dbTools.exchangeMailBlockDataInProc = function(blockId, onSuccess, onError, onProgress) {
    log("exchangeMailBlockDataInProc(blockId=" + blockId + ")");
    if (onProgress != undefined) {onProgress();}
    
    dbTools.exchangeMailBlockDataInProcScriptExec(blockId,
        function(blockId) {
            dbTools.exchangeMailBlockDataInProcMailAdd(blockId, 
                function(blockId) {
                    dbTools.exchangeMailBlockDataInProcMailFileInAdd(blockId, onSuccess, onError);
                }, 
                onError
            );
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

/*dbTools.exchangeMailBlockDataInProcMailAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailAdd(blockId=" + blockId + ")");
    
    var rsIn = {};
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT A.data FROM MailBlockDataIn A"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%') SB"
                + " CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%')) SE"
                + " WHERE A.blockId = ? AND (SB.irow IS NULL OR A.irow < SB.irow OR A.irow >= SE.irow) ORDER BY A.irow";
            tx.executeSql(sql, [blockId, blockId, blockId, blockId], function(tx, rs) {
                rsIn = rs;
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {
            var bulkInsert = function(blockId, rs, begIndex, bulkCnt, sql, onSuccess, onError) {
                var endIndex = begIndex + bulkCnt < rs.rows.length ? begIndex + bulkCnt : rs.rows.length;
                log("....bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                var data = rs.rows.item(i)["data"];
                                var j;
                                if (data != null) {
                                    if (data.charAt(0) === "@") {
                                        j = data.indexOf(":");
                                        var tblName = data.substring(1, j);
                                        var tblFlds = data.substring(j + 1);
                                        sql = "INSERT INTO Mail" + tblName + "(blockId," + tblFlds + ") VALUES(@1, @2)";
                                    } else {
                                        tx.executeSql(sql.replace("@1", blockId).replace("@2", data), []);
                                    }
                                } else {
                                    log("......data is null! i=" + i);
                                }
                                
                            }
                        },
                        function(error) {
                            log("..exchangeMailBlockDataInProcMailAdd ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("..exchangeMailBlockDataInProcMailAdd: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            bulkInsert(blockId, rs, endIndex, bulkCnt, sql, onSuccess, onError);
                        }
                    );
                } else {
                    if (onSuccess != undefined) {onSuccess(blockId);}
                }
            }
            
            bulkInsert(blockId, rsIn, 0, settings.bulkRecordCount, "", onSuccess, onError);
        }
    );
}
*/
dbTools.exchangeMailBlockDataInProcMailAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailAdd(blockId=" + blockId + ")");
    
    var rsIn = {};
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT A.data FROM MailBlockDataIn A"
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%') SB "
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@Script%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@Script%')) SE "
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%') FIB "
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@FileIn%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%')) FIE "
                + "  WHERE A.blockId = ? AND (SB.irow IS NULL OR A.irow < SB.irow OR A.irow >= SE.irow) AND (FIB.irow IS NULL OR A.irow < FIB.irow OR A.irow >= FIE.irow) ORDER BY A.irow ";
            tx.executeSql(sql, [blockId, blockId, blockId, blockId, blockId, blockId, blockId], function(tx, rs) {
                rsIn = rs;
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {
            var bulkInsert = function(blockId, rs, begIndex, bulkCnt, sql, onSuccess, onError) {
                var endIndex = begIndex + bulkCnt < rs.rows.length ? begIndex + bulkCnt : rs.rows.length;
                log("....bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                var data = rs.rows.item(i)["data"];
                                var j;
                                if (data != null) {
                                    if (data.charAt(0) === "@") {
                                        j = data.indexOf(":");
                                        var tblName = data.substring(1, j);
                                        var tblFlds = data.substring(j + 1);
                                        sql = "INSERT INTO Mail" + tblName + "(blockId," + tblFlds + ") VALUES(@1, @2)";
                                    } else {
                                        tx.executeSql(sql.replace("@1", blockId).replace("@2", data), []);
                                    }
                                } else {
                                    log("......data is null! i=" + i);
                                }
                                
                            }
                        },
                        function(error) {
                            log("..exchangeMailBlockDataInProcMailAdd ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("..exchangeMailBlockDataInProcMailAdd bulkInsert: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            bulkInsert(blockId, rs, endIndex, bulkCnt, sql, onSuccess, onError);
                        }
                    );
                } else {
                    if (onSuccess != undefined) {onSuccess(blockId);}
                }
            }
            
            bulkInsert(blockId, rsIn, 0, settings.bulkRecordCount, "", onSuccess, onError);
        }
    );
}

/*dbTools.exchangeMailBlockDataInProcMailFileInAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailFileInAdd(blockId=" + blockId + ")");
    
    var rsIn = {};
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT A.data FROM MailBlockDataIn A"
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%') FIB "
                + "  CROSS JOIN (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@FileIn%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%')) FIE "
                + "  WHERE A.blockId = ? AND (A.irow >= FIB.irow AND A.irow < FIE.irow) ORDER BY A.irow ";
            tx.executeSql(sql, [blockId, blockId, blockId, blockId], function(tx, rs) {
                rsIn = rs;
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {
            var bulkInsert = function(blockId, rs, begIndex, bulkCnt, sql, onSuccess, onError) {
                var endIndex = begIndex + bulkCnt < rs.rows.length ? begIndex + bulkCnt : rs.rows.length;
                log("....bulkInsert begIndex=" + begIndex + ", endIndex=" + endIndex);
                if (begIndex < endIndex) {
                    dbTools.db.transaction(
                        function(tx) {
                            for (var i = begIndex; i < endIndex; i++) {
                                var data = rs.rows.item(i)["data"];
                                var j;
                                if (data != null) {
                                    if (data.charAt(0) === "@") {
                                        j = data.indexOf(":");
                                        var tblName = data.substring(1, j);
                                        var tblFlds = data.substring(j + 1);
                                        sql = "INSERT INTO Mail" + tblName + "(blockId," + tblFlds + ") VALUES(@1, @2)";
                                    } else {
                                        tx.executeSql(sql.replace("@1", blockId).replace("@2", data), []);
                                    }
                                } else {
                                    log("......data is null! i=" + i);
                                }
                                
                            }
                        },
                        function(error) {
                            log("..exchangeMailBlockDataInProcMailFileInAdd ERROR, begIndex=" + begIndex + ", endIndex=" + endIndex + ", error=" + dbTools.errorMsg(error)); 
                            if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}
                        },
                        function() {
                            log("..exchangeMailBlockDataInProcMailFileInAdd bulkInsert: transaction commited, begIndex=" + begIndex + ", endIndex=" + endIndex); 
                            bulkInsert(blockId, rs, endIndex, bulkCnt, sql, onSuccess, onError);
                        }
                    );
                } else {
                    if (onSuccess != undefined) {onSuccess(blockId);}
                }
            }
            
            bulkInsert(blockId, rsIn, 0, settings.fileBulkRecordCount, "", onSuccess, onError);
        }
    );
}
*/
dbTools.exchangeMailBlockDataInProcMailFileInAdd = function(blockId, onSuccess, onError) {
    log("exchangeMailBlockDataInProcMailFileInAdd(blockId=" + blockId + ")");
    
    var fileBegIndex = 0;
    var fileEndIndex = 0;
    dbTools.db.transaction(
        function(tx) {
           var sql = "SELECT "
                + "  (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%') AS begIRow,"
                + "  (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@%' AND data NOT LIKE '@FileIn%' AND irow > (SELECT MIN(irow) AS irow FROM MailBlockDataIn WHERE blockId = ? AND data LIKE '@FileIn%')) AS endIRow";
            tx.executeSql(sql, [blockId, blockId, blockId], function(tx, rs) {
                if (rs.rows.length > 0) {
                    fileBegIndex = rs.rows.item(0).begIRow;
                    fileEndIndex = rs.rows.item(0).endIRow;
                }
            });
        },
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {
            var sqlIns = "";
            if (fileBegIndex < fileEndIndex) {
                dbTools.db.transaction(
                    function(tx) {
                       var sql = "SELECT A.data FROM MailBlockDataIn A"
                            + "  WHERE A.blockId = ? AND (A.irow = ?)";
                        tx.executeSql(sql, [blockId, fileBegIndex], function(tx, rs) {
                            var j = rs.rows.item(0).data.indexOf(":");
                            var tblName = rs.rows.item(0).data.substring(1, j);
                            var tblFlds = rs.rows.item(0).data.substring(j + 1);
                            sqlIns = "INSERT INTO Mail" + tblName + "(blockId," + tblFlds + ") VALUES(@1, @2)";
                        });
                    },
                    function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
                    function() {
                        if (fileBegIndex + 1 < fileEndIndex) {
                            for (i = fileBegIndex + 1; i < fileEndIndex; i++) {
                                var fileInsert = function(blockId, index) {
                                    log("....fileInsert irow=" + index);
                                    dbTools.db.transaction(
                                        function(tx) {
                                           var sql = "SELECT A.data FROM MailBlockDataIn A"
                                                + "  WHERE A.blockId = ? AND (A.irow = ?)";
                                            tx.executeSql(sql, [blockId, index], function(tx, rs) {
                                                tx.executeSql(sqlIns.replace("@1", blockId).replace("@2", rs.rows.item(0).data), []);
                                            });
                                        },
                                        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
                                        function() {
                                            if (index == fileEndIndex - 1) {
                                                if (onSuccess != undefined) {onSuccess(blockId);}
                                            }
                                        }
                                    );
                                }
                                fileInsert(blockId, i);
                            }
                        } else {
                            if (onSuccess != undefined) {onSuccess(blockId);}
                        }
                    }
                );
            } else {
                if (onSuccess != undefined) {onSuccess(blockId);}
            }
        }
    );
}

dbTools.exchangeMailImportParm = function(blockId, onSuccess, onError) {
    log("exchangeMailImportParm(blockId=" + blockId + ")");
    
    dbTools.db.transaction(
        function(tx) {
            var sql = "SELECT exchDate, appVersion FROM MailExchParm WHERE blockId=?";
            tx.executeSql(sql, [blockId], function(tx, rs) {
                if (rs.rows.length > 0) {
                    var exchDate = rs.rows.item(0).exchDate;
                    var appVersion = rs.rows.item(0).appVersion;
                    var sql = "UPDATE Parm SET exchDataFromOfficeSent = ?, appVersion = ?";
                    tx.executeSql(sql, [exchDate, appVersion]);
                    settings.exchange.dataInDateSend = sqlDateToDate(exchDate);
                    settings.exchange.appVersion = appVersion;
                }
            });
            sql = "DELETE FROM ExtRef";
            tx.executeSql(sql, []);
            sql = "INSERT INTO ExtRef (refTypeId, refId, updateDate) SELECT refTypeId, refId, updateDate FROM MailExtRef WHERE blockId=?";
            tx.executeSql(sql, [blockId]);
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
                                    log("....tableUpdate('" + tblName + "', " + refTypeId + ", '" + flds + "')");
                                    //var sql = "SELECT group_concat(@tblNameId) AS idLst FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? /*AND B.updateDate>@tblName.updateDate*/)";
                                    var sql = "SELECT @tblNameId AS id FROM"
                                        + "  (SELECT @tblNameId FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? /*AND B.updateDate>@tblName.updateDate*/)"
                                        + "  UNION"
                                        + "  SELECT @tblNameId FROM Mail@tblName WHERE blockId=?"
                                        + "  ) A";
                                    var sqlExec = sql.replace(new RegExp("@tblName","g"), tblName);
                                    tx.executeSql(sqlExec, [blockId, blockId], function(tx, rs) {
                                        if (rs.rows.length > 0) {
                                            //var idLst = rs.rows.item(0).idLst;
                                            var idArr = [];
                                            for (var i = 0; i < rs.rows.length; i++) {
                                                if (rs.rows.item(i).id != null) {
                                                    idArr.push(rs.rows.item(i).id);
                                                }
                                            }
                                            if (idArr.length === 0) {
                                                idArr.push(0);
                                            }
                                            var idLst = idArr.join(",");
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
                                    
                                    sql = "DELETE FROM @tblName WHERE EXISTS(SELECT 1 FROM Mail@tblName B WHERE B.@tblNameId=@tblName.@tblNameId AND B.blockId=? /*AND B.updateDate>@tblName.updateDate*/)";
                                    sqlExec = sql.replace(new RegExp("@tblName","g"), tblName);
                                    tx.executeSql(sqlExec, [blockId]);
                                    
                                    sql = "SELECT @tblNameId AS id FROM Mail@tblName WHERE blockId = ? AND @tblNameId NOT IN (SELECT @tblNameId FROM @tblName)";
                                    sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName);
                                    tx.executeSql(sqlExec, [blockId], function(tx, rs) {
                                        if (rs.rows.length > 0) {
                                            var idArr2 = [];
                                            for (var i = 0; i < rs.rows.length; i++) {
                                                if (rs.rows.item(i).id != null) {
                                                    idArr2.push(rs.rows.item(i).id);
                                                }
                                            }
                                            if (idArr2.length === 0) {
                                                idArr2.push(0);
                                            }
                                            var sql = "INSERT INTO @tblName(@flds) SELECT @flds FROM Mail@tblName WHERE blockId=? AND @tblNameId IN (@idLst)";
                                            var sqlExec = sql.replace(new RegExp("@tblName", "g"), tblName).replace(new RegExp("@flds", "g"), flds).replace(new RegExp("@idLst", "g"), idArr2.join(","));
                                            tx.executeSql(sqlExec, [blockId], function(tx) {
                                                var sql = "SELECT name, flds FROM RefType WHERE dir<0 AND parentId=?";
                                                tx.executeSql(sql, [refTypeId], function(tx, rs){
                                                    var sql = "INSERT INTO @dtlName(@dtlFlds) SELECT @dtlFlds FROM Mail@dtlName WHERE blockId=? AND @tblNameId IN (@idLst)";
                                                    for (var i = 0; i < rs.rows.length; i++) {
                                                        var dtlName = rs.rows.item(i).name;
                                                        var dtlFlds = rs.rows.item(i).flds;
                                                        var sqlExec = sql.replace(new RegExp("@dtlName", "g"), dtlName).replace(new RegExp("@dtlFlds", "g"), dtlFlds).replace(new RegExp("@tblName", "g"), tblName).replace(new RegExp("@idLst", "g"), idArr2.join(","));
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
        function(error) {log("exchangeMailImport ERROR"); if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error));}},
        function() {if (onSuccess != undefined) {onSuccess(blockId);}}
    );
}

dbTools.exchangeMailImportDelete = function(blockId, onSuccess, onError) {
    log("exchangeMailImportDelete(blockId=" + blockId + ")");
    //logSqlResult(undefined, "SELECT D.refTypeId, RT.name, COUNT(*) AS cnt FROM MailToDelete D LEFT JOIN RefType RT ON D.refTypeId = RT.refTypeId WHERE D.blockId=" + blockId + " GROUP BY D.refTypeId, RT.name");
    
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

/*dbTools.exchangeFileImport = function(blockId, onSuccess, onError) {
    log("exchangeFileImport(" + blockId + ")");
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileInId, fileName, data FROM FileIn WHERE data IS NOT NULL", [], 
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var fileSave = function(fileInId, fileName, data) {
                            log("..exchangeFileImport.fileSave(fileInId=" + fileInId + ", fileName='" + fileName +"', data)");
                            fileHelper.fileDataWrite(data, fileHelper.folderName(), fileName,
                                function(fileEntry) {
                                    dbTools.db.transaction(
                                        function(tx) {
                                            tx.executeSql("UPDATE FileIn SET data = NULL WHERE fileInId = ?", [fileInId]);
                                        }, 
                                        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
                                    );
                                },
                                function(errMsg) {if (onError != undefined) {onError(errMsg)}}
                            );
                        }
                        fileSave(rs.rows.item(i).fileInId, rs.rows.item(i).fileName, rs.rows.item(i).data);
                    }
                    if (onSuccess != undefined) {onSuccess()}
                },
                function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
            );
        }, 
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
    );
}
*/
dbTools.exchangeFileImport = function(blockId, onSuccess, onError) {
    log("exchangeFileImport(" + blockId + ")");
    var rsIn = {};
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileInId, fileName FROM FileIn WHERE data IS NOT NULL", [], 
                function(tx, rs) {
                    rsIn = rs;
                },
                function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
            );
        }, 
        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}},
        function() {
            for (var i = 0; i < rsIn.rows.length; i++) {
                var fileSave = function(fileInId, fileName) {
                    log("..exchangeFileImport.fileSave(fileInId=" + fileInId + ", fileName='" + fileName +"')");
                    dbTools.db.transaction(
                        function(tx) {
                            tx.executeSql("SELECT data FROM FileIn WHERE fileInId = ?", [fileInId], 
                                function(tx, rs) {
                                    var data = rs.rows.item(0).data;
                                    fileHelper.fileDataWrite(data, fileHelper.folderName(), fileName,
                                        function(fileEntry) {
                                            dbTools.db.transaction(
                                                function(tx) {
                                                    tx.executeSql("UPDATE FileIn SET data = NULL WHERE fileInId = ?", [fileInId]);
                                                }, 
                                                function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
                                            );
                                        },
                                        function(errMsg) {if (onError != undefined) {onError(errMsg)}}
                                    );
                                }
                            );
                        },
                        function(error) {if (onError != undefined) {onError("!!! SQLite error: " + dbTools.errorMsg(error))}}
                    );
                }
                fileSave(rsIn.rows.item(i).fileInId, rsIn.rows.item(i).fileName);
            }
            if (onSuccess != undefined) {onSuccess()}
        }
    );
}



//-------------------------------------------------
// test exchange
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

