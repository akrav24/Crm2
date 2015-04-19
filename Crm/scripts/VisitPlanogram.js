var visitPlanogramList;

//----------------------------------------
// visit-planogram-view
//----------------------------------------

function visitPlanogramInit(e) {
    log("..visitPlanogramInit");
    visitPlanogramObjInit();
}

function visitPlanogramShow(e) {
    log("..visitPlanogramShow navBackCount=" + e.view.params.navBackCount + ", stageId=" + e.view.params.stageId);
    visitPlanogramList.navBackCount = e.view.params.navBackCount;
    if (visitPlanogramList.navBackCount < 1) {
        visitPlanogramList.navBackCount = 1;
    }
    visitPlanogramList.stageId = e.view.params.stageId;
    if (visitPlanogramList.goBack) {
        navigateBack(visitPlanogramList.navBackCount);
    } else {
        visitPlanogramPhotoGalleryShow();
    }
    visitPlanogramList.goBack = !visitPlanogramList.goBack;
}

function visitPlanogramPhotoGalleryShow() {
    log("..visitPlanogramPhotoGalleryShow");
    photoGalleryObjInit();
    photoGallery.title = "Соблюдение планограммы";
    photoGallery.fileTableName = "FileIn";
    //photoGallery.onAdd = visitPlanogramPhotoGalleryPhotoAdd;
    photoGallery.addNewPhotoEnable = false;
    photoGallery.fileIdLst = "";
    dbTools.visitPlanogramListGet(visit.visitId, visitPlanogramList.stageId, settings.skuCatId,
        function(tx, rs) {
log("====" + kendo.stringify(rs.rows.length));
            visitPlanogramPhotoGalleryFileIdLstSet(rs);
            app.navigate("views/PhotoGallery.html");
        }
    );
}

function visitPlanogramPhotoGalleryFileIdLstSet(rs) {
    var fileIdArr = [];
    for (var i = 0; i < rs.rows.length; i++) {
log("====" + kendo.stringify(rs.rows.item(i)));
        fileIdArr.push(rs.rows.item(i).fileId);
    }
    photoGallery.fileIdLst = fileIdArr.join(",");
}

/*function visitPlanogramPhotoGalleryPhotoAdd(fileTableName, fileId) {
    log("..visitPlanogramPhotoGalleryPhotoAdd(" + fileTableName + ", " + fileId + ")");
    dbTools.visitPhotoUpdate(null, visit.visitId, visitPlanogramList.stageId, settings.skuCatId, fileId);
}
*/
//----------------------------------------
// common
//----------------------------------------

function visitPlanogramObjInit() {
    visitPlanogramList = {};
    visitPlanogramList.navBackCount = 1;
    visitPlanogramList.stageId = 1;
    visitPlanogramList.goBack = false;
}

