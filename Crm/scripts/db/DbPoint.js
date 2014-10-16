dbTools.pointListGet = function(datasetGet) {
    log("pointListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT C.custId, C.name, CT.name AS cityName, C.addr"
            + " FROM Cust C"
            + " LEFT JOIN City CT ON C.cityId = CT.cityId"
            + " WHERE C.empId = ?"
            + " ORDER BY C.name, CT.name, C.addr, C.custId";
        tx.executeSql(sql, [empId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}