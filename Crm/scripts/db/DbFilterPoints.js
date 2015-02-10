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