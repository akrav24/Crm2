dbTools.visitListGet = function(prdBgn, prdEnd, custId, isVisited, sortOrder, datasetGet) {
    log("visitListGet");
    // visitType: 1 - визита не было, 2 - был запланированный визит, 3 - был незапланированный визит, 4 - текущий запланированный визит, 5 - текущий незапланированный визит
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT A.visitPlanId, A.visitPlanItemId, A.visitId, A.dateBgn, A.timeBgn, A.timeEnd,"
            + "        A.custId, A.name, A.cityId, A.cityName,"
            + "        A.addr, A.chainId, A.chainName, A.visitType"
            + "  FROM"
            + "    (SELECT VP.visitPlanId, VPI.visitPlanItemId, V.visitId, VP.dateBgn, V.timeBgn, V.timeEnd,"
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
            + "        AND (@custId = -1 OR VPI.custId = @custId)"
            + "    UNION ALL"
            + "    SELECT NULL AS visitPlanId, NULL AS visitPlanItemId, V.visitId, V.dateBgn, V.timeBgn, V.timeEnd,"
            + "        V.custId, K.name, K.cityId, C.name AS cityName,"
            + "        K.addr, K.chainId, CN.name AS chainName, "
            + "        CASE WHEN V.timeEnd IS NOT NULL THEN 3 ELSE 5 END AS visitType,"
            + "        1 AS blk, 0 AS lvl"
            + "      FROM Visit V"
            + "      LEFT JOIN Cust K ON V.custId = K.custId"
            + "      LEFT JOIN City C ON K.cityId = C.cityId"
            + "      LEFT JOIN Chain CN ON K.chainId = CN.chainId"
            + "      WHERE V.dateBgn >= ? AND V.dateBgn <= ?"
            + "        AND (@custId = -1 OR V.custId = @custId)"
            + "        AND NOT EXISTS(SELECT 1 FROM VisitPlan VP INNER JOIN VisitPlanItem VPI ON VP.visitPlanId = VPI.visitPlanId WHERE VPI.custId = V.custId AND VP.dateBgn = V.dateBgn)"
            + "  ) A"
            + "  WHERE (@isVisited = -1 OR @isVisited = 1 AND A.visitType IN (2, 3, 4, 5) OR @isVisited = 0 AND A.visitType IN (1))";
        switch (sortOrder) {
            case 2:
                sql += "  ORDER BY A.timeBgn DESC, A.dateBgn DESC, A.blk, A.lvl, A.visitPlanItemId, A.visitId";
                break;
            default:
                sql += "  ORDER BY A.dateBgn, A.blk, A.lvl, A.visitPlanItemId, A.visitId";
                break;
        }
        sql = sql.replace(/@custId/g, custId).replace(/@isVisited/g, isVisited);
        var dtBgn = dateToStr(prdBgn, "YYYYMMDD HH:NN:SS:ZZZ");
        var dtEnd = dateToStr(prdEnd, "YYYYMMDD HH:NN:SS:ZZZ");
        tx.executeSql(sql, [dtBgn, dtEnd, dtBgn, dtEnd], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitGet = function(visitPlanItemId, visitId, datasetGet) {
    log("visitGet(" + visitPlanItemId + ", " + visitId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "";
        if (visitId > 0) {
            sql = "SELECT NULL AS visitPlanId, NULL AS visitPlanItemId, V.visitId, V.dateBgn,"
                + "        V.timeBgn, V.timeEnd, V.custId, K.name, K.addr, K.fmtId"
                + "      FROM Visit V "
                + "      LEFT JOIN Cust K ON V.custId = K.custId"
                + "      WHERE V.visitId = ?";
            tx.executeSql(sql, [visitId], datasetGet, dbTools.onSqlError);
        } else {
            sql = "SELECT VPI.visitPlanId, VPI.visitPlanItemId, NULL AS visitId, VP.dateBgn,"
                + "        NULL AS timeBgn, NULL AS timeEnd, VPI.custId, K.name, K.addr, K.fmtId"
                + "      FROM VisitPlanItem VPI"
                + "      INNER JOIN VisitPlan VP ON VPI.visitPlanId = VP.visitPlanId"
                + "      LEFT JOIN Cust K ON VPI.custId = K.custId"
                + "      WHERE VPI.visitPlanItemId = ?";
            tx.executeSql(sql, [visitPlanItemId], datasetGet, dbTools.onSqlError);
        }
    }, dbTools.onTransError);
}

dbTools.visitAddCheck = function(onSuccess, onError) {
    log("visitAddCheck");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT MAX(V.dateBgn) AS dateBgn"
            + "  FROM Visit V"
            + "  WHERE V.timeBgn IS NOT NULL AND V.timeEnd IS NULL";
        tx.executeSql(sql, [], 
            function(tx, rs) {
                var isAdd = true;
                var dateBgn = null;
                if (rs.rows.length > 0) {
                    if (rs.rows.item(0).dateBgn != null) {
                        isAdd = false;
                        dateBgn = sqlDateToDate(rs.rows.item(0).dateBgn);
                    }
                }
                if (onSuccess != undefined) {onSuccess(isAdd, dateBgn);}
            }, 
            onError
        );
    }, dbTools.onTransError);
}

dbTools.visitAdd = function(dateBgn, custId, onSuccess, onError) {
    log("visitAdd('" + dateToSqlDate(dateBgn) + "', " + custId + ")");
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
        dbTools.sqlUpdate(tx, "Visit", ["visitId"], ["timeEnd"], [visitId], [dateToSqlDate(timeEnd)], 
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

dbTools.visitProductCategoryMatrixGet = function(visitId, isItemAllShow, datasetGet) {
    log("visitProductCategoryGet");
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT activityId FROM Activity ORDER BY lvl", [], 
            function(tx, rs) {
                var sqlColNames = "";
                var sqlColExpr = "";
                for (var i = 0; i < rs.rows.length; i++) {
                    sqlColNames += ", A" + rs.rows.item(i).activityId;
                    sqlColExpr += ", SUM(CASE WHEN VA.activityId = " + rs.rows.item(i).activityId + " THEN 1 END) AS A" + rs.rows.item(i).activityId;
                }
                var SkuCatCte = "(SELECT skuCatId, name, blk, lvl"
                    + "    FROM"
                    + "      (SELECT -1 AS skuCatId, 'Все' AS name, 0 AS lvl, 0 AS blk WHERE @isItemAllShow <> '0'"
                    + "      UNION ALL"
                    + "      SELECT skuCatId, name, lvl, 1 AS blk FROM SkuCat"
                    + "      ) A"
                    + "  )";
                var VisitActivityCte = "(SELECT A.activityId, A.skuCatId"
                    + "    FROM"
                    + "      (SELECT 1 AS activityId, S.skuCatId"
                    + "        FROM VisitSku VS"
                    + "        INNER JOIN Sku S ON VS.skuId = S.skuId"
                    + "        WHERE VS.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 2 AS activityId, CP.skuCatId"
                    + "        FROM VisitPlanogramAnswer VPA"
                    + "        INNER JOIN Visit V ON VPA.visitId = V.visitId"
                    + "        INNER JOIN PlanogramQuestion PQ ON VPA.planogramId = PQ.planogramId AND VPA.questionId = PQ.questionId"
                    + "        INNER JOIN CustPlanogram CP ON V.custId = CP.custId AND PQ.planogramId = CP.planogramId"
                    + "        WHERE VPA.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 3 AS activityId, VP.skuCatId"
                    + "        FROM VisitPhoto VP"
                    + "        WHERE VP.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 4 AS activityId, VSC.skuCatId"
                    + "        FROM VisitSkuCat VSC"
                    + "        WHERE VSC.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 5 AS activityId, -1 AS skuCatId"
                    + "        WHERE EXISTS(SELECT 1 FROM VisitSubTask VST WHERE VST.visitId = @visitId)"
                    + "      UNION ALL"
                    + "      SELECT 6 AS activityId, VP.skuCatId"
                    + "        FROM VisitPromo VP"
                    + "        WHERE VP.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 8 AS activityId, S.skuCatId"
                    + "        FROM VisitSkuPrice VSP"
                    + "        INNER JOIN Sku S ON VSP.skuId = S.skuId"
                    + "        WHERE VSP.visitId = @visitId"
                    + "      UNION ALL"
                    + "      SELECT 11 AS activityId, -1 AS skuCatId"
                    + "        WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 2)"
                    + "      UNION ALL"
                    + "      SELECT 12 AS activityId, -1 AS skuCatId"
                    + "        WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 1)"
                    + "      UNION ALL"
                    + "      SELECT 14 AS activityId, -1 AS skuCatId"
                    + "        WHERE EXISTS(SELECT 1 FROM VisitSku VS WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL)"
                    + "      UNION ALL"
                    + "      SELECT 16 AS activityId, VP.skuCatId"
                    + "        FROM VisitOurPromo VP"
                    + "        WHERE VP.visitId = @visitId"
                    + "      ) A"
                    + "      GROUP BY A.activityId, A.skuCatId"
                    + "  )"
                var sql = "SELECT A.skuCatId, A.name" + sqlColNames
                    + "    FROM"
                    + "      (SELECT SC.skuCatId, SC.name, SC.blk, SC.lvl" + sqlColExpr
                    + "        FROM " + SkuCatCte + " SC"
                    + "        LEFT JOIN " + VisitActivityCte + " VA ON SC.skuCatId = VA.skuCatId"
                    + "        WHERE SC.skuCatId > 0"
                    + "        GROUP BY SC.skuCatId, SC.name, SC.blk, SC.lvl"
                    + "      UNION ALL"
                    + "      SELECT SC.skuCatId, SC.name, SC.blk, SC.lvl" + sqlColExpr
                    + "        FROM " + SkuCatCte + " SC"
                    + "        LEFT JOIN " + VisitActivityCte + " VA ON 1 = 1"
                    + "        WHERE SC.skuCatId = -1"
                    + "        GROUP BY SC.skuCatId, SC.name, SC.blk, SC.lvl"
                    + "      ) A"
                    + "    ORDER BY A.blk, A.lvl, A.name";
                sql = sql.replace(/@visitId/g, visitId).replace(/@isItemAllShow/g, isItemAllShow);
                tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
            }, 
            dbTools.onSqlError
        );
    }, dbTools.onTransError);
}

dbTools.visitProductsGet = function(visitId, skuCatId, fmtFilterType, fmtId, datasetGet) {
    log("visitProductsGet(" + visitId + ", " + skuCatId + ", " + fmtFilterType + ", " + fmtId + ")");
    dbTools.db.transaction(function(tx) {
        //var sql = "SELECT NULL AS visitPlanId, NULL AS docId, S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, BG.brandId, B.name AS brandName,"
        //    + " S.skuCatId, SC.name AS skuCatName, SC.parentId AS skuCatParentId, 1 AS qnt"
        var sql = "SELECT S.skuId, S.name, S.code, S.new AS isNew, S.brandGrpId, BG.name AS brandGrpName, VS.sel, VS.sel0,"
            + "    VS.qntRest, VS.qntOrder, VS.reasonId, IFNULL(R.name, '') AS reasonName, VS.reasonQnt, VS.reasonDate"
            + "  FROM Sku S"
            + "  LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + "  LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + "  LEFT JOIN SkuCat SC ON S.skuCatId = SC.skuCatId"
            + "  LEFT JOIN VisitSku VS ON VS.visitId = ? AND S.skuId = VS.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE S.active = 1"
            + "    AND B.ext = 0"
            + "    AND S.skuCatId = ?"
            + "    AND (@fmtFilterType = 1 OR EXISTS(SELECT 1 FROM FmtSku WHERE fmtId = ? AND skuId = S.skuId))"
            //+ "  ORDER BY CASE WHEN S.new <> 0 THEN 1 ELSE 0 END DESC, S.name";
            + "  ORDER BY S.name";
        sql = sql.replace(/@fmtFilterType/g, fmtFilterType);
        tx.executeSql(sql, [visitId, skuCatId, fmtId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitProductSelUpdate = function(visitId, skuId, stageId, sel, onSuccess, onError) {
    log("visitProductSelUpdate(" + visitId + ", " + skuId + ", " + stageId + ", " + sel + ")");
    dbTools.db.transaction(function(tx) {
        var flds = ["sel"];
        var vals = [sel];
        if (stageId == 1) {
            flds.push("sel0");
            vals.push(sel);
        }
        dbTools.sqlInsertUpdate(tx, "VisitSku", ["visitId", "skuId"], flds, [visitId, skuId], vals, 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitProductUpdate = function(visitId, skuId, sel0, sel, qntRest, qntOrder, onSuccess, onError) {
    log("visitProductUpdate(" + visitId + ", " + skuId + ", " + sel0 + ", " + sel + ", " + qntRest + ", " + qntOrder + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitSku", ["visitId", "skuId"], ["sel0", "sel", "qntRest", "qntOrder"], [visitId, skuId], [sel0, sel, qntRest, qntOrder], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
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

/*dbTools.visitActivityGet0 = function(visitPlanItemId, visitId, skuCatId, custId, stageId, activityId, activityShowAll, datasetGet) {
    log("visitActivityGet(" + visitPlanItemId + ", " + visitId + ", " + skuCatId + ", " + custId + ", " + stageId + ", " + activityId + ", " + activityShowAll + ")");
    if (visitId == null) {visitId = 0;}
    dbTools.db.transaction(function(tx) {
        var actSql = "";
        var sql = "";
        if (visitPlanItemId > 0) {
            actSql = "SELECT VSA.stageId AS stageId, VSA.activityId AS activityId, A.name AS name, VSA.mode, 1 AS blk, A.lvl AS lvl"
                + "      FROM VisitPlanItem VPI"
                + "      INNER JOIN VisitSchemaActivity VSA ON VPI.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE VPI.visitPlanItemId = @visitPlanItemId";
        } else if (visitId > 0) {
            actSql = "SELECT VSA.stageId AS stageId, VSA.activityId AS activityId, A.name AS name, VSA.mode, 1 AS blk, A.lvl AS lvl"
                + "      FROM Visit V"
                + "      INNER JOIN Cust C ON V.custId = C.custId"
                + "      INNER JOIN VisitSchemaActivity VSA ON C.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE V.visitId = @visitId";
        } else {
            actSql = "SELECT VSA.stageId AS stageId, VSA.activityId AS activityId, A.name AS name, VSA.mode, 1 AS blk, A.lvl AS lvl"
                + "      FROM Cust C"
                + "      INNER JOIN VisitSchemaActivity VSA ON C.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE C.custId = @custId";
        }
        sql = "SELECT A.stageId, A.activityId, A.name, A.mode, A.blk, COUNT(AC.skuCatId) AS skuCatCnt"
            + "  FROM"
            + "    (" + actSql;
        if (activityShowAll != 0) {
            sql += "    UNION ALL"
                + "      SELECT VSA0.stageId AS stageId, VSA0.activityId AS activityId, A.name AS name, VSA0.mode, 1 AS blk, A.lvl AS lvl"
                + "      FROM VisitSchemaActivity VSA0"
                + "      INNER JOIN Activity A ON VSA0.activityId = A.activityId"
                + "      LEFT JOIN (" + actSql + ") VSA ON VSA0.activityId = VSA.activityId AND VSA0.stageId = VSA.stageId"
                + "      WHERE VSA0.visitSchemaId = 0 AND VSA.activityId IS NULL";
        }
        sql += "    UNION ALL"
            + "     SELECT 1 AS stageId, 0 AS activityId, 'Первичный анализ' AS name, 0 AS mode, 0 AS blk, 0 AS lvl"
            + "     UNION ALL"
            + "     SELECT 2 AS stageId, 0 AS activityId, 'Основной анализ' AS name, 0 AS mode, 0 AS blk, 0 AS lvl"
            + "   ) A"
            + "  LEFT JOIN"
            + "    (SELECT 1 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 1 AS stageId, 3 AS activityId, VP.skuCatId"
            + "      FROM VisitPhoto VP"
            + "      WHERE VP.visitId = @visitId AND VP.stageId = 1"
            + "      GROUP BY VP.skuCatId"
            + "    UNION ALL"
            + "    SELECT 1 AS stageId, 14 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSku VS WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId AND VS.sel <> IFNULL(VS.sel0, 0)"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 2 AS activityId, P.skuCatId"
            + "      FROM VisitPlanogramAnswer VPA"
            + "      INNER JOIN PlanogramQuestion PQ ON VPA.planogramId = PQ.planogramId AND VPA.questionId = PQ.questionId"
            + "      INNER JOIN Planogram P ON PQ.planogramId = P.planogramId"
            + "      WHERE VPA.visitId = @visitId"
            + "      GROUP BY P.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 3 AS activityId, VP.skuCatId"
            + "      FROM VisitPhoto VP"
            + "      WHERE VP.visitId = @visitId AND VP.stageId = 2"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 4 AS activityId, VSC.skuCatId"
            + "      FROM VisitSkuCat VSC"
            + "      WHERE VSC.visitId = @visitId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 5 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSubTask VST WHERE VST.visitId = @visitId)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 6 AS activityId, VP.skuCatId"
            + "      FROM VisitPromo VP"
            + "      WHERE VP.visitId = @visitId"
            + "      GROUP BY VP.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 8 AS activityId, S.skuCatId"
            + "      FROM VisitSkuPrice VSP"
            + "      INNER JOIN Sku S ON VSP.skuId = S.skuId"
            + "      WHERE VSP.visitId = @visitId"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 11 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 2)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 12 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 1)"
            + "    ) AC ON A.stageId = AC.stageId AND A.activityId = AC.activityId AND (@skuCatId = -1 OR AC.skuCatId = @skuCatId)"
            + "  WHERE (@stageId = -1 OR A.stageId = @stageId) AND (@activityId = -1 OR A.activityId = @activityId)"
            + "  GROUP BY A.stageId, A.activityId, A.name, A.blk, A.lvl"
            + "  ORDER BY A.stageId, A.blk, A.lvl";
        sql = sql.replace(/@visitPlanItemId/g, visitPlanItemId).replace(/@visitId/g, visitId).replace(/@custId/g, (custId > 0 ? custId : 0)).replace(/@stageId/g, stageId)
            .replace(/@activityId/g, activityId).replace(/@skuCatId/g, skuCatId);
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}
*/
dbTools.visitActivityGet = function(visitPlanItemId, visitId, skuCatId, custId, dateBgn, stageId, activityId, activityShowAll, datasetGet) {
    log("visitActivityGet2(" + visitPlanItemId + ", " + visitId + ", " + skuCatId + ", " + custId + ", " + dateBgn + ", " + stageId + ", " + activityId + ", " + activityShowAll + ")");
    if (visitId == null) {visitId = 0;}
    dbTools.db.transaction(function(tx) {
        var actSql = "";
        var sql = "";
        if (visitPlanItemId > 0) {
            actSql = "SELECT VSA.stageId, VSA.activityId, A.name, VSA.mode, 1 AS blk, A.lvl"
                + "      FROM VisitPlanItem VPI"
                + "      INNER JOIN VisitSchemaActivity VSA ON VPI.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE VPI.visitPlanItemId = @visitPlanItemId";
        } else if (visitId > 0) {
            actSql = "SELECT VSA.stageId, VSA.activityId, A.name, VSA.mode, 1 AS blk, A.lvl"
                + "      FROM Visit V"
                + "      INNER JOIN Cust C ON V.custId = C.custId"
                + "      INNER JOIN VisitSchemaActivity VSA ON C.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE V.visitId = @visitId";
        } else {
            actSql = "SELECT VSA.stageId, VSA.activityId, A.name, VSA.mode, 1 AS blk, A.lvl"
                + "      FROM Cust C"
                + "      INNER JOIN VisitSchemaActivity VSA ON C.visitSchemaId = VSA.visitSchemaId"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE C.custId = @custId";
        }
        actSql += " UNION ALL"
            + "      SELECT 2 AS stageId, T.activityId, A.name AS name, 0 AS mode, 1 AS blk, A.lvl"
            + "        FROM Task T"
            + "        INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
            + "        INNER JOIN Activity A ON T.activityId = A.activityId"
            + "        WHERE TL.custId = @custId"
            + "          AND T.dateBgn <= @dateBgn AND T.dateEnd >= @dateBgn"
            + "      UNION ALL"
            + "      SELECT 2 AS stageId, A.activityId, A.name AS name, 0 AS mode, 1 AS blk, A.lvl AS lvl"
            + "        FROM Task T"
            + "        INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
            + "        CROSS JOIN (SELECT * FROM Activity WHERE activityId = 5) A"
            + "        WHERE IFNULL(T.activityId, 0) = 0"
            + "          AND TL.custId = @custId"
            + "          AND T.dateBgn <= @dateBgn AND T.dateEnd >= @dateBgn";
        if (activityShowAll != 0) {
            actSql += " UNION ALL"
                + "    SELECT VSA.stageId, VSA.activityId, A.name, VSA.mode, 1 AS blk, A.lvl"
                + "      FROM VisitSchemaActivity VSA"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      WHERE VSA.visitSchemaId = 0";
        } else {
            actSql += "  UNION ALL"
                + "    SELECT VSA.stageId, VSA.activityId, A.name, VSA.mode, 1 AS blk, A.lvl"
                + "      FROM VisitSchemaActivity VSA"
                + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
                + "      INNER JOIN"
                + "        (SELECT 2 AS stageId, 1 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSku WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 2 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitPlanogramAnswer WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 3 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitPhoto WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 4 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSkuCat WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 5 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSubTask WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 6 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitPromo WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 8 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSkuPrice WHERE visitId = @visitId)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 11 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 2)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 12 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 1)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 14 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitSku WHERE visitId = @visitId AND reasonId IS NOT NULL)"
                + "        UNION ALL"
                + "        SELECT 2 AS stageId, 16 AS activityId"
                + "          WHERE EXISTS(SELECT 1 FROM VisitOurPromo WHERE visitId = @visitId)"
                + "        ) VA ON VSA.stageId = VA.stageId AND VSA.activityId = VA.activityId"
                + "      WHERE VSA.visitSchemaId = 0";
        }
        /*actSql += " UNION ALL"
            + "     SELECT 1 AS stageId, 0 AS activityId, 'Первичный анализ' AS name, 0 AS mode, 0 AS blk, 0 AS lvl"
            + "     UNION ALL"
            + "     SELECT 2 AS stageId, 0 AS activityId, 'Основной анализ' AS name, 0 AS mode, 0 AS blk, 0 AS lvl";*/
        sql = "SELECT A.stageId, A.activityId, A.name, MAX(A.mode) AS mode, A.blk, COUNT(AC.skuCatId) AS skuCatCnt"
            + "  FROM"
            + "    (" + actSql
            + "   ) A"
            + "  LEFT JOIN"
            + "    (SELECT 1 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 1 AS stageId, 3 AS activityId, VP.skuCatId"
            + "      FROM VisitPhoto VP"
            + "      WHERE VP.visitId = @visitId AND VP.stageId = 1"
            + "      GROUP BY VP.skuCatId"
            + "    UNION ALL"
            + "    SELECT 1 AS stageId, 14 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSku VS WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId /*AND VS.sel <> IFNULL(VS.sel0, 0)*/"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 2 AS activityId, CP.skuCatId"
            + "      FROM VisitPlanogramAnswer VPA"
            + "      INNER JOIN Visit V ON VPA.visitId = V.visitId"
            + "      INNER JOIN PlanogramQuestion PQ ON VPA.planogramId = PQ.planogramId AND VPA.questionId = PQ.questionId"
            + "      INNER JOIN CustPlanogram CP ON V.custId = CP.custId AND PQ.planogramId = CP.planogramId"
            + "      WHERE VPA.visitId = @visitId"
            + "      GROUP BY CP.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 3 AS activityId, VP.skuCatId"
            + "      FROM VisitPhoto VP"
            + "      WHERE VP.visitId = @visitId AND VP.stageId = 2"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 4 AS activityId, VSC.skuCatId"
            + "      FROM VisitSkuCat VSC"
            + "      WHERE VSC.visitId = @visitId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 5 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSubTask VST WHERE VST.visitId = @visitId)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 6 AS activityId, VP.skuCatId"
            + "      FROM VisitPromo VP"
            + "      WHERE VP.visitId = @visitId"
            + "      GROUP BY VP.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 8 AS activityId, S.skuCatId"
            + "      FROM VisitSkuPrice VSP"
            + "      INNER JOIN Sku S ON VSP.skuId = S.skuId"
            + "      WHERE VSP.visitId = @visitId"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 11 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 2)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 12 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSurveyAnswer VSA INNER JOIN SurveyQuestion SQ ON VSA.questionId = SQ.questionId WHERE VSA.visitId = @visitId AND SQ.surveyId = 1)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 14 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSku VS WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 16 AS activityId, VP.skuCatId"
            + "      FROM VisitOurPromo VP"
            + "      WHERE VP.visitId = @visitId"
            + "      GROUP BY VP.skuCatId"
            + "    ) AC ON A.stageId = AC.stageId AND A.activityId = AC.activityId AND (@skuCatId = -1 OR AC.skuCatId = @skuCatId)"
            + "  WHERE (@stageId = -1 OR A.stageId = @stageId) AND (@activityId = -1 OR A.activityId = @activityId)"
            + "  GROUP BY A.stageId, A.activityId, A.name, A.blk, A.lvl"
            + "  ORDER BY A.stageId, A.blk, A.lvl";
        sql = sql.replace(/@visitPlanItemId/g, visitPlanItemId).replace(/@visitId/g, visitId).replace(/@custId/g, (custId > 0 ? custId : 0)).replace(/@stageId/g, stageId)
            .replace(/@activityId/g, activityId).replace(/@skuCatId/g, skuCatId).replace(/@dateBgn/g, "'" + dateToSqlDate(dateBgn) + "'");
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAnalysisResultsGet = function(visitId, fmtFilterType, fmtId, datasetGet) {
    log("visitAnalysisResultsGet(" + visitId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, S.name, S.code, VS.sel, VS.sel0,"
            + "    VS.qntRest, VS.qntOrder, VS.reasonId, IFNULL(R.name, '') AS reasonName, R.useQnt, VS.reasonQnt, R.useDate, VS.reasonDate"
            + "  FROM Sku S"
            + "  INNER JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + "  INNER JOIN Brand B ON BG.brandId = B.brandId"
            + "  LEFT JOIN VisitSku VS ON VS.visitId = ? AND S.skuId = VS.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE S.active = 1"
            + "    AND B.ext = 0"
            + "    AND (@fmtFilterType = 1 OR EXISTS(SELECT 1 FROM FmtSku WHERE fmtId = ? AND skuId = S.skuId))"
            + "    AND EXISTS(SELECT 1 FROM VisitSku VS1 INNER JOIN Sku S1 ON VS1.skuId = S1.skuId WHERE VS1.visitId = ? AND S1.skuCatId = S.skuCatId LIMIT 1)"
            + "    AND IFNULL(VS.sel, 0) = 0"
            + "  ORDER BY S.name";
        sql = sql.replace(/@fmtFilterType/g, fmtFilterType);
        tx.executeSql(sql, [visitId, fmtId, visitId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAnalysisResultGet = function(visitId, skuId, datasetGet) {
    log("visitAnalysisResultsGet(" + visitId + ", " + skuId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, S.name, S.code, IFNULL(S.code, '') || ' ' || S.name AS fullName, VS.sel, VS.sel0,"
            + "    IFNULL(VS.reasonId, 0) AS reasonId, R.name AS reasonName,"
            + "    R.useQnt, VS.reasonQnt, R.useDate, VS.reasonDate, VS.qntOrder"
            + "  FROM Sku S"
            + "  LEFT JOIN VisitSku VS ON VS.visitId = ? AND S.skuId = VS.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE S.skuId = ?";
        tx.executeSql(sql, [visitId, skuId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitReasonListGet = function(parentId, isEmptyRowShow, datasetGet) {
    log("visitReasonListGet(" + parentId + ", " + isEmptyRowShow + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT R.reasonId, R.name, R.parentId, R.useQnt, R.useDate, R.isParent"
            + "  FROM"
            + "    (SELECT R.reasonId, R.name, R.parentId, R.useQnt, R.useDate, RC.isParent, 1 AS blk, R.lvl"
            + "      FROM Reason R"
            + "      LEFT JOIN"
            + "        (SELECT parentId, MAX(1) AS isParent"
            + "          FROM Reason"
            + "          GROUP BY parentId"
            + "        ) RC ON R.reasonId = RC.parentId"
            + "      WHERE " + parentId + " = -1 AND R.parentId IS NULL OR R.parentId = ?"
            + "    UNION ALL"
            + "    SELECT 0 AS reasonId, 'Причина не выбрана' AS name, NULL AS parentId, NULL AS useQnt, NULL AS useDate, NULL AS isParent, 0 AS blk, 1 AS lvl"
            + "      WHERE " + isEmptyRowShow + " = 1"
            + "    ) R"
            + "  ORDER BY R.blk, R.lvl";
        tx.executeSql(sql, [parentId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitReasonGet = function(reasonId, datasetGet) {
    log("visitReasonGet(" + reasonId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT R.reasonId, R.name, R.parentId, R.useQnt, R.useDate"
            + "  FROM Reason R"
            + "  WHERE R.reasonId = ?";
        tx.executeSql(sql, [reasonId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAnalysisResultUpdate = function(visitId, skuId, reasonId, reasonQnt, reasonDate, qntOrder, onSuccess, onError) {
    log("visitAnalysisResultUpdate(" + visitId + ", " + skuId + ", " + reasonId + ", " + reasonQnt + ", " + reasonDate + ", " + qntOrder + ")");
    dbTools.db.transaction(function(tx) {
        if (!(reasonId > 0)) {
            reasonQnt = null;
            reasonDate = null;
            qntOrder = null;
        }
        dbTools.sqlInsertUpdate(tx, "VisitSku", ["visitId", "skuId"], ["reasonId", "reasonQnt", "reasonDate", "qntOrder"], [visitId, skuId], [reasonId, reasonQnt, dateToSqlDate(reasonDate), qntOrder], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitShelfShareGet = function(visitId, skuCatId, datasetGet) {
    log("visitShelfShareGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT V.visitId, ? AS skuCatId, CHSC.shelfShare AS shelfShareDef, VSC.shelfWidthTotal, VSC.shelfWidthOur, VSC.shelfShare"
            + "  FROM Visit V"
            + "  LEFT JOIN Cust C ON V.custId = C.custId"
            + "  LEFT JOIN ChainSkuCat CHSC ON C.chainId = CHSC.chainId AND CHSC.skuCatId = ?"
            + "  LEFT JOIN VisitSkuCat VSC ON V.visitId = VSC.visitId AND VSC.skuCatId = ?"
            + "  WHERE V.visitId = ?";
        tx.executeSql(sql, [skuCatId, skuCatId, skuCatId, visitId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitShelfShareUpdate = function(visitId, skuCatId, shelfShare, shelfWidthTotal, shelfWidthOur, onSuccess, onError) {
    log("visitShelfShareUpdate(" + visitId + ", " + skuCatId + ", " + shelfShare + ", " + shelfWidthTotal + ", " + shelfWidthOur + ")");
    dbTools.db.transaction(function(tx) {
        if (shelfShare != null || shelfWidthTotal != null || shelfWidthOur != null) {
            dbTools.sqlInsertUpdate(tx, "VisitSkuCat", ["visitId", "skuCatId"], ["shelfShare", "shelfWidthTotal", "shelfWidthOur"], [visitId, skuCatId], [shelfShare, shelfWidthTotal, shelfWidthOur], 
                function() {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}},
                onError
            );
        } else {
            dbTools.sqlDelete(tx, "VisitSkuCat", ["visitId", "skuCatId"], [visitId, skuCatId],
                function() {if (onSuccess != undefined) {onSuccess(visitId, skuCatId);}},
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPromoSubCatListGet = function(skuCatId, datasetGet) {
    log("visitPromoSubCatListGet(" + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT SSC.skuSubCatId, SSC.name"
            + "  FROM SkuSubCat SSC"
            + "  WHERE SSC.skuCatId = ?"
            + "  ORDER BY SSC.lvl, SSC.name";
        tx.executeSql(sql, [skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoBrandListGet = function(skuCatId, datasetGet) {
    log("visitPromoBrandListGet(" + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT B.brandId, B.name"
            + "  FROM Brand B "
            + "  INNER JOIN BrandSkuCat BSC ON B.brandId = BSC.brandId"
            + "  WHERE B.ext <> 0 AND BSC.skuCatId = ?"
            + "  ORDER BY B.name";
        tx.executeSql(sql, [skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoPromoGrpListGet = function(datasetGet) {
    log("visitPromoPromoGrpListGet()");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT PG.promoGrpId, PG.name FROM PromoGrp PG ORDER BY PG.lvl";
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoPromoListGet = function(promoGrpId, datasetGet) {
    log("visitPromoPromoListGet(" + promoGrpId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT P.promoId, P.name, P.extInfoKind, P.photoEnabled"
            + "  FROM Promo P"
            + "  WHERE P.promoGrpId = ?"
            + "  ORDER BY P.lvl";
        tx.executeSql(sql, [promoGrpId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoListGet = function(visitId, skuCatId, datasetGet) {
    log("visitPromoPromoListGet(" + visitId + ", " + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
            + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
            + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName"
            + "  FROM VisitPromo VP"
            + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
            + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
            + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
            + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
            + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
            + "  WHERE VP.visitId = ?"
            + "    AND VP.skuCatId = ?";
        tx.executeSql(sql, [visitId, skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoGet = function(visitPromoId, visitId, skuCatId, skuSubCatId, brandId, promoId, datasetGet) {
    log("visitPromoGet(" + visitPromoId + ", " + visitId + ", " + skuCatId + ", " + skuSubCatId + ", " + brandId + ", " + promoId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "";
        var params = [];
        if (visitPromoId > 0) {
            sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
                + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitPromoPhotoCnt"
                + "  FROM VisitPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
                + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitPromoId, COUNT(*) AS visitPromoPhotoCnt FROM VisitPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitPromoId) VPP ON VP.visitPromoId = VPP.visitPromoId"
                + "  WHERE VP.visitPromoId = ?";
            params = [visitPromoId];
        } else {
            sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
                + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitPromoPhotoCnt"
                + "  FROM VisitPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
                + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitPromoId, COUNT(*) AS visitPromoPhotoCnt FROM VisitPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitPromoId) VPP ON VP.visitPromoId = VPP.visitPromoId"
                + "  WHERE VP.visitId = ? AND VP.skuCatId = ? AND VP.skuSubCatId = ? AND VP.brandId = ? AND VP.promoId = ?";
            params = [visitId, skuCatId, skuSubCatId, brandId, promoId];
        }
        tx.executeSql(sql, params, datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoUpdate = function(visitId, visitPromoId, skuCatId, skuSubCatId, brandId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName, onSuccess, onError) {
    log("visitPromoUpdate(" + visitId + ", " + visitPromoId + ", " + skuCatId + ", " + skuSubCatId + ", " + brandId + ", " + promoId + ", " + extInfoType + ", " + extInfoVal + ", " + extInfoVal2 + ", " + extInfoName + ")");
    dbTools.db.transaction(function(tx) {
        if (visitPromoId > 0) {
            if (visitId != null || skuCatId != null || skuSubCatId != null || brandId != null 
                    || promoId != null || extInfoVal != null || extInfoVal2 != null || extInfoName != null) {
                dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "skuSubCatId", "brandId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                        [visitPromoId], [visitId, skuCatId, skuSubCatId, brandId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                    function() {if (onSuccess != undefined) {onSuccess(visitPromoId);}},
                    onError
                );
            } else {
                dbTools.sqlDelete(tx, "VisitPromo", ["visitPromoId"], [visitPromoId],
                    function() {if (onSuccess != undefined) {onSuccess(visitPromoId);}},
                    onError
                );
            }
        } else {
            dbTools.visitPromoGet(visitPromoId, visitId, skuCatId, skuSubCatId, brandId, promoId, 
                function(tx, rs) {
                    if (rs.rows.length > 0) {
                        visitPromoId = rs.rows.item(0).visitPromoId;
                        dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "skuSubCatId", "brandId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                [visitPromoId], [visitId, skuCatId, skuSubCatId, brandId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                            function() {if (onSuccess != undefined) {onSuccess(visitPromoId);}},
                            onError
                        );
                    } else {
                        dbTools.tableNextIdGet(tx, "VisitPromo", 
                            function(tx, visitPromoId) {
                                dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "skuSubCatId", "brandId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                        [visitPromoId], [visitId, skuCatId, skuSubCatId, brandId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                                    function() {if (onSuccess != undefined) {onSuccess(visitPromoId);}},
                                    onError
                                );
                            }, 
                            onError
                        );
                    }
                }
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPromoPhotoListGet = function(visitPromoId, datasetGet) {
    log("visitPromoPhotoListGet(" + visitPromoId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VPP.visitPromoId, VPP.visitPromoPhotoId, VPP.fileId"
            + "  FROM VisitPromoPhoto VPP"
            + "  WHERE VPP.visitPromoId = ?";
        tx.executeSql(sql, [visitPromoId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoPhotoUpdate = function(visitId, visitPromoId, visitPromoPhotoId, fileId, onSuccess, onError) {
    log("visitPromoPhotoUpdate(" + visitId + ", " + visitPromoId + ", " + visitPromoPhotoId + ", " + fileId + ")");
    dbTools.db.transaction(function(tx) {
        if (visitPromoPhotoId > 0) {
                dbTools.sqlInsertUpdate(tx, "VisitPromoPhoto", ["visitPromoPhotoId"], ["visitId", "visitPromoId", "fileId"], [visitPromoPhotoId], [visitId, visitPromoId, fileId], 
                    function() {if (onSuccess != undefined) {onSuccess(visitPromoPhotoId);}},
                    onError
                );
        } else {
            dbTools.tableNextIdGet(tx, "VisitPromoPhoto", 
                function(tx, visitPromoPhotoId) {
                    dbTools.sqlInsertUpdate(tx, "VisitPromoPhoto", ["visitPromoPhotoId"], ["visitId", "visitPromoId", "fileId"], [visitPromoPhotoId], [visitId, visitPromoId, fileId], 
                        function() {if (onSuccess != undefined) {onSuccess(visitPromoPhotoId);}},
                        onError
                    );
                }, 
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitOurPromoListGet = function(visitId, skuCatId, datasetGet) {
    log("visitOurPromoPromoListGet(" + visitId + ", " + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitId, VP.visitOurPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
            + "    P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
            + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName"
            + "  FROM VisitOurPromo VP"
            + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
            + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
            + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
            + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
            + "  WHERE VP.visitId = ?"
            + "    AND VP.skuCatId = ?";
        tx.executeSql(sql, [visitId, skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitOurPromoGet = function(visitOurPromoId, visitId, skuCatId, skuSubCatId, promoId, datasetGet) {
    log("visitOurPromoGet(" + visitOurPromoId + ", " + visitId + ", " + skuCatId + ", " + skuSubCatId + ", " + promoId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "";
        var params = [];
        if (visitOurPromoId > 0) {
            sql = "SELECT VP.visitId, VP.visitOurPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
                + "    P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitOurPromoPhotoCnt"
                + "  FROM VisitOurPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitOurPromoId, COUNT(*) AS visitOurPromoPhotoCnt FROM VisitOurPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitOurPromoId) VPP ON VP.visitOurPromoId = VPP.visitOurPromoId"
                + "  WHERE VP.visitOurPromoId = ?";
            params = [visitOurPromoId];
        } else {
            sql = "SELECT VP.visitId, VP.visitOurPromoId, VP.skuCatId, SC.name AS skuCatName, VP.skuSubCatId, SSC.name AS skuSubCatName,"
                + "    P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, P.photoEnabled, VP.extInfoType, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitOurPromoPhotoCnt"
                + "  FROM VisitOurPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN SkuSubCat SSC ON VP.skuSubCatId = SSC.skuSubCatId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitOurPromoId, COUNT(*) AS visitOurPromoPhotoCnt FROM VisitOurPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitOurPromoId) VPP ON VP.visitOurPromoId = VPP.visitOurPromoId"
                + "  WHERE VP.visitId = ? AND VP.skuCatId = ? AND VP.skuSubCatId = ? AND VP.promoId = ?";
            params = [visitId, skuCatId, skuSubCatId, promoId];
        }
        tx.executeSql(sql, params, datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitOurPromoUpdate = function(visitId, visitOurPromoId, skuCatId, skuSubCatId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName, onSuccess, onError) {
    log("visitOurPromoUpdate(" + visitId + ", " + visitOurPromoId + ", " + skuCatId + ", " + skuSubCatId + ", " + promoId + ", " + extInfoType + ", " + extInfoVal + ", " + extInfoVal2 + ", " + extInfoName + ")");
    dbTools.db.transaction(function(tx) {
        if (visitOurPromoId > 0) {
            if (visitId != null || skuCatId != null || skuSubCatId != null
                    || promoId != null || extInfoVal != null || extInfoVal2 != null || extInfoName != null) {
                dbTools.sqlInsertUpdate(tx, "VisitOurPromo", ["visitOurPromoId"], ["visitId", "skuCatId", "skuSubCatId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                        [visitOurPromoId], [visitId, skuCatId, skuSubCatId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                    function() {if (onSuccess != undefined) {onSuccess(visitOurPromoId);}},
                    onError
                );
            } else {
                dbTools.sqlDelete(tx, "VisitOurPromo", ["visitOurPromoId"], [visitOurPromoId],
                    function() {if (onSuccess != undefined) {onSuccess(visitOurPromoId);}},
                    onError
                );
            }
        } else {
            dbTools.visitOurPromoGet(visitOurPromoId, visitId, skuCatId, skuSubCatId, promoId, 
                function(tx, rs) {
                    if (rs.rows.length > 0) {
                        visitOurPromoId = rs.rows.item(0).visitOurPromoId;
                        dbTools.sqlInsertUpdate(tx, "VisitOurPromo", ["visitOurPromoId"], ["visitId", "skuCatId", "skuSubCatId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                [visitOurPromoId], [visitId, skuCatId, skuSubCatId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                            function() {if (onSuccess != undefined) {onSuccess(visitOurPromoId);}},
                            onError
                        );
                    } else {
                        dbTools.tableNextIdGet(tx, "VisitOurPromo", 
                            function(tx, visitOurPromoId) {
                                dbTools.sqlInsertUpdate(tx, "VisitOurPromo", ["visitOurPromoId"], ["visitId", "skuCatId", "skuSubCatId", "promoId", "extInfoType", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                        [visitOurPromoId], [visitId, skuCatId, skuSubCatId, promoId, extInfoType, extInfoVal, extInfoVal2, extInfoName], 
                                    function() {if (onSuccess != undefined) {onSuccess(visitOurPromoId);}},
                                    onError
                                );
                            }, 
                            onError
                        );
                    }
                }
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitOurPromoPhotoListGet = function(visitOurPromoId, datasetGet) {
    log("visitOurPromoPhotoListGet(" + visitOurPromoId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VPP.visitOurPromoId, VPP.visitOurPromoPhotoId, VPP.fileId"
            + "  FROM VisitOurPromoPhoto VPP"
            + "  WHERE VPP.visitOurPromoId = ?";
        tx.executeSql(sql, [visitOurPromoId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitOurPromoPhotoUpdate = function(visitId, visitOurPromoId, visitOurPromoPhotoId, fileId, onSuccess, onError) {
    log("visitOurPromoPhotoUpdate(" + visitId + ", " + visitOurPromoId + ", " + visitOurPromoPhotoId + ", " + fileId + ")");
    dbTools.db.transaction(function(tx) {
        if (visitOurPromoPhotoId > 0) {
                dbTools.sqlInsertUpdate(tx, "VisitOurPromoPhoto", ["visitOurPromoPhotoId"], ["visitId", "visitOurPromoId", "fileId"], [visitOurPromoPhotoId], [visitId, visitOurPromoId, fileId], 
                    function() {if (onSuccess != undefined) {onSuccess(visitOurPromoPhotoId);}},
                    onError
                );
        } else {
            dbTools.tableNextIdGet(tx, "VisitOurPromoPhoto", 
                function(tx, visitOurPromoPhotoId) {
                    dbTools.sqlInsertUpdate(tx, "VisitOurPromoPhoto", ["visitOurPromoPhotoId"], ["visitId", "visitOurPromoId", "fileId"], [visitOurPromoPhotoId], [visitId, visitOurPromoId, fileId], 
                        function() {if (onSuccess != undefined) {onSuccess(visitOurPromoPhotoId);}},
                        onError
                    );
                }, 
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitSurveyAnswerListGet = function(visitId, surveyId, datasetGet) {
    log("visitSurveyAnswerListGet(" + visitId + ", " + surveyId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT A.surveyId, A.questionId, A.name, A.answerType, A.parentId, A.treeLvl, A.answer, IFNULL(A.note, '') AS note, A.isShowKpi, A.kpi, A.k, A.answerMax"
            + "  FROM"
            + "    (SELECT SQ.surveyId, SQ.questionId, SQ.name, SQ.answerType, SQ.parentId, "
            + "        CASE WHEN SQ.parentId IS NULL THEN 1 ELSE 2 END AS treeLvl, VSA.answer, VSA.note,"
            + "        CASE WHEN SQ.surveyId = 1 THEN 1 ELSE 0 END AS isShowKpi,"
            + "        CASE WHEN SQ.surveyId = 1 AND SQ.parentId IS NOT NULL "
            + "          THEN SQ.weight / SQP.ttlWeight * SQP.weight / SQT.ttlParentWeight * VSA.answer / CASE WHEN SQ.answerType = 1 THEN 1 "
            + "          ELSE 5 END ELSE NULL "
            + "        END AS kpi,"
            + "        CASE WHEN SQ.surveyId = 1 AND SQ.parentId IS NOT NULL THEN SQ.weight / SQP.ttlWeight * SQP.weight / SQT.ttlParentWeight ELSE NULL END AS k, "
            + "        CASE WHEN SQ.answerType = 1 THEN 1 ELSE 5 END AS answerMax,"
            + "        SQP.lvl AS lvlParent, SQ.lvl"
            + "      FROM SurveyQuestion SQ"
            + "      LEFT JOIN VisitSurveyAnswer VSA ON VSA.visitId = ? AND SQ.questionId = VSA.questionId"
            + "      LEFT JOIN "
            + "        (SELECT SQP.questionId, SQP.weight, SQP.lvl, SUM(SQ.weight) AS ttlWeight"
            + "          FROM SurveyQuestion SQ"
            + "          INNER JOIN SurveyQuestion SQP ON SQ.parentId = SQP.questionId"
            + "          GROUP BY SQP.questionId, SQP.weight, SQP.lvl"
            + "        ) SQP ON IFNULL(SQ.parentId, SQ.questionId) = SQP.questionId"
            + "      LEFT JOIN "
            + "        (SELECT SQ.surveyId, SUM(SQ.weight) AS ttlParentWeight"
            + "          FROM SurveyQuestion SQ"
            + "          WHERE SQ.parentId IS NULL"
            + "          GROUP BY SQ.surveyId"
            + "        ) SQT ON SQ.surveyId = SQT.surveyId"
            + "      WHERE SQ.surveyId = ?"
            + "    UNION ALL"
            + "    SELECT @surveyId AS surveyId, 0 AS questionId, 'KPI' AS name, NULL AS answerType, NULL AS parentId,"
            + "        0 AS treeLvl, NULL AS answer, NULL AS note,"
            + "        1 AS isShowKpi,"
            + "        NULL AS kpi,"
            + "        NULL AS k, NULL AS answerMax, 0 AS lvlParent, 0 AS lvl"
            + "      WHERE @surveyId = 1"
            + "        AND 1 <> 1"
            + "  ) A"
            + "  ORDER BY IFNULL(A.lvlParent, A.lvl), A.lvl, A.questionId";
        sql = sql.replace(/@surveyId/g, surveyId);
        tx.executeSql(sql, [visitId, surveyId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSurveyAnswerGet = function(visitId, questionId, datasetGet) {
    log("visitSurveyAnswerGet(" + visitId + ", " + questionId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT SQ.surveyId, SQ.questionId, SQ.name, SQ.answerType, VSA.answer, VSA.note"
            + "  FROM SurveyQuestion SQ"
            + "  LEFT JOIN VisitSurveyAnswer VSA ON VSA.visitId = ? AND SQ.questionId = VSA.questionId"
            + "  WHERE SQ.questionId = ?";
        tx.executeSql(sql, [visitId, questionId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSurveyAnswerUpdate = function(visitId, questionId, fieldNames, fieldValues, onSuccess, onError) {
    log("visitSurveyAnswerUpdate(" + visitId + ", " + questionId + ", " + kendo.stringify(fieldNames) + ", " + kendo.stringify(fieldValues) + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitSurveyAnswer", ["visitId", "questionId"], fieldNames, [visitId, questionId], fieldValues, 
            function() {if (onSuccess != undefined) {onSuccess(visitId, questionId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

/*dbTools.visitTaskListGet = function(dateBgn, custId, skuCatId, datasetGet) {
    log("visitTaskListGet('" + dateToSqlDate(dateBgn) + "', " + custId + ", " + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT T.taskId, T.descr, T.nExec, VTT.doneCnt, CASE WHEN VTT.doneCnt >= T.nExec THEN 1 ELSE 0 END AS taskDone, VT.done, IFNULL(VT.note, '') AS note"
            + "  FROM Task T"
            + "  INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
            + "  LEFT JOIN Visit V ON V.custId = TL.custId AND V.dateBgn = ?"
            + "  LEFT JOIN VisitTask VT ON V.visitId = VT.visitId AND TL.taskId = VT.taskId AND TL.skuCatId = VT.skuCatId"
            + "  LEFT JOIN"
            + "    (SELECT VT.taskId, V.custId, VT.skuCatId, COUNT(*) AS doneCnt"
            + "      FROM VisitTask VT"
            + "      INNER JOIN Visit V ON VT.visitId = V.visitId"
            + "      WHERE VT.done <> 0"
            + "      GROUP BY VT.taskId, V.custId, VT.skuCatId"
            + "    ) VTT ON TL.taskId = VTT.taskId AND TL.custId = VTT.custId AND TL.skuCatId = VTT.skuCatId"
            + "  WHERE T.dateBgn <= ? AND T.dateEnd >= ?"
            + "    AND IFNULL(T.activityId, 0) = 0"
            + "    AND TL.custId = ?"
            + "    AND TL.skuCatId = ?"
            + "  ORDER BY T.descr";
        var dateBgnSql = dateToSqlDate(dateBgn);
        tx.executeSql(sql, [dateBgnSql, dateBgnSql, dateBgnSql, custId, skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitTaskGet = function(visitId, skuCatId, taskId, datasetGet) {
    log("visitTaskListGet(" + visitId + ", " + skuCatId + ", " + taskId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT T.taskId, T.descr, VT.done, VT.note"
            + "  FROM Task T"
            + "  LEFT JOIN VisitTask VT ON VT.visitId = ? AND VT.skuCatId = ? AND T.taskId = VT.taskId"
            + "  WHERE T.taskId = ?";
        tx.executeSql(sql, [visitId, skuCatId, taskId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitTaskUpdate = function(visitId, skuCatId, taskId, done, note, onSuccess, onError) {
    log("visitTaskUpdate(" + visitId + ", " + skuCatId + ", " + taskId + ", " + done + ", " + note + ")");
    dbTools.db.transaction(function(tx) {
        if (done != null || note != null) {
            dbTools.sqlInsertUpdate(tx, "VisitTask", ["visitId", "skuCatId", "taskId"], ["done", "note"], [visitId, skuCatId, taskId], [done, note], 
                function() {if (onSuccess != undefined) {onSuccess(visitId, skuCatId, taskId);}},
                onError
            );
        } else {
            dbTools.sqlDelete(tx, "VisitTask", ["visitId", "skuCatId", "taskId"], [visitId, skuCatId, taskId],
                function() {if (onSuccess != undefined) {onSuccess(visitId, skuCatId, taskId);}},
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitTaskDoneUpdate = function(visitId, skuCatId, taskId, done, onSuccess, onError) {
    log("visitTaskDoneUpdate(" + visitId + ", " + skuCatId + ", " + taskId + ", " + done + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitTask", ["visitId", "skuCatId", "taskId"], ["done"], [visitId, skuCatId, taskId], [done], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuCatId, taskId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}
*/
dbTools.visitTaskListGet = function(dateBgn, custId, datasetGet) {
    log("visitTaskListGet('" + dateToSqlDate(dateBgn) + "', " + custId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT T.taskId, T.descr, T.fileId"
            + "  FROM Task T "
            + "  INNER JOIN TaskLink TL ON T.taskId = TL.taskId "
            + "  WHERE T.dateBgn <= ? AND T.dateEnd >= ? "
            + "    AND IFNULL(T.activityId, 0) = 0 "
            + "    AND TL.custId = ? "
            + "  ORDER BY T.descr ";
        var dateBgnSql = dateToSqlDate(dateBgn);
        tx.executeSql(sql, [dateBgnSql, dateBgnSql, custId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitTaskGet = function(visitId, taskId, datasetGet) {
    log("visitTaskGet(" + visitId + ", " + taskId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VT.taskId, VT.note"
            + "  FROM VisitTask VT"
            + "  WHERE VT.visitId = ? AND VT.taskId = ?";
        tx.executeSql(sql, [visitId, taskId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitTaskUpdate = function(visitId, taskId, note, onSuccess, onError) {
    log("visitTaskUpdate(" + visitId + ", " + taskId + ", '" + note + "')");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitTask", ["visitId", "taskId"], ["note"], [visitId, taskId], [note], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, taskId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitSubTaskListGet = function(visitId, taskId, datasetGet) {
    log("visitSubTaskListGet(" + visitId + ", " + taskId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT ST.taskId, ST.subTaskId, ST.name, VST.done"
            + "  FROM SubTask ST"
            + "  LEFT JOIN VisitSubTask VST ON VST.visitId = ? AND ST.subTaskId = VST.subTaskId"
            + "  WHERE ST.taskId = ?"
            + "  ORDER BY ST.name, ST.subTaskId";
        tx.executeSql(sql, [visitId, taskId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSubTaskDoneUpdate = function(visitId, taskId, subTaskId, done, onSuccess, onError) {
    log("visitSubTaskDoneUpdate(" + visitId + ", " + taskId + ", " + subTaskId + ", " + done + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitSubTask", ["visitId", "subTaskId"], ["done"], [visitId, subTaskId], [done], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, taskId, subTaskId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitSkuPriceListGet = function(visitId, skuCatId, mode, skuId, datasetGet) {
    log("visitTaskListGet(" + visitId + ", " + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, CASE WHEN B.ext = 0 THEN IFNULL(S.code, '') ELSE '' END AS code, S.name, IFNULL(SP.name, '') AS suppName, B.ext, S.lvl, IFNULL(VSP.price, 0) AS price"
            + "  FROM "
            + "    (SELECT S.*, 1 AS lvl"
            + "      FROM Sku S"
            + "      WHERE @mode = 1"
            + "        AND S.skuId IN (SELECT dstSkuId FROM skuLink)"
            + "    UNION ALL"
            + "    SELECT S.*, 2 AS lvl"
            + "      FROM Sku S"
            + "      WHERE @mode = 1"
            + "        AND S.skuId NOT IN (SELECT skuId FROM skuLink)"
            + "        AND S.skuId NOT IN (SELECT dstSkuId FROM skuLink)"
            + "    UNION ALL"
            + "    SELECT S.*, 1 AS lvl"
            + "      FROM Sku S"
            + "      WHERE @mode = 2"
            + "        AND S.skuId = @skuId"
            + "    UNION ALL"
            + "    SELECT S.*, 2 AS lvl"
            + "      FROM Sku S"
            + "      WHERE @mode = 2"
            + "        AND S.skuId IN (SELECT skuId FROM skuLink WHERE dstSkuId = @skuId)"
            + "        AND S.skuId <> @skuId"
            + "    ) S"
            + "  LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + "  LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + "  LEFT JOIN Supp SP ON S.suppId = SP.suppId"
            + "  LEFT JOIN VisitSkuPrice VSP ON VSP.visitId = @visitId AND S.skuId = VSP.skuId"
            + "  WHERE S.pAudit <> 0 AND S.active = 1"
            + "    AND S.skuCatId = @skuCatId"
            + "  ORDER BY CASE WHEN B.ext = 0 THEN 0 ELSE 1 END, S.lvl, S.name";
        sql = sql.replace(/@mode/g, mode).replace(/@skuId/g, skuId).replace(/@visitId/g, visitId).replace(/@skuCatId/g, skuCatId);
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSkuPriceGet = function(visitId, skuId, datasetGet) {
    log("visitSkuPriceGet(" + visitId + ", " + skuId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, CASE WHEN B.ext = 0 THEN IFNULL(S.code, '') ELSE '' END AS code, S.name, IFNULL(SP.name, '') AS suppName, VSP.price"
            + "  FROM Sku S"
            + "  LEFT JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
            + "  LEFT JOIN Brand B ON BG.brandId = B.brandId"
            + "  LEFT JOIN Supp SP ON S.suppId = SP.suppId"
            + "  LEFT JOIN VisitSkuPrice VSP ON VSP.visitId = ? AND S.skuId = VSP.skuId"
            + "  WHERE S.skuId = ?";
        tx.executeSql(sql, [visitId, skuId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSkuPriceUpdate = function(visitId, skuId, mode, lvl, price, onSuccess, onError) {
    log("visitSkuPriceUpdate(" + visitId + ", " + skuId + ", " + mode + ", " + lvl + ", " + price + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitSkuPrice", ["visitId", "skuId"], ["price"], [visitId, skuId], [price], 
            function() {if (onSuccess != undefined) {if (lvl != 1) {onSuccess(visitId, skuId);}}},
            onError
        );
        if (mode == 1 && lvl == 1) {
            tx.executeSql("SELECT skuId FROM SkuLink WHERE dstSkuId = ?", [skuId], 
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        dbTools.sqlInsertUpdate(tx, "VisitSkuPrice", ["visitId", "skuId"], ["price"], [visitId, rs.rows.item(i).skuId], [price], 
                            function() {if (onSuccess != undefined) {if (i == rs.rows.length - 1) {onSuccess(visitId, rs.rows.item(i).skuId);}}},
                            onError
                        );
                    }
                }, 
                dbTools.onSqlError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPhotoListGet = function(visitId, stageId, skucatId, datasetGet) {
    log("visitPhotoListGet(" + visitId + ", " + stageId + ", " + skucatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitPhotoId, VP.visitId, VP.stageId, VP.skuCatId, VP.fileId"
            + "  FROM VisitPhoto VP"
            + "  WHERE VP.visitId = ? AND VP.stageId = ? AND VP.skuCatId = ?";
        tx.executeSql(sql, [visitId, stageId, skucatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPhotoUpdate = function(visitPhotoId, visitId, stageId, skucatId, fileId, onSuccess, onError) {
    log("visitPhotoUpdate(" + visitPhotoId + ", " + visitId + ", " + stageId + ", " + skucatId + ", " + fileId + ")");
    dbTools.db.transaction(function(tx) {
        if (visitPhotoId > 0) {
                dbTools.sqlInsertUpdate(tx, "VisitPhoto", ["visitPhotoId"], ["visitId", "stageId", "skucatId", "fileId"], [visitPhotoId], [visitId, stageId, skucatId, fileId], 
                    function() {if (onSuccess != undefined) {onSuccess(visitPhotoId);}},
                    onError
                );
        } else {
            dbTools.tableNextIdGet(tx, "VisitPhoto", 
                function(tx, visitPhotoId) {
                    dbTools.sqlInsertUpdate(tx, "VisitPhoto", ["visitPhotoId"], ["visitId", "stageId", "skucatId", "fileId"], [visitPhotoId], [visitId, stageId, skucatId, fileId], 
                        function() {if (onSuccess != undefined) {onSuccess(visitPhotoId);}},
                        onError
                    );
                }, 
                onError
            );
        }
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPlanogramListGet = function(custId, stageId, skuCatId, datasetGet) {
    log("visitPlanogramListGet(" + custId + ", " + stageId + ", " + skuCatId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT P.planogramId, P.name, P.code, P.fileId"
            + "    FROM Planogram P"
            + "    INNER JOIN CustPlanogram CP ON P.planogramId = CP.planogramId"
            + "    WHERE CP.custId = ? AND CP.skuCatId = ?";
        tx.executeSql(sql, [custId, skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPlanogramAnswerListGet = function(visitId, planogramId, datasetGet) {
    log("visitPlanogramAnswerListGet(" + visitId + ", " + planogramId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT PQ.planogramId, PQ.questionId, PQ.name, VPA.answer"
            + "  FROM PlanogramQuestion PQ"
            + "  LEFT JOIN VisitPlanogramAnswer VPA ON VPA.visitId = ? AND PQ.planogramId = VPA.planogramId AND PQ.questionId = VPA.questionId"
            + "  WHERE PQ.planogramId = ?"
            + "  ORDER BY PQ.lvl, PQ.questionId";
        tx.executeSql(sql, [visitId, planogramId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPlanogramAnswerUpdate = function(visitId, planogramId, questionId, answer, onSuccess, onError) {
    log("visitPlanogramAnswerUpdate(" + visitId + ", " + planogramId + ", " + questionId + ", " + answer + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitPlanogramAnswer", ["visitId", "planogramId", "questionId"], ["answer"], [visitId, planogramId, questionId], [answer], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, planogramId, questionId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPlanogramGet = function(visitId, planogramId, datasetGet) {
    log("visitPlanogramGet(" + visitId + ", " + planogramId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.planogramId, VP.note"
            + "  FROM VisitPlanogram VP"
            + "  WHERE VP.visitId = ? AND VP.planogramId = ?";
        tx.executeSql(sql, [visitId, planogramId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPlanogramUpdate = function(visitId, planogramId, note, onSuccess, onError) {
    log("visitPlanogramUpdate(" + visitId + ", " + planogramId + ", '" + note + "')");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitPlanogram", ["visitId", "planogramId"], ["note"], [visitId, planogramId], [note], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, planogramId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitPhotoTagListGet = function(visitPhotoId, datasetGet) {
    log("visitPhotoTagListGet(" + visitPhotoId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT PT.photoTagId, PT.name, VPT.value"
            + "  FROM PhotoTag PT"
            + "  LEFT JOIN VisitPhotoTag VPT ON VPT.visitPhotoId = ? AND PT.photoTagId = VPT.photoTagId"
            + "  ORDER BY PT.name";
        tx.executeSql(sql, [visitPhotoId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPhotoTagUpdate = function(visitId, visitPhotoId, photoTagId, value, onSuccess, onError) {
    log("visitPhotoTagUpdate(" + visitId + ", " + visitPhotoId + ", " + photoTagId + ", " + value + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitPhotoTag", ["visitPhotoId", "photoTagId"], ["visitId", "value"], [visitPhotoId, photoTagId], [visitId, value], 
            function() {if (onSuccess != undefined) {onSuccess(visitPhotoId, photoTagId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitReportBlkListGet = function(visitId, datasetGet) {
    log("visitReportBlkListGet(" + visitId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT A.blkId, A.name"
            + "  FROM"
            + "    (SELECT 1 AS blkId, 'Новинки' AS name, 1 AS blk"
            + "    UNION ALL"
            + "    SELECT 2 AS blkId, 'ООС' AS name, 2 AS blk"
            + "    UNION ALL"
            + "    SELECT 3 AS blkId, 'Планограммы' AS name, 3 AS blk"
            + "    UNION ALL"
            + "    SELECT 4 AS blkId, 'Доля на полке' AS name, 4 AS blk"
            + "    UNION ALL"
            + "    SELECT 5 AS blkId, 'Промо' AS name, 5 AS blk"
            + "    UNION ALL"
            + "    SELECT 6 AS blkId, 'Прочие задачи' AS name, 6 AS blk"
            + "    ) A"
            + "  ORDER BY A.blk";
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitReportBlkContentListGet = function(visitId, blkId, datasetGet) {
    log("visitReportBlkContentListGet(" + visitId + ", " + blkId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "";
        switch (blkId) {
            case 1:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, A.isLink AS isLink, A.activityId AS activityId, A.skuCatId AS skuCatId, A.id AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT 1 AS lvl, 1 AS isLink, 1 AS activityId, S.skuCatId, S.skuId AS id,"
                    + "        CASE WHEN S.code IS NOT NULL THEN S.code || ' ' ELSE '' END || S.name || ' - ' || CASE WHEN VS.sel <> 0 THEN 'есть' ELSE 'нет' END AS name, "
                    + "        S.name AS nameSort,"
                    + "        CASE WHEN VS.sel <> 0 THEN 1 ELSE 0 END AS doneValue,"
                    + "        1 AS ttlValue,"
                    + "        CASE WHEN VS.sel <> 0 THEN 0 ELSE 1 END AS mark"
                    + "      FROM Sku S"
                    + "      INNER JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
                    + "      INNER JOIN Brand B ON BG.brandId = B.brandId"
                    + "      LEFT JOIN VisitSku VS ON VS.visitId = @visitId AND S.skuId = VS.skuId"
                    + "      WHERE S.active <> 0 AND S.new <> 0"
                    + "        AND B.ext = 0"
                    + "        AND EXISTS"
                    + "          (SELECT 1"
                    + "            FROM FmtSku FS"
                    + "            INNER JOIN Cust C ON FS.fmtId = C.fmtId"
                    + "            INNER JOIN Visit V ON C.custId = V.custId"
                    + "            WHERE V.visitId = @visitId"
                    + "              AND FS.skuId = S.skuId"
                    + "          )"
                    + "    ) A"
                    + "  ORDER BY A.lvl, A.nameSort, A.name";
                break;
            case 2:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, A.isLink AS isLink, A.activityId AS activityId, A.skuCatId AS skuCatId, A.id AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT 1 AS lvl, 1 AS isLink, 14 AS activityId, S.skuCatId, S.skuId AS id,"
                    + "        CASE WHEN S.code IS NOT NULL THEN S.code || ' ' ELSE '' END || S.name || ' - ' || CASE WHEN VS.sel <> 0 THEN 'есть' ELSE 'нет' END AS name, "
                    + "        S.name AS nameSort,"
                    + "        CASE WHEN VS.sel <> 0 THEN 1 ELSE 0 END AS doneValue,"
                    + "        1 AS ttlValue,"
                    + "        CASE WHEN VS.sel <> 0 THEN 0 ELSE 1 END AS mark"
                    + "      FROM Sku S"
                    + "      INNER JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
                    + "      INNER JOIN Brand B ON BG.brandId = B.brandId"
                    + "      LEFT JOIN VisitSku VS ON VS.visitId = @visitId AND S.skuId = VS.skuId"
                    + "      WHERE S.active <> 0"
                    + "        AND B.ext = 0"
                    + "        AND EXISTS"
                    + "          (SELECT 1"
                    + "            FROM FmtSku FS"
                    + "            INNER JOIN Cust C ON FS.fmtId = C.fmtId"
                    + "            INNER JOIN Visit V ON C.custId = V.custId"
                    + "            WHERE V.visitId = @visitId"
                    + "              AND FS.skuId = S.skuId"
                    + "          )"
                    + "        AND EXISTS(SELECT 1 FROM VisitSku VS1 INNER JOIN Sku S1 ON VS1.skuId = S1.skuId WHERE VS1.visitId = @visitId AND S1.skuCatId = S.skuCatId LIMIT 1)"
                    + "        /*AND IFNULL(VS.sel, 0) = 0*/"
                    + "    ) A"
                    + "  ORDER BY A.lvl, A.nameSort, A.name";
                break;
            case 200:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, A.isLink AS isLink, A.activityId AS activityId, A.skuCatId AS skuCatId, A.id AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT 1 AS isLink, 14 AS activityId, A.skuCatId, A.skuCatId AS id,"
                    + "        A.name || CASE WHEN A.doneValue <> A.ttlValue THEN ' (нет ' || CAST((A.ttlValue - A.doneValue) AS VARCHAR) || ' из ' || CAST(A.ttlValue AS VARCHAR) || ')' ELSE '' END AS name, "
                    + "        A.doneValue, A.ttlValue,"
                    + "        CASE WHEN A.doneValue = A.ttlValue THEN 0 ELSE 1 END AS mark"
                    + "      FROM"
                    + "        (SELECT S.skuCatId, SC.name,"
                    + "            SUM(CASE WHEN VS.sel <> 0 THEN 1 ELSE 0 END) AS doneValue,"
                    + "            SUM(1) AS ttlValue"
                    + "          FROM Sku S"
                    + "          INNER JOIN BrandGrp BG ON S.brandGrpId = BG.brandGrpId"
                    + "          INNER JOIN Brand B ON BG.brandId = B.brandId"
                    + "          INNER JOIN SkuCat SC ON S.skuCatId = SC.skuCatId"
                    + "          LEFT JOIN VisitSku VS ON VS.visitId = @visitId AND S.skuId = VS.skuId"
                    + "          WHERE S.active <> 0"
                    + "            AND B.ext = 0"
                    + "            AND EXISTS"
                    + "              (SELECT 1"
                    + "                FROM FmtSku FS"
                    + "                INNER JOIN Cust C ON FS.fmtId = C.fmtId"
                    + "                INNER JOIN Visit V ON C.custId = V.custId"
                    + "                WHERE V.visitId = @visitId"
                    + "                  AND FS.skuId = S.skuId"
                    + "              )"
                    + "            AND EXISTS(SELECT 1 FROM VisitSku VS1 INNER JOIN Sku S1 ON VS1.skuId = S1.skuId WHERE VS1.visitId = @visitId AND S1.skuCatId = S.skuCatId LIMIT 1)"
                    + "          GROUP BY S.skuCatId, SC.name"
                    + "        ) A"
                    + "    ) A"
                    + "  ORDER BY A.name";
                break;
            case 3:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, 2 AS activityId, A.skuCatId AS skuCatId, A.skuCatId AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT A.skuCatId, A.name || ' - ' || CASE WHEN MIN(A.doneValue) <> 0 THEN 'выполнена' ELSE 'не выполнена' END AS name,"
                    + "            SUM(A.doneValue) AS doneValue,"
                    + "            SUM(A.ttlValue) AS ttlValue,"
                    + "            1 - MIN(CASE WHEN A.doneValue <> 0 THEN 1 ELSE 0 END) AS mark"
                    + "      FROM"
                    + "        (SELECT P.skuCatId, SC.name,"
                    + "            MIN(CASE WHEN VPA.answer <> 0 THEN 1 ELSE 0 END) AS doneValue,"
                    + "            1 AS ttlValue"
                    + "          FROM Planogram P"
                    + "          INNER JOIN SkuCat SC ON P.skuCatId = SC.skuCatId"
                    + "          INNER JOIN CustPlanogram CP ON P.planogramId = CP.planogramId"
                    + "          INNER JOIN Visit V ON CP.custId = V.custId"
                    + "          INNER JOIN PlanogramQuestion PQ ON P.planogramId = PQ.planogramId"
                    + "          LEFT JOIN VisitPlanogramAnswer VPA ON V.visitId = VPA.visitId AND PQ.planogramId = VPA.planogramId AND PQ.questionId = VPA.questionId"
                    + "          WHERE V.visitId = @visitId"
                    + "          GROUP BY P.skuCatId, SC.name"
                    + "        ) A"
                    + "      GROUP BY A.skuCatId, A.name"
                    + "    ) A"
                    + "  ORDER BY A.name";
                break;
            case 4:
                sql = "SELECT A.name || ' - ' || CASE WHEN A.doneValue <> 0 THEN 'выполнена' ELSE 'не выполнена' END AS name, "
                    + "    A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, 4 AS activityId, A.skuCatId AS skuCatId, A.skuCatId AS id, 1 - A.doneValue AS mark"
                    + "  FROM"
                    + "      (SELECT SC.skuCatId, SC.name,"
                    + "          CASE WHEN CAST(REPLACE(IFNULL(VSC.shelfShare, 0), ',', '.') AS NUMERIC) >= CAST(REPLACE(IFNULL(CHSC.shelfShare, 0), ',', '.') AS NUMERIC) THEN 1 ELSE 0 END AS doneValue,"
                    + "          1 AS ttlValue"
                    + "        FROM SkuCat SC"
                    + "        CROSS JOIN Visit V"
                    + "        INNER JOIN Cust C ON V.custId = C.custId"
                    + "        INNER JOIN ChainSkuCat CHSC ON C.chainId = CHSC.chainId AND SC.skuCatId = CHSC.skuCatId"
                    + "        LEFT JOIN VisitSkuCat VSC ON VSC.skuCatId = SC.skuCatId"
                    + "        WHERE V.visitId = @visitId"
                    + "          AND CHSC.shelfShare IS NOT NULL"
                    + "    ) A"
                    + "  ORDER BY A.name";
                break;
            case 5:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, 5 AS activityId, A.skuCatId AS skuCatId, A.taskId AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT 0 AS skuCatId, A.taskId, A.name || ' - ' || CASE WHEN MIN(A.doneValue) <> 0 THEN 'выполнено' ELSE 'не выполнено' END AS name,"
                    + "            SUM(A.doneValue) AS doneValue,"
                    + "            SUM(A.ttlValue) AS ttlValue,"
                    + "            1 - MIN(CASE WHEN A.doneValue <> 0 THEN 1 ELSE 0 END) AS mark"
                    + "      FROM"
                    + "        (SELECT T.taskId, T.descr AS name,"
                    + "            MIN(CASE WHEN VST.done <> 0 THEN 1 ELSE 0 END) AS doneValue,"
                    + "            1 AS ttlValue"
                    + "          FROM Task T"
                    + "          INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
                    + "          INNER JOIN Visit V ON TL.custId = V.custId AND T.dateBgn <= V.dateBgn AND T.dateEnd >= V.dateBgn"
                    + "          INNER JOIN SubTask ST ON T.taskId = ST.taskId"
                    + "          LEFT JOIN VisitSubTask VST ON VST.visitId = V.visitId AND ST.subTaskId = VST.subTaskId"
                    + "          WHERE V.visitId = @visitId"
                    + "            AND IFNULL(T.activityId, 0) = 0"
                    + "          GROUP BY T.taskId, T.descr"
                    + "        ) A"
                    + "      GROUP BY A.taskId, A.name"
                    + "    ) A"
                    + "  ORDER BY A.name";
                break;
            case 6:
                sql = "SELECT A.name AS name, A.doneValue AS doneValue, A.ttlValue AS ttlValue, A.isLink AS isLink, A.activityId AS activityId, A.skuCatId AS skuCatId, A.id AS id, A.mark AS mark"
                    + "  FROM"
                    + "    (SELECT A.name || ' (' || A.skuCatName || ') - ' || CASE WHEN A.doneValue <> 0 THEN 'выполнено' ELSE 'не выполнено' END AS name, "
                    + "        A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, A.activityId AS activityId, A.skuCatId AS skuCatId, "
                    + "        A.skuCatId AS id, 1 - A.doneValue AS mark"
                    + "      FROM"
                    + "        (SELECT T.activityId, A.name, TL.skuCatId, SC.name AS skuCatName,"
                    + "            MIN(CASE WHEN VSP.price IS NOT NULL THEN 1 ELSE 0 END) AS doneValue,"
                    + "            1 AS ttlValue"
                    + "          FROM Task T"
                    + "          INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
                    + "          INNER JOIN Activity A ON T.activityId = A.activityId"
                    + "          INNER JOIN Visit V ON TL.custId = V.custId"
                    + "          INNER JOIN SkuCat SC ON TL.skuCatId = SC.skuCatId"
                    + "          INNER JOIN Sku S ON TL.skuCatId = S.skuCatId"
                    + "          LEFT JOIN VisitSkuPrice VSP ON V.visitId = VSP.visitId AND S.skuId = VSP.skuId"
                    + "          WHERE V.visitId = @visitId"
                    + "            AND T.dateBgn <= V.dateBgn AND T.dateEnd >= V.dateBgn"
                    + "            AND T.activityId = 8"
                    + "            AND S.pAudit <> 0 AND S.active = 1"
                    + "          GROUP BY T.activityId, A.name, TL.skuCatId, SC.name"
                    + "        ) A"
                    + "    UNION ALL"
                    + "    SELECT A.name || ' - ' || CASE WHEN A.doneValue <> 0 THEN 'выполнено' ELSE 'не выполнено' END AS name, "
                    + "        A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, A.activityId AS activityId, 0 AS skuCatId, "
                    + "        0 AS id, 1 - A.doneValue AS mark"
                    + "      FROM"
                    + "        (SELECT T.activityId, A.name, "
                    + "            MIN(CASE WHEN VSA.answer IS NOT NULL THEN 1 ELSE 0 END) AS doneValue,"
                    + "            1 AS ttlValue"
                    + "          FROM Task T"
                    + "          INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
                    + "          INNER JOIN Activity A ON T.activityId = A.activityId"
                    + "          INNER JOIN Visit V ON TL.custId = V.custId"
                    + "          CROSS JOIN SurveyQuestion SQ"
                    + "          LEFT JOIN VisitSurveyAnswer VSA ON V.visitId = VSA.visitId AND SQ.questionId = VSA.questionId"
                    + "          WHERE V.visitId = @visitId"
                    + "            AND T.dateBgn <= V.dateBgn AND T.dateEnd >= V.dateBgn"
                    + "            AND T.activityId = 11"
                    + "            AND SQ.surveyId = 2"
                    + "          GROUP BY T.activityId, A.name"
                    + "        ) A"
                    + "    UNION ALL"
                    + "    SELECT A.name || ' - ' || CASE WHEN A.doneValue <> 0 THEN 'выполнено' ELSE 'не выполнено' END AS name, "
                    + "        A.doneValue AS doneValue, A.ttlValue AS ttlValue, 1 AS isLink, A.activityId AS activityId, 0 AS skuCatId, "
                    + "        0 AS id, 1 - A.doneValue AS mark"
                    + "      FROM"
                    + "        (SELECT T.activityId, A.name, "
                    + "            MIN(CASE WHEN VSA.answer IS NOT NULL THEN 1 ELSE 0 END) AS doneValue,"
                    + "            1 AS ttlValue"
                    + "          FROM Task T"
                    + "          INNER JOIN TaskLink TL ON T.taskId = TL.taskId"
                    + "          INNER JOIN Activity A ON T.activityId = A.activityId"
                    + "          INNER JOIN Visit V ON TL.custId = V.custId"
                    + "          CROSS JOIN SurveyQuestion SQ"
                    + "          LEFT JOIN VisitSurveyAnswer VSA ON V.visitId = VSA.visitId AND SQ.questionId = VSA.questionId"
                    + "          WHERE V.visitId = @visitId"
                    + "            AND T.dateBgn <= V.dateBgn AND T.dateEnd >= V.dateBgn"
                    + "            AND T.activityId = 12"
                    + "            AND SQ.surveyId = 1 AND SQ.parentId IS NOT NULL"
                    + "          GROUP BY T.activityId, A.name"
                    + "        ) A"
                    + "    ) A"
                    + "  ORDER BY A.activityId, A.name";
                break;
        }
        if (sql != "") {
            sql = sql.replace(/@visitId/g, visitId);
            tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
        }
    }, dbTools.onTransError);
}

