function testInit(e) {
    $("#fileId").val(2);
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