function testInit(e) {
    $("#fileId").val(2);
    $("#timeout").kendoNumericTextBox({format: "n0", decimals: 0});
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
    log("nodeIdGetOnClick() nodeId=" + nodeId);
    $("#node-id-edit").val(nodeId);
}

function getInfo() {
    dbTools.getTablesInfo();
    dbTools.getSQLiteInfo();
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