// photoGallery = {title, fileTableName, fileIdLst, addNewPhotoEnable, onAdd, onDelete, onExit}
var photoGallery;

var photoGalleryImageViewModel = kendo.observable({
    fileId: 0,
    imageSrc: "",
    imageTitle: ""
});

var isNotDataReload = false;

function photoGalleryInit() {
    log("..photoGalleryInit()");
    var scrollview = $("#photo-gallery-scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(photoGallery.data);
    
    // TODO: AK DEL
    /*dbTools.db.transaction(function(tx) {
            tx.executeSql("delete from visitpromophoto", [],
                function(tx, rs) {log("----SUCCESS delete from visitpromophoto");},
                function(tx, error) {log("----ERROR delete from visitpromophoto");}
            );
        }, dbTools.onTransError
    );
    */
}

function photoGalleryShow(e) {
    log("..photoGalleryShow()");
    
    if (!isNotDataReload) {
        renderPhotoGallery(0);
    } else {
        isNotDataReload = false;
    }
    photoGalleryEnableControls();
}

function photoGalleryAfterShow(e) {
    viewTitleSet(app.view(), photoGallery.title);
}

function renderPhotoGallery(scrollToPageNumber) {
    log("..renderPhotoGallery(" + scrollToPageNumber + ")");
    dbTools.fileListGet(photoGallery.fileTableName, photoGallery.fileIdLst, 
        function(tx, rs) {renderPhotoGalleryScrollView(tx, rs, scrollToPageNumber);}
    );
}

function renderPhotoGalleryScrollView(tx, rs, scrollToPageNumber) {
    log("..renderPhotoGalleryScrollView(tx, rs, " + scrollToPageNumber + ")");
    photoGallery.data = [];
    var folderName = fileHelper.folderName();
    if (rs.rows.length > 0) {
        photoGalleryDataAdd(folderName, rs, photoGallery.data, 0, scrollToPageNumber);
    } else {
        photoGallerySetDataSource(photoGallery.data, 0);
    }
}

function photoGalleryDataAdd(folderName, srcRs, dstData, index, scrollToPageNumber) {
    log("..photoGalleryDataAdd('" + folderName + "', srcRs, dstData, " + index + ", " + scrollToPageNumber + ")");
    var title = srcRs.rows.item(index).title || " ";
    var fileId = srcRs.rows.item(index).fileId;
    var fileName = srcRs.rows.item(index).fileName;
    fileHelper.getFileEntry(folderName, fileName, 
        function(fileEntry) {
            dstData.push({fileId: fileId, fileName: fileEntry.name, fileLocalPath: fileEntry.toURL(), title: title});
            if (index < srcRs.rows.length - 1) {
                photoGalleryDataAdd(folderName, srcRs, dstData, ++index, scrollToPageNumber);
            } else {
                photoGallerySetDataSource(dstData, scrollToPageNumber);
            }
        }, 
        function(errMsg) {log(errMsg);}
    );
}

function photoGallerySetDataSource(data, scrollToPageNumber) {
    log("..photoGallerySetDataSource(" + JSON.stringify(data) + ", " + scrollToPageNumber + ")");
    var scrollview = $("#photo-gallery-scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
    scrollview.refresh();
    if (data.length > 0) {
        scrollview.scrollTo(scrollToPageNumber, true);
        photoGalleryImageSourceSet(scrollToPageNumber);
    }
    
    if (data.length === 0) {
        if (photoGallery.makeNewPhotoIfEmpty) {
            photoGalleryAddNewPhotoClick();
        }
    }
    photoGallery.makeNewPhotoIfEmpty = true;
}

function photoGalleryScrollviewOnChanging(e) {
    photoGalleryImageSourceSet(e.nextPage);
}

function photoGalleryEnableControls() {
    showControl("#photo-gallery-add-new-photo-button", photoGallery.addNewPhotoEnable);
}

function photoGalleryImageViewShow(e) {
    var navbar = e.view.header.find(".km-navbar").data("kendoMobileNavBar");
    navbar.title(imageTitle);
}

function photoGalleryObjInit() {
    photoGallery = {};
    // заголовок
    photoGallery.title = "Фотогалерея";
    // имя таблицы файлов (FileIn, FileOut)
    photoGallery.fileTableName = "FileOut";
    // перечень ID файлов, отображаемых в галерее
    photoGallery.fileIdLst = "";
    // можно ли делать фото
    photoGallery.addNewPhotoEnable = false;
    
    // событие возникающее после добавления нового фото - photoGallery.onAdd(fileTableName, fileId)
    photoGallery.onAdd = undefined;
    // событие возникающее после удаления фото - photoGallery.onDelete(fileTableName, fileId)
    photoGallery.onDelete = undefined;
    // событие возникающее при выходе из галереи - photoGallery.onExit(fileTableName, fileIdLst)
    photoGallery.onExit = undefined;
    
    // local var's
    photoGallery.makeNewPhotoIfEmpty = true;
    // photoGallery.data = [{fileId, fileName, fileLocalPath, title}, ...]
    photoGallery.data = [];
    
}

function photoGalleryImageSourceSet(index) {
    log("..photoGalleryImageSourceSet(" + index + ")");
    photoGalleryImageViewModel.set("fileId", photoGallery.data[index].fileId);
    photoGalleryImageViewModel.set("imageSrc", photoGallery.data[index].fileLocalPath);
    photoGalleryImageViewModel.set("imageTitle", photoGallery.data[index].title);
}

function photoGalleryShowImage() {
    /*isNotDataReload = true;
    app.navigate("#photo-gallery-image-view");
    */
}

function photoGalleryNavBackClick() {
    navigateBack(1);
    if (photoGallery.onExit != undefined) {
        photoGallery.onExit(photoGallery.fileTableName, photoGallery.fileIdLst);
    }
}

function photoGalleryAddNewPhotoClick() {
    dbTools.db.transaction(function(tx) {
        dbTools.tableNextIdGet(tx, photoGallery.fileTableName, 
            function(tx, fileId) {
                visitPhotoNew(fileId, fileHelper.fileName(photoGalleryFilePrefix(photoGallery.fileTableName), fileId));
            }, 
            dbTools.onSqlError
        );
    }, dbTools.onTransError);
}

function visitPhotoNew(fileId, fileName) {
    log("..visitPhotoNew(" + fileId + ", " + fileName + ")");
    var onSuccess = function(data) {
        //var image = $("#visit-photo-new-img");
        //image.attr("src", data);
        photoGallerySaveNewPhoto(data, fileId, fileName);
    };
  
    var onError = function() {
        photoGallery.makeNewPhotoIfEmpty = false;
    };
    
    if (photoGallery.addNewPhotoEnable) {
        var config = {
            sourceType : Camera.PictureSourceType.CAMERA,
            //destinationType: Camera.DestinationType.DATA_URL,  
            destinationType: Camera.DestinationType.FILE_URI,
            //saveToPhotoAlbum: true,
            encodingType: Camera.EncodingType.JPEG,
            //allowEdit: true,
            quality: settings.newPhoto.quality,
            targetHeight: settings.newPhoto.height,
            targetWidth: settings.newPhoto.width
            };
        
        navigator.camera.getPicture(onSuccess, onError, config);
    }
}

function photoGallerySaveNewPhoto(fileUri, fileId, fileName) {
    log("..photoGallerySaveNewPhoto(" + fileUri + ", " + fileId + ", " + fileName + ")");
    var title = null;
    fileHelper.fileCopy(fileUri, fileHelper.folderName(), fileName, 
        function(fileEntry) {
            dbTools.fileUpdate(photoGallery.fileTableName, fileId, fileName, title, 
                function() {
                    photoGallery.data.push({fileId: fileId, fileName: fileName, fileLocalPath: fileEntry.toURL(), title: title || " "});
                    photoGallery.fileIdLst = photoGalleryFileIdLstGet(photoGallery.data);
                    photoGallerySetDataSource(photoGallery.data, photoGallery.data.length - 1);
                    if (photoGallery.onAdd != undefined) {photoGallery.onAdd(photoGallery.fileTableName, fileId);}
                }, 
                function(errMsg) {log(errMsg);}
            );
            
        },
        function(errMsg) {log("photoGallerySaveNewPhoto fileHelper.fileCopy ERROR: " + errMsg);}
    );
    
}

function photoGalleryFilePrefix(fileTableName) {
    var filePrefix = "";
    switch (fileTableName.toLowerCase()) {
        case "fileout":
            filePrefix = "out";
            break;
        case "filein":
            filePrefix = "in";
            break;
    }
    return filePrefix;
}

function photoGalleryFileIdLstGet(data) {
    var res = "";
    for (var i; i < data.length; i++) {
        if (res.length > 0) {
            res = res.concat(",");
        }
        res = res.concat(data[i].fileId);
    }
}
