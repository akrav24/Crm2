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
    photoGallery.title = "Фотоотчет - " + settings.skuCatName;
    photoGallery.fileTableName = "FileOut";
    photoGallery.onAdd = visitPhotoPhotoGalleryPhotoAdd;
    photoGallery.addNewPhotoEnable = !visit.readonly;
    photoGallery.showTagEnable = false;
    photoGallery.editTagEnable = true;
    photoGallery.fileIdLst = [];
    dbTools.visitPhotoListGet(visit.visitId, visitPhotoList.stageId, settings.skuCatId,
        function(tx, rs) {
            photoGallery.fileIdLst = visitPhotoPhotoGalleryFileIdLstGet(rs);
            photoGallery.onTagListGet = visitPhotoPhotoGalleryOnTagListGet;
            photoGallery.onTagChange = visitPhotoPhotoGalleryOnTagChange;
            app.navigate("views/PhotoGallery.html");
        }
    );
}

function visitPhotoPhotoGalleryFileIdLstGet(rs) {
    var res = [];
    for (var i = 0; i < rs.rows.length; i++) {
        res.push({fileId: rs.rows.item(i).fileId, linkId: rs.rows.item(i).visitPhotoId});
    }
    res = res.concat(visitPhotoList.newPhotoLst);
    return res;
}

function visitPhotoPhotoGalleryPhotoAdd(fileTableName, fileId, fileName, onSuccess, onError) {
    log("..visitPhotoPhotoGalleryPhotoAdd('" + fileTableName + "', " + fileId + ", '" + fileName + "')");
    dbTools.visitPhotoUpdate(null, visit.visitId, visitPhotoList.stageId, settings.skuCatId, fileId, onSuccess, onError);
}

function visitPhotoPhotoGalleryOnTagListGet(fileTableName, fileId, linkId, onSuccess, onError) {
    dbTools.visitpPhotoTagListGet(linkId, 
        function(tx, rs) {
            var tagLst = [];
            for (var i = 0; i < rs.rows.length; i++) {
                tagLst.push({id: rs.rows.item(i).photoTagId, name: rs.rows.item(i).name, value: rs.rows.item(i).value});
            }
            if (!!onSuccess) {onSuccess(tagLst);}
        }
    );
}

function visitPhotoPhotoGalleryOnTagChange(fileTableName, fileId, linkId, tagId, value, onSuccess, onError) {
    dbTools.visitPhotoTagUpdate(visit.visitId, linkId, tagId, value, 
        function(visitId, questionId) {if (!!onSuccess) {onSuccess(questionId);}}, 
        dbTools.onSqlError
    );
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

