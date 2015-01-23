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
            log("File downloaded: " + fileEntry.fullPath);
        }, 
        function(errMsg) {
            alert(errMsg);
            log(errMsg);
        }
    );
}