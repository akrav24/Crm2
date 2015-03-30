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

dbTools.visitProductsGet = function(visitId, skuCatId, fmtFilterType, fmtId, datasetGet) {
    log("visitProductsGet(" + visitId + ", " + skuCatId + ", " + fmtFilterType + ", " + fmtId + ")");
    dbTools.db.transaction(function(tx) {
        //var sql = "SELECT NULL AS visitPlanId, NULL AS docId, S.skuId, S.name, S.brandGrpId, BG.name AS brandGrpName, BG.brandId, B.name AS brandName,"
        //    + " S.skuCatId, SC.name AS skuCatName, SC.parentId AS skuCatParentId, 1 AS qnt"
        var sql = "SELECT S.skuId, S.name, S.code, S.brandGrpId, BG.name AS brandGrpName, VS.sel, VS.sel0,"
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
            + "    AND (? = 1 OR EXISTS(SELECT 1 FROM FmtSku WHERE fmtId = ? AND skuId = S.skuId))"
            + "  ORDER BY S.name";
        tx.executeSql(sql, [visitId, skuCatId, fmtFilterType, fmtId], datasetGet, dbTools.onSqlError);
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

dbTools.visitProductUpdate = function(visitId, skuId, sel, qntRest, qntOrder, onSuccess, onError) {
    log("visitProductUpdate(" + visitId + ", " + skuId + ", " + sel + ", " + qntRest + ", " + qntOrder + ")");
    dbTools.db.transaction(function(tx) {
        var flds = ["sel", "qntRest", "qntOrder"];
        var vals = [sel, qntRest, qntOrder];
        dbTools.sqlInsertUpdate(tx, "VisitSku", ["visitId", "skuId"], flds, [visitId, skuId], vals, 
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

dbTools.visitActivityGet = function(visitPlanItemId, visitId, skuCatId, stageId, activityId, datasetGet) {
    log("visitActivityGet(" + visitPlanItemId + ", " + visitId + ")");
    if (visitId == null) {visitId = 0;}
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT A.visitPlanItemId, A.stageId, A.activityId, A.name, A.blk, COUNT(AC.skuCatId) AS skuCatCnt"
            + "  FROM"
            + "    (SELECT VPI.visitPlanItemId AS visitPlanItemId, VSA.stageId AS stageId, VSA.activityId AS activityId, A.name AS name, 1 AS blk, A.lvl AS lvl"
            + "      FROM VisitPlanItem VPI"
            + "      INNER JOIN VisitSchemaActivity VSA ON VPI.visitSchemaId = VSA.visitSchemaId"
            + "      INNER JOIN Activity A ON VSA.activityId = A.activityId"
            + "      WHERE VPI.visitPlanItemId = ?"
            + "     UNION ALL"
            + "     SELECT ? AS visitPlanItemId, 1 AS stageId, 0 AS activityId, 'Первичный анализ' AS name, 0 AS blk, 0 AS lvl"
            + "     UNION ALL"
            + "     SELECT ? AS visitPlanItemId, 2 AS stageId, 0 AS activityId, 'Основной анализ' AS name, 0 AS blk, 0 AS lvl"
            + "   ) A"
            + "  LEFT JOIN"
            + "    (SELECT 1 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId AND VS.sel0 = 1"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            /*+ "    SELECT 1 AS stageId, 14 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL"
            + "      GROUP BY S.skuCatId"*/
            + "    SELECT 1 AS stageId, 14 AS activityId, SC.skuCatId"
            + "      FROM SkuCat SC"
            + "      WHERE EXISTS(SELECT 1 FROM VisitSku VS WHERE VS.visitId = @visitId AND VS.reasonId IS NOT NULL)"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 1 AS activityId, S.skuCatId"
            + "      FROM VisitSku VS"
            + "      INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "      WHERE VS.visitId = @visitId AND VS.sel = 1"
            + "      GROUP BY S.skuCatId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 4 AS activityId, VSC.skuCatId"
            + "      FROM VisitSkuCat VSC"
            + "      WHERE VSC.visitId = @visitId"
            + "    UNION ALL"
            + "    SELECT 2 AS stageId, 6 AS activityId, VP.skuCatId"
            + "      FROM VisitPromo VP"
            + "      WHERE VP.visitId = @visitId"
            + "      GROUP BY VP.skuCatId"
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
            + "  GROUP BY A.visitPlanItemId, A.stageId, A.activityId, A.name, A.blk, A.lvl"
            + "  ORDER BY A.stageId, A.blk, A.lvl";
        sql = sql.replace(/@visitId/g, visitId).replace(/@stageId/g, stageId).replace(/@activityId/g, activityId).replace(/@skuCatId/g, skuCatId);
        tx.executeSql(sql, [visitPlanItemId, visitPlanItemId, visitPlanItemId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAnalysisResultsGet = function(visitId, datasetGet) {
    log("visitAnalysisResultsGet(" + visitId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, S.name, S.code, VS.sel, VS.sel0,"
            + "    VS.qntRest, VS.qntOrder, VS.reasonId, IFNULL(R.name, '') AS reasonName, R.useQnt, VS.reasonQnt, R.useDate, VS.reasonDate"
            + "  FROM VisitSku VS"
            + "  LEFT JOIN Sku S ON VS.skuId = S.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE VS.visitId = ?"
            + "    AND VS.sel0 = 1"
            + "  ORDER BY S.name";
        tx.executeSql(sql, [visitId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitAnalysisResultGet = function(visitId, skuId, datasetGet) {
    log("visitAnalysisResultsGet(" + visitId + ", " + skuId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT S.skuId, S.name, S.code, IFNULL(S.code, '') || ' ' || S.name AS fullName, VS.sel, VS.sel0,"
            + "    IFNULL(VS.reasonId, 0) AS reasonId, R.name AS reasonName,"
            + "    R.useQnt, VS.reasonQnt, R.useDate, VS.reasonDate"
            + "  FROM VisitSku VS"
            + "  INNER JOIN Sku S ON VS.skuId = S.skuId"
            + "  LEFT JOIN Reason R ON VS.reasonId = R.reasonId"
            + "  WHERE VS.visitId = ?"
            + "    AND VS.skuId = ?";
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

dbTools.visitAnalysisResultUpdate = function(visitId, skuId, reasonId, reasonQnt, reasonDate, onSuccess, onError) {
    log("visitAnalysisResultUpdate(" + visitId + ", " + skuId + ", " + reasonId + ", " + reasonQnt + ", " + reasonDate + ")");
    dbTools.db.transaction(function(tx) {
        if (!(reasonId > 0)) {
            reasonQnt = null;
            reasonDate = null;
        }
        dbTools.sqlInsertUpdate(tx, "VisitSku", ["visitId", "skuId"], ["reasonId", "reasonQnt", "reasonDate"], [visitId, skuId], [reasonId, reasonQnt, dateToSqlDate(reasonDate)], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, skuId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

dbTools.visitShelfShareGet = function(visitId, skuCatId, datasetGet) {
    log("visitShelfShareGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VSC.visitId, VSC.skuCatId, VSC.shelfWidthTotal, VSC.shelfWidthOur, VSC.shelfShare"
            + "  FROM VisitSkuCat VSC"
            + "  WHERE VSC.visitId = ? AND VSC.skuCatId = ?";
        tx.executeSql(sql, [visitId, skuCatId], datasetGet, dbTools.onSqlError);
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

dbTools.visitPromoGenderListGet = function(datasetGet) {
    log("visitPromoGenderListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT G.genderId, G.name FROM Gender G ORDER BY G.name";
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoBrandListGet = function(skuCatId, datasetGet) {
    log("visitPromoBrandListGet");
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
    log("visitPromoPromoGrpListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT PG.promoGrpId, PG.name FROM PromoGrp PG ORDER BY PG.lvl";
        tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoPromoListGet = function(promoGrpId, datasetGet) {
    log("visitPromoPromoListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT P.promoId, P.name, P.extInfoKind"
            + "  FROM Promo P"
            + "  WHERE P.promoGrpId = ?"
            + "  ORDER BY P.lvl";
        tx.executeSql(sql, [promoGrpId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoListGet = function(visitId, skuCatId, datasetGet) {
    log("visitPromoPromoListGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.genderId, G.name AS genderName,"
            + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
            + "    P.extInfoKind, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName"
            + "  FROM VisitPromo VP"
            + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
            + "  LEFT JOIN Gender G ON VP.genderId = G.genderId"
            + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
            + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
            + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
            + "  WHERE VP.visitId = ?"
            + "    AND VP.skuCatId = ?";
        tx.executeSql(sql, [visitId, skuCatId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoGet = function(visitPromoId, visitId, skuCatId, genderId, brandId, promoId, datasetGet) {
    log("visitPromoGet");
    dbTools.db.transaction(function(tx) {
        var sql = "";
        var params = [];
        if (visitPromoId > 0) {
            sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.genderId, G.name AS genderName,"
                + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitPromoPhotoCnt"
                + "  FROM VisitPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN Gender G ON VP.genderId = G.genderId"
                + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitPromoId, COUNT(*) AS visitPromoPhotoCnt FROM VisitPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitPromoId) VPP ON VP.visitPromoId = VPP.visitPromoId"
                + "  WHERE VP.visitPromoId = ?";
            params = [visitPromoId];
        } else {
            sql = "SELECT VP.visitId, VP.visitPromoId, VP.skuCatId, SC.name AS skuCatName, VP.genderId, G.name AS genderName,"
                + "    VP.brandId, B.name AS brandName, P.promoGrpId, PG.name AS promoGrpName, VP.promoId, P.name AS promoName,"
                + "    P.extInfoKind, VP.extInfoVal, VP.extInfoVal2, VP.extInfoName, VPP.visitPromoPhotoCnt"
                + "  FROM VisitPromo VP"
                + "  LEFT JOIN SkuCat SC ON VP.skuCatId = SC.skuCatId"
                + "  LEFT JOIN Gender G ON VP.genderId = G.genderId"
                + "  LEFT JOIN Brand B ON VP.brandId = B.brandId"
                + "  LEFT JOIN Promo P ON VP.promoId = P.promoId"
                + "  LEFT JOIN PromoGrp PG ON P.promoGrpId = PG.promoGrpId"
                + "  LEFT JOIN (SELECT visitPromoId, COUNT(*) AS visitPromoPhotoCnt FROM VisitPromoPhoto WHERE fileId IS NOT NULL GROUP BY visitPromoId) VPP ON VP.visitPromoId = VPP.visitPromoId"
                + "  WHERE VP.visitId = ? AND VP.skuCatId = ? AND VP.genderId = ? AND VP.brandId = ? AND VP.promoId = ?";
            params = [visitId, skuCatId, genderId, brandId, promoId];
        }
        tx.executeSql(sql, params, datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitPromoUpdate = function(visitId, visitPromoId, skuCatId, genderId, brandId, promoId, extInfoVal, extInfoVal2, extInfoName, onSuccess, onError) {
    log("visitPromoUpdate(" + visitId + ", " + visitPromoId + ", " + skuCatId + ", " + genderId + ", " + promoId + ", " + extInfoVal + ", " + extInfoVal2 + ", " + extInfoName + ")");
    dbTools.db.transaction(function(tx) {
        if (visitPromoId > 0) {
            if (visitId != null || skuCatId != null || genderId != null || brandId != null 
                    || promoId != null || extInfoVal != null || extInfoVal2 != null || extInfoName != null) {
                dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "genderId", "brandId", "promoId", "extInfoVal", "extInfoVal2", "extInfoName"], 
                        [visitPromoId], [visitId, skuCatId, genderId, brandId, promoId, extInfoVal, extInfoVal2, extInfoName], 
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
            dbTools.visitPromoGet(visitPromoId, visitId, skuCatId, genderId, brandId, promoId, 
                function(tx, rs) {
                    if (rs.rows.length > 0) {
                        visitPromoId = rs.rows.item(0).visitPromoId;
                        dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "genderId", "brandId", "promoId", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                [visitPromoId], [visitId, skuCatId, genderId, brandId, promoId, extInfoVal, extInfoVal2, extInfoName], 
                            function() {if (onSuccess != undefined) {onSuccess(visitPromoId);}},
                            onError
                        );
                    } else {
                        dbTools.tableNextIdGet(tx, "VisitPromo", 
                            function(tx, visitPromoId) {
                                dbTools.sqlInsertUpdate(tx, "VisitPromo", ["visitPromoId"], ["visitId", "skuCatId", "genderId", "brandId", "promoId", "extInfoVal", "extInfoVal2", "extInfoName"], 
                                        [visitPromoId], [visitId, skuCatId, genderId, brandId, promoId, extInfoVal, extInfoVal2, extInfoName], 
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
    log("visitPromoPhotoUpdate(" + visitId + ", " + visitPromoId + ", " + visitPromoPhotoId + ", '" + fileId + "')");
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

dbTools.visitSurveyAnswerListGet = function(visitId, surveyId, datasetGet) {
    log("visitSurveyAnswerListGet(" + visitId + ", " + surveyId + ")");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT SQ.surveyId, SQ.questionId, SQ.name, SQ.weight, SQP.ttlWeight, SQ.answerType, SQ.parentId, "
            + "    CASE WHEN SQ.parentId IS NULL THEN 1 ELSE 2 END AS treeLvl, CASE WHEN SQ.surveyId = 1 THEN 1 ELSE 0 END AS isCalcWeight,"
            + "    SQP.weight AS parentWeight, SQT.ttlParentWeight, VSA.answer"
            + "  FROM SurveyQuestion SQ"
            + "  LEFT JOIN "
            + "    (SELECT SQP.questionId, SQP.weight, SQP.lvl, SUM(SQ.weight) AS ttlWeight"
            + "      FROM SurveyQuestion SQ"
            + "      INNER JOIN SurveyQuestion SQP ON SQ.parentId = SQP.questionId"
            + "      GROUP BY SQP.questionId, SQP.weight, SQP.lvl"
            + "    ) SQP ON IFNULL(SQ.parentId, SQ.questionId) = SQP.questionId"
            + "  LEFT JOIN "
            + "    (SELECT SQ.surveyId, SUM(SQ.weight) AS ttlParentWeight"
            + "      FROM SurveyQuestion SQ"
            + "      WHERE SQ.parentId IS NULL"
            + "      GROUP BY SQ.surveyId"
            + "    ) SQT ON SQ.surveyId = SQT.surveyId"
            + "  LEFT JOIN VisitSurveyAnswer VSA ON VSA.visitId = ? AND SQ.questionId = VSA.questionId"
            + "  WHERE SQ.surveyId = ?"
            + "  ORDER BY IFNULL(SQP.lvl, SQ.lvl), SQ.lvl, SQ.questionId";
        tx.executeSql(sql, [visitId, surveyId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.visitSurveyAnswerUpdate = function(visitId, questionId, answer, onSuccess, onError) {
    log("visitSurveyAnswerUpdate(" + visitId + ", " + questionId + ", " + answer + ")");
    dbTools.db.transaction(function(tx) {
        dbTools.sqlInsertUpdate(tx, "VisitSurveyAnswer", ["visitId", "questionId"], ["answer"], [visitId, questionId], [answer], 
            function() {if (onSuccess != undefined) {onSuccess(visitId, questionId);}},
            onError
        );
    }, function(error) {if (onError != undefined) {onError("!!! SQLite transaction error, " + dbTools.errorMsg(error));}});
}

