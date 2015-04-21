dbTools.fileListGet = function(fileTableName, fileIdLst, datasetGet) {
    log("fileListGet('" + fileTableName + "', '" + fileIdLst + "')");
    dbTools.db.transaction(function(tx) {
        if (fileIdLst.length === 0) {
            fileIdLst = "-1";
        }
        var fileIdArr = fileIdLst.split(",");
        var sql = "";
        for (var i = 0; i < fileIdArr.length; i++) {
            if (sql.length > 0) {
                sql += "    UNION ALL";
            }
            sql += "    SELECT " + fileIdArr[i] + " AS @tblNameId, " + i + " AS lvl";
        }
        sql = "SELECT F.@tblNameId AS fileId, F.fileName, F.title"
            + "  FROM @tblName F"
            + "  INNER JOIN"
            + "  (" + sql
            + "  ) FO ON F.@tblNameId = FO.@tblNameId"
            + "  WHERE F.@tblNameId IN (@idLst)"
            + "  ORDER BY FO.lvl";
        var sqlExec = sql.replace(/@tblName/g, fileTableName).replace(/@idLst/g, fileIdLst);
        tx.executeSql(sqlExec, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.fileUpdate = function(fileTableName, fileId, fileName, title, fileDataStr, onSuccess, onError) {
    log("fileUpdate('" + fileTableName + "', " + fileId + ", '" + fileName + "', '" + title + ", '" + fileDataStr.substring(0, 10) + "...')");
    dbTools.db.transaction(function(tx) {
        if (fileId > 0) {
                dbTools.sqlInsertUpdate(tx, fileTableName, [fileTableName.concat("Id")], ["fileName", "title", "data"], [fileId], [fileName, title, fileDataStr], 
                    function() {if (onSuccess != undefined) {onSuccess(fileId);}},
                    onError
                );
        } else {
            dbTools.tableNextIdGet(tx, fileTableName, 
                function(tx, fileId) {
                    dbTools.sqlInsertUpdate(tx, fileTableName, [fileTableName.concat("Id")], ["fileName", "title", "data"], [fileId], [fileName, title, fileDataStr], 
                        function() {if (onSuccess != undefined) {onSuccess(fileId);}},
                        onError
                    );
                }, 
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

