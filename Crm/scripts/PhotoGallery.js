var photoGallery;

var photoGalleryImageViewModel = kendo.observable({
    fileId: 0,
    linkId: 0,
    imageSrc: "",
    imageTitle: "",
    imageStyle: function() {
        return "background-image: url(" + this.get("imageSrc") + ");"
    },
    tagLst: []
});

//----------------------------------------
// photo-gallery-view
//----------------------------------------

function photoGalleryInit() {
    log("..photoGalleryInit()");
    var scrollview = $("#photo-gallery-scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(photoGallery.data);
}

function photoGalleryShow(e) {
    log("..photoGalleryShow()");
    
    //photoGallerySetDataSource([], 0);
    
    if (!photoGallery.isNotDataReload) {
        renderPhotoGallery(0);
    } else {
        photoGallery.isNotDataReload = false;
    }
    photoGalleryEnableControls();
}

function photoGalleryAfterShow(e) {
    viewTitleSet(app.view(), photoGallery.title);
}

function renderPhotoGallery(scrollToPageNumber) {
    log("..renderPhotoGallery(" + scrollToPageNumber + ")");
    dbTools.fileListGet(photoGallery.fileTableName, photoGalleryFileIdLstToFileIdStr(photoGallery.fileIdLst), 
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
    var linkId = null;
    for (var i = 0; i < photoGallery.fileIdLst.length; i++) {
        if (photoGallery.fileIdLst[i].fileId == fileId) {
            linkId = photoGallery.fileIdLst[i].linkId;
        }
    }
    fileHelper.getFileEntry(folderName, fileName, false,
        function(fileEntry) {
            dstData.push({fileId: fileId, fileName: fileEntry.name, fileLocalPath: fileEntry.toURL(), title: title, linkId: linkId});
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

function photoGalleryImageSourceSet(index) {
    log("..photoGalleryImageSourceSet(" + index + ")");
    photoGalleryImageViewModel.set("fileId", photoGallery.data[index].fileId);
    photoGalleryImageViewModel.set("linkId", photoGallery.data[index].linkId);
    photoGalleryImageViewModel.set("imageSrc", photoGallery.data[index].fileLocalPath);
    photoGalleryImageViewModel.set("imageTitle", photoGallery.data[index].title);
}

function photoGalleryNavBackClick() {
    navigateBack(1);
    if (photoGallery.onExit != undefined) {
        photoGallery.onExit(photoGallery.fileTableName, photoGalleryFileIdLstToFileIdStr(photoGallery.fileIdLst));
    }
}

function photoGalleryAddNewPhotoClick() {
    dbTools.db.transaction(function(tx) {
        dbTools.tableNextIdGet(tx, photoGallery.fileTableName, 
            function(tx, fileId) {
                photoGalleryAddNewPhoto(fileId, fileHelper.fileName(photoGalleryFilePrefix(photoGallery.fileTableName), fileId));
            }, 
            dbTools.onSqlError
        );
    }, dbTools.onTransError);
}

function photoGalleryAddNewPhoto(fileId, fileName) {
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
            fileHelper.fileDataRead(fileEntry, 
                function(dataStr) {
                    dbTools.fileUpdate(photoGallery.fileTableName, fileId, fileName, title, dataStr, 
                        function() {
                            var index = photoGallery.data.push({fileId: fileId, fileName: fileName, fileLocalPath: fileEntry.toURL(), title: title || " ", linkId: null}) - 1;
                            photoGallery.fileIdLst = photoGalleryFileIdLstGet(photoGallery.data);
                            photoGallerySetDataSource(photoGallery.data, photoGallery.data.length - 1);
                            if (!!photoGallery.onAdd) {
                                photoGallery.onAdd(photoGallery.fileTableName, fileId, fileName,
                                    function(linkId) {
                                        photoGallery.data[index].linkId = linkId;
                                    }
                                );
                            }
                        }, 
                        function(errMsg) {log(errMsg);}
                    );
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
    var res = [];
    for (var i; i < data.length; i++) {
        res.push({fileId: data[i].fileId, linkId: null});
    }
}

function photoGalleryShowImage() {
    if (photoGallery.editTagEnable) {
        photoGallery.isNotDataReload = true;
        app.navigate("#photo-gallery-image-view");
    }
}

//----------------------------------------
// photo-gallery-image-view
//----------------------------------------

function photoGalleryImageViewInit(e) {
    log("..photoGalleryImageViewInit()");
}

function photoGalleryImageViewShow(e) {
    log("..photoGalleryImageViewShow()");
    // !!! 
    //$(".gallery-tag-edit-image").attr("style", photoGalleryImageViewModel.imageStyle());
    $(".gallery-tag-edit-image").attr("src", photoGalleryImageViewModel.imageSrc);
    if (!!photoGallery.onTagListGet) {
        photoGallery.onTagListGet(photoGallery.fileTableName, photoGalleryImageViewModel.get("fileId"), photoGalleryImageViewModel.get("linkId"), 
            function(tagLst) {
log("====tagLst=" + kendo.stringify(tagLst));
                photoGalleryImageViewModel.set("tagLst", tagLst);
                // !!!
                $("#gallery-tag-edit-tag-list").data("kendoMobileListView").setDataSource(photoGalleryImageViewModel.get("tagLst"));
                $(".checkbox").on("ifChecked", photoGalleryImageTagEditOnCheck);
                $(".checkbox").on("ifUnchecked", photoGalleryImageTagEditOnUncheck);
                $(".checkbox").iCheck({
                    checkboxClass: "icheckbox_flat-green",
                    radioClass: "iradio_flat-green",
                    increaseArea: "100%" // optional
                });
                if (visit.readonly) {
                    $(".checkbox").iCheck("disable");
                }
            }, 
            function(errMsg) {log(errMsg);}
        );
    }
}

function photoGalleryImageViewAfterShow(e) {
    var imageTitle = photoGalleryImageViewModel.get("imageTitle");
    if (imageTitle == "" || imageTitle == " ") {
        imageTitle = photoGallery.title;
    }
    viewTitleSet(app.view(), imageTitle);
}

function photoGalleryImageTagEditOnCheck(e) {
    if (!!photoGallery.onTagChange) {
        photoGallery.onTagChange(photoGallery.fileTableName, photoGalleryImageViewModel.get("fileId"), photoGalleryImageViewModel.get("linkId"), $(this).attr("data-tag-id"), 1);
    }
}

function photoGalleryImageTagEditOnUncheck(e) {
    if (!!photoGallery.onTagChange) {
        photoGallery.onTagChange(photoGallery.fileTableName, photoGalleryImageViewModel.get("fileId"), photoGalleryImageViewModel.get("linkId"), $(this).attr("data-tag-id"), 0);
    }
}

//----------------------------------------
// common
//----------------------------------------

function photoGalleryFileIdLstToFileIdStr(fileIdLst) {
    log("..photoGalleryFileIdLstToFileIdStr(" + kendo.stringify(fileIdLst) + ")");
    var res = [];
    for (var i = 0; i < fileIdLst.length; i++) {
        res.push(fileIdLst[i].fileId);
    }
    return res.join(",");
}

function photoGalleryObjInit() {
    photoGallery = {};
    
    // public var's
    //
    // заголовок
    photoGallery.title = "Фотогалерея";
    // имя таблицы файлов (FileIn, FileOut)
    photoGallery.fileTableName = "FileOut";
    // перечень ID файлов (и ID связанных обектов), отображаемых в галерее, fileIdLst = [{fileId, linkId}, ...]
    photoGallery.fileIdLst = [];
    // можно ли делать фото
    photoGallery.addNewPhotoEnable = false;
    // 
    photoGallery.showTagEnable = false;
    photoGallery.editTagEnable = false;
    
    // events
    //
    // событие возникающее после добавления нового фото - photoGallery.onAdd(fileTableName, fileId, fileName, onSuccess, onError), onSuccess = function(linkId), onError = function(errMsg)
    photoGallery.onAdd = undefined;
    // событие возникающее после удаления фото - photoGallery.onDelete(fileTableName, fileId)
    photoGallery.onDelete = undefined;
    // событие возникающее при выходе из галереи - photoGallery.onExit(fileTableName, fileIdLst)
    photoGallery.onExit = undefined;
    // событие возникающее при получении списка тегов - photoGallery.onTagListGet(fileTableName, fileId, linkId, onSuccess, onError), onSuccess = function(tagLst), tagLst = [{id, name, value}, ...], onError = function(errMsg)
    photoGallery.onTagListGet = undefined;
    // событие возникающее после добавления изменения значения тега - photoGallery.onTagChange(fileTableName, fileId, linkId, tagId, value, onSuccess, onError)
    photoGallery.onTagChange = undefined;
    
    // private var's
    //
    // признак: автооткрытие камеры, если список фото пуст
    photoGallery.makeNewPhotoIfEmpty = true;
    // признак: не переначитывать список фото из БД
    photoGallery.isNotDataReload = false;
    // photoGallery.data = [{fileId, fileName, fileLocalPath, title, linkId}, ...]
    photoGallery.data = [];
    
}

