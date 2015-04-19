var data = [];

var imageSrc = "";
var imageTitle = "";
var viewModel = kendo.observable({
    imageSrc: imageSrc,
    imageTitle: imageTitle
});

var isNotDataReload = false;

function visitPlanogramListInit() {
    log("visitPlanogramListInit()");
    var scrollview = $("#scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
}

function visitPlanogramListShow() {
    log("visitPlanogramListShow()");
    if (!isNotDataReload) {
        var folderName = fileHelper.folderName();
        data = [];
        dbTools.db.transaction(
            function(tx) {
                tx.executeSql("SELECT name, fileId FROM Planogram", [], 
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
    } else {
        isNotDataReload = false;
    }
    
}

function dataAdd(data, folderName, rows, i) {
    var name = rows.item(i)["name"];
    var fileId = rows.item(i)["fileId"];
    var fileName = fileHelper.fileName("plan", fileId);
    fileHelper.getFileEntry(folderName, fileName, false,
        function(fileEntry) {
            data.push({"name": name, "fileId": fileId, "filePath": fileEntry.toURL()});
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
    if (data.length > 0) {
        imageSourceSet(0);
    }
}

function scrollviewOnChanging(e) {
    imageSourceSet(e.nextPage);
}

function imageViewShow(e) {
    var navbar = e.view.header.find(".km-navbar").data("kendoMobileNavBar");
    navbar.title(imageTitle);
}

function imageSourceSet(i) {
    if (data[i].name != "") {
        imageTitle = data[i].name;
    } else {
        imageTitle = "Планограмма";
    }
    var fileId = data[i].fileId;
    var folderName = fileHelper.folderName();
    var fileName = fileHelper.fileName("plan", fileId);
    fileHelper.getFileEntry(folderName, fileName, false,
        function(fileEntry) {
            imageSrc = fileEntry.toURL();
            log("....imageSrc=" + imageSrc);
            viewModel.set("imageSrc", imageSrc);
            viewModel.set("imageTitle", imageTitle);
        }, 
        function(errMsg) {log(errMsg);}
    );
}

function showImage() {
    isNotDataReload = true;
    app.navigate("#visit-planogram-image-view");
}
