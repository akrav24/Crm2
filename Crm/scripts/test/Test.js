function testInit(e) {
    log("testInit(e)");
    $("#fileId").val(2);
    $("#timeout").kendoNumericTextBox({format: "n0", decimals: 0});
    nodeIdGetOnClick();
}

function testShow(e) {
    log("testShow(e)");
}

function nodeIdSetOnClick() {
    var newNodeId = $("#node-id-edit").val();
    if (newNodeId != undefined && newNodeId != "")
    {
        newNodeIdInt = parseInt(newNodeId, 10);
        if (!isNaN(newNodeIdInt)) {
            nodeIdSet(newNodeIdInt);
        }
    }
}

function nodeIdGetOnClick() {
    log("nodeIdGetOnClick() nodeId=" + settings.nodeId);
    $("#node-id-edit").val(settings.nodeId);
}

function getInfo() {
    dbTools.getSQLiteInfo(dbTools.getTablesInfo());
}

function getImage() {
    var fileId = $("#fileId").val();
    dbTools.exchangeDataFileByIdDownload(0, fileId,
        function(blockId, fileId, fileEntry) {
            //log("File downloaded: " + fileEntry.fullPath);
        }, 
        function(errMsg) {
            log(errMsg);
        }
    );
}

function getAllImages() {
    log("getAllImages()");
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileId FROM Planogram", [], 
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        dbTools.exchangeDataFileByIdDownload(0, rs.rows.item(i)["fileId"],
                            function(blockId, fileId, fileEntry) {
                                //log("File downloaded: " + fileEntry.fullPath);
                            }, 
                            function(errMsg) {
                                log(errMsg);
                            }
                        );
                    }
                },
                function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
            );
        }, 
        function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
    );
}

function getLocation() {
    log("getLocation()");
    
    var onSuccess = function(position) {
        alert('Latitude: '          + position.coords.latitude          + '\n' +
              'Longitude: '         + position.coords.longitude         + '\n' +
              'Altitude: '          + position.coords.altitude          + '\n' +
              'Accuracy: '          + position.coords.accuracy          + '\n' +
              'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
              'Heading: '           + position.coords.heading           + '\n' +
              'Speed: '             + position.coords.speed             + '\n' +
              'Timestamp: '         + position.timestamp                + '\n');
    };
    
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }
    
    var timeout = $("#timeout").data("kendoNumericTextBox");
    geolocationOptions = { maximumAge: 30000, timeout: timeout.value() * 1000, enableHighAccuracy: true };
    
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geolocationOptions);    
}

function saveImages(e) {
    log("..saveImages()");
    /*fileHelper.fileDataWrite("FFD8FFE000104A464946", fileHelper.folderName(), "testt.txt",
        function(fileEntry) {log("====success");},
        function(errMsg) {log("====error: " + errMsg);}
    );
    */
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT * FROM File" + e.target.data("type") + " WHERE data IS NOT NULL", [], 
                function(tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        fileHelper.fileDataWrite(rs.rows.item(i).data, fileHelper.folderName(), rs.rows.item(i).fileName + "_" + i + ".jpg",
                            //function(fileEntry) {log("====success");},
                            undefined,
                            function(errMsg) {log("====error: " + errMsg);}
                        );
                    }
                },
                function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
            );
        }, 
        function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
    );
}

function loadImage() {
    log("..loadImage()");
    fileHelper.fileDataReadByName(fileHelper.folderName(), "plan2.png",
        function(fileEntry) {log("====success");}/*undefined*/,
        function(errMsg) {log("====error: " + errMsg);}
    );
}

function getTableFieldList() {
    dbTools.db.transaction(
        function(tx) {
            dbTools.tableFieldListGet(tx, "Activity", 
                function(tx, tableName, fieldList, fieldTypeList) {
                    log("====tableName: '" + tableName + "'");
                    log("======fieldList: " + kendo.stringify(fieldList) + "");
                    log("======fieldTypeList: " + kendo.stringify(fieldTypeList) + "");
                }, 
                function(errMsg) {log(errMsg);}
            );
            
            dbTools.tableFieldValueListSqlGet(tx, "Activity", "", 
                function(tx, tableName, fieldValueListSql) {
                    log("====tableName: '" + tableName + "', fieldValueListSql: <" + fieldValueListSql + ">");
                }, 
                function(errMsg) {log(errMsg);}
            );
        }, 
        dbTools.onTransError
    );
}

function test() {
}