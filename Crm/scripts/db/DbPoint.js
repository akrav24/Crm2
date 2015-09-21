dbTools.pointListGet = function(datasetGet) {
    log("pointListGet");
    log("settings=" + JSON.stringify(settings));
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT C.custId, C.name, CT.name AS cityName, C.addr"
            + "  FROM Cust C"
            + "  LEFT JOIN City CT ON C.cityId = CT.cityId"
            + "  WHERE (? = '-1' OR C.chainId = ?)"
            + "    AND (? = '-1' OR C.cityId = ?)"
            + "    AND (? = '-1' OR C.channelId = ?)"
            + "    AND (? = '-1' OR C.orgCatId = ?)"
            + "    AND (? = '-1' OR C.orgType = ?)"
            + "  ORDER BY C.name, CT.name, C.addr, C.custId";
        tx.executeSql(sql, [settings.filterPoints.chainId, settings.filterPoints.chainId, settings.filterPoints.cityId, settings.filterPoints.cityId, 
            settings.filterPoints.channelId, settings.filterPoints.channelId, settings.filterPoints.orgCatId, settings.filterPoints.orgCatId, 
            settings.filterPoints.orgTypeId, settings.filterPoints.orgTypeId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.pointGet = function(custId, datasetGet) {
    log("pointGet");
    dbTools.db.transaction(function(tx) {
        var sql = "SELECT c.custId, c.name, c.addr, t.name as orgTypeName, ct.name as orgCatName, cn.name as channelName, c.fmtId"
            + " FROM Cust c"
            + " LEFT JOIN OrgType t ON t.orgTypeId=c.orgType"
            + " LEFT JOIN OrgCat ct ON ct.orgCatId=c.orgCatId"
            + " LEFT JOIN Channel cn ON cn.channelId=c.channelId"
            + " WHERE c.custId = ?";
        tx.executeSql(sql, [custId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

dbTools.filterPointsListGet = function(dataType, datasetGet) {
    log("..filterPointsListGet");
    dbTools.db.transaction(function(tx) {
        var sql = filterPointsSqlGet(dataType);
        if (sql !== "") {
            tx.executeSql(sql, [], datasetGet, dbTools.onSqlError);
        }
    }, dbTools.onTransError);
}

function filterPointsSqlGet(dataType) {
    var sql = "";
    
    switch (dataType) {
        case 1:
            sql = "SELECT name, chainId"
                + "  FROM"
                + "    (SELECT 'Все' AS name, -1 AS chainId, 0 AS lvl"
                + "    UNION ALL"
                + "    SELECT name, chainId, 1 AS lvl FROM Chain"
                + "    ) A"
                + "  WHERE name IS NOT NULL AND name <> ''"
                + "  ORDER BY lvl, name";
            break
        case 2:
            sql = "SELECT name, cityId"
                + "  FROM"
                + "    (SELECT 'Все' AS name, -1 AS cityId, 0 AS lvl"
                + "    UNION ALL"
                + "    SELECT name, cityId, 1 AS lvl FROM City"
                + "    ) A"
                + "  WHERE name IS NOT NULL AND name <> ''"
                + "  ORDER BY lvl, name";
            break
        case 3:
            sql = "SELECT name, channelId"
                + "  FROM"
                + "    (SELECT 'Все' AS name, -1 AS channelId, 0 AS lvl"
                + "    UNION ALL"
                + "    SELECT name, channelId, 1 AS lvl FROM Channel"
                + "    ) A"
                + "  WHERE name IS NOT NULL AND name <> ''"
                + "  ORDER BY lvl, name";
            break
        case 4:
            sql = "SELECT name, orgCatId"
                + "  FROM"
                + "    (SELECT 'Все' AS name, -1 AS orgCatId, 0 AS lvl"
                + "    UNION ALL"
                + "    SELECT name, orgCatId, 1 AS lvl FROM OrgCat"
                + "    ) A"
                + "  WHERE name IS NOT NULL AND name <> ''"
                + "  ORDER BY lvl, name";
            break
        case 5:
            sql = "SELECT name, orgTypeId"
                + "  FROM"
                + "    (SELECT 'Все' AS name, -1 AS orgTypeId, 0 AS lvl"
                + "    UNION ALL"
                + "    SELECT name, orgTypeId, 1 AS lvl FROM OrgType"
                + "    ) A"
                + "  WHERE name IS NOT NULL AND name <> ''"
                + "  ORDER BY lvl, name";
            break
    }
    
    return sql;
}