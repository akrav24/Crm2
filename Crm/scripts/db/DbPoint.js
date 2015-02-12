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
        var sql = "SELECT c.custId, c.name, c.addr, t.name as orgTypeName, ct.name as orgCatName, cn.name as channelName"
            + " FROM Cust c"
            + " LEFT JOIN OrgType t ON t.orgTypeId=c.orgType"
            + " LEFT JOIN OrgCat ct ON ct.orgCatId=c.orgCatId"
            + " LEFT JOIN Channel cn ON cn.channelId=c.channelId"
            + " WHERE c.custId = ?";
        tx.executeSql(sql, [custId], datasetGet, dbTools.onSqlError);
    }, dbTools.onTransError);
}

