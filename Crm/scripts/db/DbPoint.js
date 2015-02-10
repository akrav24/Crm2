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