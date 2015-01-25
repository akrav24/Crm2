var data = [];

function visitPlanogramListShow() {
    var folderName = fileHelper.planogramFolderName();
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileId FROM Planogram", [], 
                function(tx, rs) {
                    if (rs.rows.length > 0) {
                        dataAdd(data, folderName, rs.rows, 0);
                    }
                },
                function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
            );
        }, 
        function(error) {log("!!! SQLite error: " + dbTools.errorMsg(error));}
    );
}

function dataAdd(data, folderName, rows, i) {
    var fileId = rows.item(i)["fileId"];
    var fileName = fileHelper.planogramFileName(fileId);
    fileHelper.getFileEntry(folderName, fileName, 
        function(fileEntry) {
            log("..img src: " + fileEntry.toURL());
            data.push({"fileId": fileId, "filePath": fileEntry.toURL()});
            if (i < rows.length - 1) {
                dataAdd(data, folderName, rows, ++i);
            } else {
                setDataSource(data);
            }
        }, 
        function(errMsg) {log(errMsg);}
    );
}

function setDataSource(data) {
log("..setDataSource: " + JSON.stringify(data));
    var scrollview = $("#scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
    scrollview.refresh();
}
