var visitPhotoList;

//----------------------------------------
// visit-photo-view
//----------------------------------------

function visitPhotoInit(e) {
    log("..visitPhotoInit");
    visitPhotoObjInit();
}

function visitPhotoShow(e) {
    log("..visitPhotoShow navBackCount=" + e.view.params.navBackCount + ", stageId=" + e.view.params.stageId);
    visitPhotoList.navBackCount = e.view.params.navBackCount;
    if (visitPhotoList.navBackCount < 1) {
        visitPhotoList.navBackCount = 1;
    }
    visitPhotoList.stageId = e.view.params.stageId;
    if (visitPhotoList.goBack) {
        navigateBack(visitPhotoList.navBackCount);
    } else {
        visitPhotoAdd();
    }
    visitPhotoList.goBack = !visitPhotoList.goBack;
}

function visitPhotoAdd() {
    log("..visitPhotoAdd");
    photoGalleryObjInit();
    photoGallery.title = "Фотоотчет";
    photoGallery.fileTableName = "FileOut";
    photoGallery.onAdd = visitPhotoPhotoGalleryPhotoAdd;
    photoGallery.addNewPhotoEnable = !visit.readonly;
    dbTools.visitPhotoListGet(visit.visitId, visitPhotoList.stageId, settings.skuCatId,
        function(tx, rs) {
            visitPhotoPhotoGalleryFileIdLstSet(rs);
            app.navigate("views/PhotoGallery.html");
        }
    );
}

function visitPhotoPhotoGalleryFileIdLstSet(rs) {
    var fileIdArr = [];
    for (var i = 0; i < rs.rows.length; i++) {
        fileIdArr.push(rs.rows.item(i).fileId);
    }
    fileIdArr = fileIdArr.concat(visitPhotoList.newPhotoLst);
    photoGallery.fileIdLst = fileIdArr.join(",");
}

function visitPhotoPhotoGalleryPhotoAdd(fileTableName, fileId) {
    log("..visitPhotoPhotoGalleryPhotoAdd(" + fileTableName + ", " + fileId + ")");
    dbTools.visitPhotoUpdate(null, visit.visitId, visitPhotoList.stageId, settings.skuCatId, fileId);
}

//----------------------------------------
// common
//----------------------------------------

function visitPhotoObjInit() {
    visitPhotoList = {};
    visitPhotoList.navBackCount = 1;
    visitPhotoList.stageId = 1;
    visitPhotoList.goBack = false;
    visitPhotoList.newPhotoLst = [];
}

