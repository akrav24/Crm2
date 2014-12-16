dbTools.routeListGet = function(prdBgn, datasetGet) {
    log("routeListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.empId, VP.dateBgn, VPI.custId, K.name, K.cityId, C.name AS cityName, K.addr, K.chainId, CN.name AS chainName, NULL AS docId, 1 AS docType"
            + " FROM VisitPlan VP"
            + " INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId"
            + " LEFT JOIN Cust K ON VPI.custId = K.custId"
            + " LEFT JOIN City C ON K.cityId = C.cityId"
            + " LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            + " WHERE VP.empId = ? AND VP.dateBgn >= ? AND VP.dateBgn <= ?"
            + " ORDER BY VP.dateBgn, VPI.lvl";
        tx.executeSql(sql, [empId, dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ"), dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ")], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}