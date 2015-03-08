dbTools.visitListGet = function(prdBgn, datasetGet) {
    log("visitListGet");
    // visitType: 1 - визита не было, 2 - был запланированный визит, 3 - был незапланированный визит, 4 - текущий запланированный визит, 5 - текущий незапланированный визит
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT A.visitPlanId, A.visitPlanItemId, A.visitId, A.dateBgn, "
            + "        A.custId, A.name, A.cityId, A.cityName,"
            + "        A.addr, A.chainId, A.chainName, A.visitType"
            + "  FROM"
            + "    (SELECT VP.visitPlanId, VPI.visitPlanItemId, V.visitId, VP.dateBgn, "
            + "        VPI.custId, K.name, K.cityId, C.name AS cityName,"
            + "        K.addr, K.chainId, CN.name AS chainName, "
            + "        CASE WHEN V.visitId IS NULL THEN 1 WHEN V.timeEnd IS NOT NULL THEN 2 ELSE 4 END AS visitType,"
            + "        0 AS blk, VPI.lvl"
            + "      FROM VisitPlan VP"
            + "      INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId"
            + "      LEFT JOIN Visit V ON VPI.custId = V.custId AND VP.dateBgn = V.dateBgn"
            + "      LEFT JOIN Cust K ON VPI.custId = K.custId"
            + "      LEFT JOIN City C ON K.cityId = C.cityId"
            + "      LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            + "      WHERE VP.dateBgn >= ? AND VP.dateBgn <= ?"
            + "    UNION ALL"
            + "    SELECT NULL AS visitPlanId, NULL AS visitPlanItemId, V.visitId, V.dateBgn, "
            + "        V.custId, K.name, K.cityId, C.name AS cityName,"
            + "        K.addr, K.chainId, CN.name AS chainName, "
            + "        CASE WHEN V.timeEnd IS NOT NULL THEN 3 ELSE 5 END AS visitType,"
            + "        1 AS blk, 0 AS lvl"
            + "      FROM Visit V"
            + "      LEFT JOIN Cust K ON V.custId = K.custId"
            + "      LEFT JOIN City C ON K.cityId = C.cityId"
            + "      LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            + "      WHERE V.dateBgn >= ? AND V.dateBgn <= ?"
            + "        AND NOT EXISTS(SELECT 1 FROM VisitPlan VP INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId WHERE VPI.custId = V.custId AND VP.dateBgn = V.dateBgn)"
            + "  ) A"
            + "  ORDER BY A.dateBgn, A.blk, A.lvl";
        var dt = dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ");
        tx.executeSql(sql, [dt, dt, dt, dt], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitGet = function(visitPlanItemId, visitId, datasetGet) {
    log("visitGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT MAX(A.visitPlanId) AS visitPlanId, MAX(A.visitPlanItemId) AS visitPlanItemId,"
            + "    MAX(A.visitId) AS visitId, MAX(A.dateBgn) AS dateBgn,"
            + "    MAX(A.timeBgn) AS timeBgn, MAX(A.timeEnd) AS timeEnd, MAX(A.custId) AS custId,"
            + "    MAX(A.name) AS name, MAX(A.addr) AS addr, MAX(A.fmtId) AS fmtId"
            + "  FROM"
            + "    (SELECT VPI.visitPlanId, VPI.visitPlanItemId, NULL AS visitId, VP.dateBgn,"
            + "        NULL AS timeBgn, NULL AS timeEnd, VPI.custId, K.name, K.addr, K.fmtId"
            + "      FROM VisitPlanItem VPI"
            + "      INNER JOIN VisitPlan VP ON VPI.visitPlanId = VP.visitPlanId"
            + "      LEFT JOIN Cust K ON VPI.custId = K.custId"
            + "      WHERE VPI.visitPlanItemId = ?"
            + "    UNION ALL"
            + "    SELECT NULL AS visitPlanId, NULL AS visitPlanItemId, V.visitId, V.dateBgn,"
            + "        V.timeBgn, V.timeEnd, V.custId, K.name, K.addr, K.fmtId"
            + "      FROM Visit V "
            + "      LEFT JOIN Cust K ON V.custId = K.custId"
            + "      WHERE V.visitId = ?"
            + "    ) A";
        tx.executeSql(sql, [visitPlanItemId, visitId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAdd = function(dateBgn, custId, onSuccess, onError) {
    log("visitAdd(" + custId + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.tableNextIdGet(tx, "Visit", 
            function(tx, visitId) {
                var timeBgn = new Date();
                var sql = "INSERT INTO Visit(visitId, dateBgn, timeBgn, custId, updateDate)"
                    + "  VALUES(?, ?, ?, ?, ?)";
                tx.executeSql(sql, [visitId, dateToSqlDate(dateBgn), dateToSqlDate(timeBgn), custId, dateToSqlDate(timeBgn)], 
                    function(tx, rs) {if (onSuccess != undefined) {onSuccess(visitId, timeBgn);}},
                    function(tx, error) {if (onError != undefined) {onError(dbTools.errorMsg(error));}}
                );
            }, 
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitEnd = function(visitId, onSuccess, onError) {
    log("visitEnd(" + visitId + ")");
    dbTools.db.transaction(function(tx) {
        var timeEnd = new Date();
        dbTools.sqlUpdate(tx, "Visit", "visitId", ["timeEnd"], visitId, [dateToSqlDate(timeEnd)], 
            function() {if (onSuccess != undefined) {onSuccess(timeEnd);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
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
dbTools.visitProductsGet = function(visitId, skuCatId, fmtFilterType, fmtId, datasetGet) {
    log("visitProductsGet(" + visitId + ", " + skuCatId + ", " + fmtFilterType + ", " + fmtId + ")");
    dbTools.db.transaction(function(tx) {
        //var sql = "SELECT NULL AS visitPlanId, NULL AS docId, S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, BG.brandId, B.name AS brandName,"
        //    + " S.skuCatId, SC.name AS skuCatName, SC.parentId AS skuCatParentId, 1 AS qnt"
        var sql = "SELECT S.skuId, S.name, S.code, S.brandGrpId, BG.name AS brandGrpName, VS.sel, VS.sel0,"
            + "    VS.qntRest, VS.qntOrder, VS.reasonId, R.name AS reasonName, VS.reasonQnt, VS.reasonDate"
            + "  FROM Sku S"
            + "  LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + "  LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + "  LEFT JOIN SkuCat SC ON S.skuCatId = SC.skuCatId"
            + "  LEFT JOIN VisitSku VS ON VS.visitId = ? AND S.skuId = VS.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE S.active = 1"
            + "    AND B.ext = 0"
            + "    AND S.skuCatId = ?"
            + "    AND (? = 1 OR EXISTS(SELECT 1 FROM FmtSku WHERE fmtId = ? AND skuId = S.skuId))"
            + "  ORDER BY S.name";
        tx.executeSql(sql, [visitId, skuCatId, fmtFilterType, fmtId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitProductGet = function(visitId, skuId, datasetGet) {
    log("visitProductGet(" + visitId + ", " + skuId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT V.visitId, VS.skuId, S.name, S.code, IFNULL(S.code, '') || ' ' || S.name AS fullName, VS.sel, VS.sel0, VS.qntRest, VS.qntOrder"
            + "  FROM Sku S"
            + "  LEFT JOIN Visit V ON V.visitId = ?"
            + "  LEFT JOIN VisitSku VS ON V.visitId = VS.visitId AND VS.skuId = S.skuId"
            + "  WHERE S.skuId = ?";
        tx.executeSql(sql, [visitId, skuId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitActivityGet = function(visitPlanItemId, visitId, datasetGet) {
    log("visitActivityGet(" + visitPlanItemId + ")");
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

dbTools.visitProductSelUpdate = function(visitId, skuId, stageId, sel, onSuccess, onError) {
    log("visitProductSelUpdate(" + visitId + ", " + skuId + ", " + stageId + ", " + sel + ")");
    dbTools.db.transaction(function(tx) {
        var flds = ["visitId", "skuId", "sel"];
        var vals = [visitId, skuId, sel];
        if (stageId == 1) {
            flds.push("sel0");
            vals.push(sel);
        }
        dbTools.sqlInsertUpdate(tx, "VisitSku", flds, vals, 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitProductUpdate = function(visitId, skuId, sel, qntRest, qntOrder, onSuccess, onError) {
    log("visitProductUpdate(" + visitId + ", " + skuId + ", " + sel + ", " + qntRest + ", " + qntOrder + ")");
    dbTools.db.transaction(function(tx) {
        var flds = ["visitId", "skuId", "sel", "qntRest", "qntOrder"];
        var vals = [visitId, skuId, sel, qntRest, qntOrder];
        dbTools.sqlInsertUpdate(tx, "VisitSku", flds, vals, 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}


