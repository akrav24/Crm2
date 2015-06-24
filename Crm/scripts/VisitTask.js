var visitTaskList;

//----------------------------------------
// visit-task-view
//----------------------------------------

function visitTaskInit(e) {
    log("..visitTaskInit");
    visitTaskObjInit();
}

function visitTaskShow(e) {
    log("..visitTaskShow navBackCount=" + e.view.params.navBackCount);
    visitTaskList.navBackCount = e.view.params.navBackCount;
    if (visitTaskList.navBackCount < 1) {
        visitTaskList.navBackCount = 1;
    }
    if (visitTaskList.goBack) {
        navigateBack(visitTaskList.navBackCount);
    } else {
        visitTaskPhotoGalleryShow();
    }
    visitTaskList.goBack = !visitTaskList.goBack;
}

function visitTaskPhotoGalleryShow() {
    log("..visitTaskPhotoGalleryShow");
    photoGalleryObjInit();
    photoGallery.title = "Промо-активность NIVEA";
    photoGallery.fileTableName = "FileIn";
    photoGallery.addNewPhotoEnable = false;
    photoGallery.showTagEnable = false;
    photoGallery.editTagEnable = true;
    photoGallery.fileIdLst = [];
    dbTools.visitTaskListGet(visit.dateBgn, visit.custId,
        function(tx, rs) {
            photoGallery.fileIdLst = visitTaskPhotoGalleryFileIdLstGet(rs);
            photoGallery.onTagListGet = visitTaskPhotoGalleryOnTagListGet;
            photoGallery.onTagChange = visitTaskPhotoGalleryOnTagChange;
            app.navigate("views/PhotoGallery.html");
        }
    );
}

function visitTaskPhotoGalleryFileIdLstGet(rs) {
    var res = [];
    for (var i = 0; i < rs.rows.length; i++) {
        res.push({fileId: rs.rows.item(i).fileId, linkId: rs.rows.item(i).taskId});
    }
    return res;
}

function visitTaskPhotoGalleryOnTagListGet(fileTableName, fileId, linkId, onSuccess, onError) {
    dbTools.visitSubTaskListGet(visit.visitId, linkId, 
        function(tx, rs) {
            var tagLst = [];
            for (var i = 0; i < rs.rows.length; i++) {
                tagLst.push({id: rs.rows.item(i).subTaskId, name: rs.rows.item(i).name, value: rs.rows.item(i).done});
            }
            if (!!onSuccess) {onSuccess(tagLst);}
        }
    );
}

function visitTaskPhotoGalleryOnTagChange(fileTableName, fileId, linkId, tagId, value, onSuccess, onError) {
    dbTools.visitSubTaskDoneUpdate(visit.visitId, linkId, tagId, value, 
        function(visitId, photoLinkId, photoTagId) {if (!!onSuccess) {onSuccess(photoTagId);}},
        dbTools.onSqlError
    );
}

//----------------------------------------
// common
//----------------------------------------

function visitTaskObjInit() {
    visitTaskList = {};
    visitTaskList.navBackCount = 1;
    visitTaskList.goBack = false;
}

