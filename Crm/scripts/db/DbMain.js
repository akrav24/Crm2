document.addEventListener("deviceready", init, false);

var dbTools = {};
dbTools.db = null;
      
function init() {
	dbTools.openDB();
    dbTools.createSystemTables();
}
      
      
dbTools.openDB = function() {
    if (window.sqlitePlugin !== undefined) {
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
		tx.executeSql("CREATE TABLE IF NOT EXISTS RefType(refTypeId int, name varchar(100), parentId int, test int, useNodeId int, dir int, updateDate datetime, sendAll int, lvl int, constraint pkRefType primary key (refTypeId))", []);
    }, dbTools.onTransError);
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

dbTools.tableCount = function() {
    dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT count(*) AS cnt FROM sqlite_master WHERE type='table'", [], function(tx, rs) {
            alert("Table count = " + rs.rows.item(0)["cnt"].toString());
        });
    }, dbTools.onTransError);
}

dbTools.onTransError = function(error) {
    alert("SQLite transaction error: " + error.message);
}

dbTools.onSqlError = function(tx, error) {
    alert("SQLite Sql error: " + error.message);
}

