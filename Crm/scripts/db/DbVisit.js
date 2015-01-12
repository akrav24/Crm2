dbTools.visitListGet = function(prdBgn, datasetGet) {
    log("visitListGet");
    // visitType: 1 - визита не было, 2 - был запланированный визит, 3 - был незапланированный визит
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitPlanId, VPI.visitPlanItemId, VP.empId, VP.dateBgn, VPI.custId, K.name, K.cityId, C.name AS cityName,"
            + " K.addr, K.name + ', ' + C.name + ', ' + k.addr AS fullName, K.chainId, CN.name AS chainName, NULL AS docId, 1 AS visitType"
            + " FROM VisitPlan VP"
            + " INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId"
            + " LEFT JOIN Cust K ON VPI.custId = K.custId"
            + " LEFT JOIN City C ON K.cityId = C.cityId"
            + " LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            // TODO: DEL (empId)
            //+ " WHERE VP.empId = ? AND VP.dateBgn >= ? AND VP.dateBgn <= ?"
            + " WHERE VP.dateBgn >= ? AND VP.dateBgn <= ?"
            + " ORDER BY VP.dateBgn, VPI.lvl";
        // TODO: DEL (empId)
        //tx.executeSql(sql, [empId, dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ"), dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ")], datasetGet, dbTools.onSqlError);
        tx.executeSql(sql, [dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ"), dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ")], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitGet = function(visitPlanItemId, datasetGet) {
    log("visitGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VPI.visitPlanId, VP.dateBgn, VPI.visitPlanItemId, VPI.custId, K.name AS custName, NULL AS docId"
            + " FROM VisitPlanItem VPI"
            + " INNER JOIN VisitPlan VP ON VPI.visitPlanId = VP.visitPlanId"
            + " LEFT JOIN Cust K ON VPI.custId = K.custId"
            + " WHERE VPI.visitPlanItemId = ?";
        tx.executeSql(sql, [visitPlanItemId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitProductsGet = function(visitPlanItemId, datasetGet) {
    log("visitProductsGet");
    dbTools.db.transaction(function(tx) {
        //var sql = "SELECT NULL AS visitPlanId, NULL AS docId, S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, BG.brandId, B.name AS brandName,"
        //    + " S.skuCatId, SC.name AS skuCatName, SC.parentId AS skuCatParentId, 1 AS qnt"
        var sql = "SELECT S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, 1 AS qnt"
            + " FROM Sku S"
            + " LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + " LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + " LEFT JOIN SkuCat SC ON S.skuCatId = SC.skuCatId"
            + " WHERE S.active = 1"
            + " ORDER BY BG.name, S.name";
        tx.executeSql(sql, [/*visitPlanItemId*/], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}