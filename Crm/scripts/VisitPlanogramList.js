var data = [];

function visitPlanogramListShow() {
    log("visitPlanogramListShow()");
    var folderName = fileHelper.planogramFolderName();
    dbTools.db.transaction(
        function(tx) {
            tx.executeSql("SELECT fileId FROM Planogram", [], 
                function(tx, rs) {
                    data.length = 0;
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
    //log("..dataAdd(" + JSON.stringify(data) + ", '" + folderName + "', " + JSON.stringify(rows) + ", " + i + ")");
    var fileId = rows.item(i)["fileId"];
    var fileName = fileHelper.planogramFileName(fileId);
    fileHelper.getFileEntry(folderName, fileName, 
        function(fileEntry) {
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
    //log("..setDataSource: " + JSON.stringify(data));
    var scrollview = $("#scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
    scrollview.refresh();
}

function getValue() {
    var scrollview = $("#scrollview").data("kendoMobileScrollView");
    alert("value=" + JSON.stringify(scrollview.value()) + ", dataSource.total=" + scrollview.dataSource.total());
}