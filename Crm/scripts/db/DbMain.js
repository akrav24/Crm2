document.addEventListener("deviceready", init, false);

var dbTools = {};
dbTools.db = null;             // SQLite database
dbTools.objectList = []; // [{name: <name>, needReloadData: <true|false>, callback: <callback function>}, ...]

function init() {
	dbTools.openDB();
    dbTools.createSystemTables();
}


dbTools.openDB = function() {
    if (window.sqlitePlugin != undefined) {
        dbTools.db = window.sqlitePlugin.openDatabase("Crm");
    } else {
        // For debugging in simulator fallback to native SQL Lite
        dbTools.db = window.openDatabase("Crm", "1.0", "Cordova Demo", 200000);
    }
}

dbTools.createSystemTables = function() {
	dbTools.db.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS Script(versionId int, sql varchar(8000), constraint pkScript primary key(versionId))", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS Parm(nodeId int, dataVersionId int, constraint pkParm primary key(nodeId))", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataIn(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataIn primary key(blockId, irow))", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS MailBlockDataOut(blockId int, irow int, data varchar(8000), constraint pkMailBlockDataOut primary key(blockId, irow))", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS RefType(refTypeId int, name varchar(100), parentId int, test int, useNodeId int, dir int, updateDate datetime, sendAll int, lvl int, flds varchar(1000), constraint pkRefType primary key (refTypeId))", []);
        tx.executeSql("INSERT INTO Parm(nodeId, dataVersionId) SELECT ?, 0 WHERE NOT EXISTS(SELECT 1 FROM Parm WHERE nodeId = ?)", [nodeId, nodeId]);
    }, dbTools.onTransError);
}

dbTools.onTransError = function(error) {
    log("!!! SQLite transaction error: " + error.message);
    console.log("!!! SQLite transaction error: " + error.message);
}

dbTools.onSqlError = function(tx, error) {
    log("!!! SQLite Sql error: " + error.message);
    console.log("!!! SQLite Sql error: " + error.message);
}

dbTools.serverUrl = function(serverName, port) {
    return "http://" + serverName + (port != undefined ? ":" + port : "") + "/"
}

dbTools.rsToJson = function (rs) {
    data = [];
    for (var i = 0; i < rs.rows.length; i++) {
        data.push(rs.rows.item(i));
    }
    return data;
}

dbTools.objectListItemGet = function(name) {
    for (var i = 0; i < dbTools.objectList.length; i++) {
        if (dbTools.objectList[i].name = name) {
            return dbTools.objectList[i];
        }
    }
    return {name: undefined, needReloadData: undefined, callback: undefined};
}

dbTools.objectListItemSet = function(name, needReloadData, callback) {
    if (name != undefined) {
        var found = false;
        for (var i = 0; i < dbTools.objectList.length && !found; i++) {
            if (dbTools.objectList[i].name = name) {
                found = true;
                dbTools.objectList[i].needReloadData = needReloadData;
                if (callback !== undefined) {
                    dbTools.objectList[i].callback = callback;
                }
                break;
            }
        }
        if (!found) {
            dbTools.objectList.push({name: name, needReloadData: needReloadData, callback: callback});
        }
    }
}

dbTools.dropAllTables = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'android%' AND name NOT LIKE '%WebKit%'", [], function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                var sql = "DROP TABLE " + rs.rows.item(i)["name"];
                tx.executeSql(sql, []);
            }
        });
    }, dbTools.onTransError);
}



//-- AK: TO DEL --

dbTools.tableCount = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT count(*) AS cnt FROM sqlite_master WHERE type='table'", [], function(tx, rs) {
            log("Table count = " + rs.rows.item(0)["cnt"].toString());
        });
    }, dbTools.onTransError);
}

dbTools.tableRowCount = function(tableName) {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT count(*) AS cnt FROM " + tableName, [], function(tx, rs) {
            log(tableName + " row count = " + rs.rows.item(0)["cnt"].toString());
        });
    }, dbTools.onTransError);
}

dbTools.getTablesInfo = function() {
    log("----Tables info:");
    dbTools.tableCount();
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], function(tx, rs) {
            for (var i = 0; i < rs.rows.length; i++) {
                dbTools.tableRowCount(rs.rows.item(i)["name"]);
            }
        });
    }, dbTools.onTransError);
}
