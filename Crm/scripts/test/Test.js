function testInit(e) {
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