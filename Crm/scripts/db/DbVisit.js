dbTools.visitListGet = function(prdBgn, datasetGet) {
    log("visitListGet");
    // visitType: 1 - визита не было, 2 - был запланированный визит, 3 - был незапланированный визит
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitPlanId, VPI.visitPlanItemId, VP.empId, VP.dateBgn, VPI.custId, K.name, K.cityId, C.name AS cityName,"
            + " K.addr, K.chainId, CN.name AS chainName, NULL AS docId, 1 AS visitType"
            + " FROM VisitPlan VP"
            + " INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId"
            + " LEFT JOIN Cust K ON VPI.custId = K.custId"
            + " LEFT JOIN City C ON K.cityId = C.cityId"
            + " LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            + " WHERE VP.dateBgn >= ? AND VP.dateBgn <= ?"
            + " ORDER BY VP.dateBgn, VPI.lvl";
        tx.executeSql(sql, [dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ"), dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ")], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitGet = function(visitPlanItemId, datasetGet) {
    log("visitGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VPI.visitPlanId, VP.dateBgn, VPI.timeBgn, VPI.visitPlanItemId, VPI.custId, K.name, K.addr"
            + " FROM VisitPlanItem VPI"
            + " INNER JOIN VisitPlan VP ON VPI.visitPlanId = VP.visitPlanId"
            + " LEFT JOIN Cust K ON VPI.custId = K.custId"
            + " WHERE VPI.visitPlanItemId = ?";
        tx.executeSql(sql, [visitPlanItemId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitProductCategoryGet = function(isItemAllShow, datasetGet) {
    log("visitProductCategoryGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT skuCatId, name"
            + "  FROM"
            + "    (SELECT -1 AS skuCatId, 'Все' AS name, 0 AS lvl, 0 AS blk WHERE ? <> '0'"
            + "    UNION ALL"
            + "    SELECT skuCatId, name, lvl, 1 AS blk FROM SkuCat"
            + "    ) A"
            + "  ORDER BY blk, lvl, name";
        tx.executeSql(sql, [isItemAllShow], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}
dbTools.visitProductsGet = function(visitPlanItemId, skuCatId, datasetGet) {
    log("visitProductsGet");
    dbTools.db.transaction(function(tx) {
        //var sql = "SELECT NULL AS visitPlanId, NULL AS docId, S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, BG.brandId, B.name AS brandName,"
        //    + " S.skuCatId, SC.name AS skuCatName, SC.parentId AS skuCatParentId, 1 AS qnt"
        var sql = "SELECT S.skuId, S.name, S.code, S.brandGrpId, BG.name AS brandGrpName, 1 AS qnt"
            + " FROM Sku S"
            + " LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + " LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + " LEFT JOIN SkuCat SC ON S.skuCatId = SC.skuCatId"
            + " WHERE S.active = 1"
            + "   AND B.ext = 0"
            + "   AND S.skuCatId = ?"
            + " ORDER BY S.name";
        tx.executeSql(sql, [skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitActivityGet = function(visitPlanItemId, datasetGet) {
    log("visitActivityGet(" + visitPlanItemId + ", )");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VPI.visitPlanItemId AS visitPlanItemId, VSA.stageId AS stageId, VSA.activityId AS activityId, A.name AS name, 1 AS blk, A.lvl AS lvl"
            + "  FROM VisitPlanItem VPI"
            + "  INNER JOIN VisitSchemaActivity VSA ON VPI.visitSchemaId = VSA.visitSchemaId"
            + "  INNER JOIN Activity A ON VSA.activityId = A.activityId"
            + "  WHERE VPI.visitPlanItemId = ?"
            + " UNION ALL"
            + " SELECT ? AS visitPlanItemId, 1 AS stageId, 0 AS activityId, 'Первичный анализ' AS name, 0 AS blk, 0 AS lvl"
            + " UNION ALL"
            + " SELECT ? AS visitPlanItemId, 2 AS stageId, 0 AS activityId, 'Основной анализ' AS name, 0 AS blk, 0 AS lvl"
            + " ORDER BY VSA.stageId, blk, A.lvl";
        tx.executeSql(sql, [visitPlanItemId, visitPlanItemId, visitPlanItemId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}
