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
    photoGallery.addNewPhotoEnable = false;
    photoGallery.showTagEnable = false;
    photoGallery.editTagEnable = true;
    photoGallery.fileIdLst = [];
    dbTools.visitPlanogramListGet(visit.custId, visitPlanogramList.stageId, settings.skuCatId,
        function(tx, rs) {
            photoGallery.fileIdLst = visitPlanogramPhotoGalleryFileIdLstGet(rs);
            photoGallery.onTagListGet = visitPlanogramPhotoGalleryOnTagListGet;
            photoGallery.onTagChange = visitPlanogramPhotoGalleryOnTagChange;
            app.navigate("views/PhotoGallery.html");
        }
    );
}

function visitPlanogramPhotoGalleryFileIdLstGet(rs) {
    var res = [];
    for (var i = 0; i < rs.rows.length; i++) {
        res.push({fileId: rs.rows.item(i).fileId, linkId: rs.rows.item(i).planogramId});
    }
    return res;
}

function visitPlanogramPhotoGalleryOnTagListGet(fileTableName, fileId, linkId, onSuccess, onError) {
    dbTools.visitPlanogramAnswerListGet(visit.visitId, linkId, 
        function(tx, rs) {
            var tagLst = [];
            for (var i = 0; i < rs.rows.length; i++) {
                tagLst.push({id: rs.rows.item(i).questionId, name: rs.rows.item(i).name, value: rs.rows.item(i).answer});
            }
            if (!!onSuccess) {onSuccess(tagLst);}
        }
    );
}

function visitPlanogramPhotoGalleryOnTagChange(fileTableName, fileId, linkId, tagId, value, onSuccess, onError) {
    dbTools.visitPlanogramAnswerUpdate(visit.visitId, linkId, tagId, value, 
        function(visitId, photoLinkId, photoTagId) {if (!!onSuccess) {onSuccess(photoTagId);}},
        dbTools.onSqlError
    );
}

//----------------------------------------
// common
//----------------------------------------

function visitPlanogramObjInit() {
    visitPlanogramList = {};
    visitPlanogramList.navBackCount = 1;
    visitPlanogramList.stageId = 1;
    visitPlanogramList.goBack = false;
}

