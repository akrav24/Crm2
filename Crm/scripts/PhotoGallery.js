var data;
var photoGallery;


var imageSrc = "";
var imageTitle = "";
var photoGalleryImageViewModel = kendo.observable({
    imageSrc: imageSrc,
    imageTitle: imageTitle
});

var isNotDataReload = false;

function photoGalleryInit() {
    log("..photoGalleryInit()");
    data = [];
    photoGalleryObjInit();
    var scrollview = $("#photo-gallery-scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
    
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
    photoGallery.galleryType = e.view.params.galleryType;
    if (!isNotDataReload) {
        renderPhotoGalleryScrollView(0);
    } else {
        isNotDataReload = false;
    }
    
}

function renderPhotoGalleryScrollView(scrollToPageNumber) {
    var folderName = fileHelper.folderName(photoGallery.galleryType);
    data = [];
    var srcData = photoGalleryDataGet(photoGallery.galleryType);
    log("====srcData=" + JSON.stringify(srcData));
    if (srcData.length > 0) {
        photoGalleryDataAdd(data, folderName, srcData, 0, scrollToPageNumber);
    } else {
        //data = {fileId: 0, filePath: "", title: ""};
        photoGallerySetDataSource(data, scrollToPageNumber);
    }
    photoGallery.count = srcData.length;
    if (photoGallery.count === 0) {
        if (photoGallery.goToNextViewIfEmpty) {
            //app.navigate("views/PhotoNew.html");
            visitPhotoNewClick();
        }
    }
    photoGallery.goToNextViewIfEmpty = true;
}

function photoGalleryDataAdd(data, folderName, srcData, i, scrollToPageNumber) {
    var title = srcData[i].title;
    var fileId = srcData[i].fileId;
    var fileName = "";
    if (srcData[i].filePath != "") {
        fileName = srcData[i].filePath;
    } else {
        fileName = fileHelper.fileName(photoGallery.galleryType, fileId);
    }
    fileHelper.getFileEntry(folderName, fileName, 
        function(fileEntry) {
            data.push({fileId: fileId, filePath: fileEntry.toURL(), title: title});
            if (i < srcData.length - 1) {
                photoGalleryDataAdd(data, folderName, srcData, ++i, scrollToPageNumber);
            } else {
                photoGallerySetDataSource(data, scrollToPageNumber);
            }
        }, 
        function(errMsg) {log(errMsg);}
    );
}

function photoGallerySetDataSource(data, scrollToPageNumber) {
    log("..photoGallerySetDataSource: " + JSON.stringify(data));
    var scrollview = $("#photo-gallery-scrollview").data("kendoMobileScrollView");
    scrollview.setDataSource(data);
    //scrollview.refresh();
    if (data.length > 0) {
        scrollview.scrollTo(scrollToPageNumber, true);
        photoGalleryImageSourceSet(scrollToPageNumber);
    }
}

function photoGalleryScrollviewOnChanging(e) {
    photoGalleryImageSourceSet(e.nextPage);
}

function photoGalleryImageViewShow(e) {
    var navbar = e.view.header.find(".km-navbar").data("kendoMobileNavBar");
    navbar.title(imageTitle);
}

function photoGalleryImageSourceSet(i) {
    if (data[i].title != "") {
        imageTitle = data[i].title;
    } else {
        imageTitle = "";
    }
    var fileId = data[i].fileId;
    var folderName = fileHelper.folderName(photoGallery.galleryType);
    var fileName = fileHelper.fileName(photoGallery.galleryType, fileId);
    fileHelper.getFileEntry(folderName, fileName, 
        function(fileEntry) {
            imageSrc = fileEntry.toURL();
            log("....imageSrc=" + imageSrc);
            photoGalleryImageViewModel.set("imageSrc", imageSrc);
            photoGalleryImageViewModel.set("imageTitle", imageTitle);
        }, 
        function(errMsg) {log(errMsg);}
    );
}

function photoGalleryShowImage() {
    /*isNotDataReload = true;
    app.navigate("#photo-gallery-image-view");
    */
}

function photoGalleryDataGet(galleryType) {
    var data = [];
    switch (galleryType.toLowerCase()) {
        case "visitpromophoto":
            data = visitPromoPhotoData;
            break;
    }
    return data;
}

function photoGalleryAddNewPhotoClick() {
    if (photoGallery.galleryType != "") {
        dbTools.db.transaction(function(tx) {
            dbTools.tableNextIdGet(tx, photoGallery.galleryType, 
                function(tx, fileId) {
                    photoGallery.newFileId = fileId;
                    photoGallery.newFileName = fileHelper.fileName(photoGallery.galleryType, photoGallery.newFileId);
                    //app.navigate("views/PhotoNew.html");
                    visitPhotoNewClick();
                }, 
                dbTools.onSqlError
            );
        }, dbTools.onTransError);
    } else {
        //app.navigate("views/PhotoNew.html");
        visitPhotoNewClick();
    }
}

function photoGalleryObjInit() {
    photoGallery = {};
    photoGallery.galleryType = "";
    photoGallery.count = 0;
    photoGallery.goToNextViewIfEmpty = true;
    photoGallery.newFileId = null;
    photoGallery.newFileName = "";
}

function photoGallerySaveNewPhoto(fileUri) {
    log("..photoGallerySaveNewPhoto(" + fileUri + ")");
    fileHelper.fileCopy(fileUri, fileHelper.folderName(photoGallery.galleryType), photoGallery.newFileName, 
        function(fileEntry) {
            switch (photoGallery.galleryType.toLowerCase()) {
                case "visitpromophoto":
                    dbTools.visitPromoPhotoUpdate(visitPromoItem.visitPromoId, photoGallery.newFileId, photoGallery.newFileName, 
                        function() {
                            dbTools.visitPromoPhotoListGet(visitPromoItem.visitPromoId, 
                                function(tx, rs) {
                                    photoGallery.count = rs.rows.length;
                                    visitPromoPhotoObjInit();
                                    for (var i = 0; i < rs.rows.length; i++) {
                                        visitPromoPhotoData.push({fileId: rs.rows.item(i).visitPromoPhotoId, filePath: rs.rows.item(i).fileName, title: ""});
                                    }
                                    renderPhotoGalleryScrollView(photoGallery.count - 1);
                                }
                            );
                        }, 
                        dbTools.onSqlError
                    );
                    break;
            }
        },
        function(errMsg) {log("photoGallerySaveNewPhoto fileHelper.fileCopy ERROR: " + errMsg);}
    );
    
}


/*---------------------------------------------*/

var imgQuality = 85;
var imgSize = 600;

function visitPhotoNewInit() {
    log("..visitPhotoNewInit()");
}

function visitPhotoNewShow(e) {
    log("..visitPhotoNewShow()");
    visitPhotoNewClick();
}

function visitPhotoNewClick(e) {
    var onSuccess = function(data) {
        var image = $("#visit-photo-new-img");
        
        image.attr("src", data);
        
        photoGallerySaveNewPhoto(data);
        //navigateBack(1);
    };
  
    var onError = function() {
        //navigator.notification.alert("Unfortunately we could not add the image");
        photoGallery.goToNextViewIfEmpty = false;
        //navigateBack(1);
    };
  
  var config = {
    sourceType : Camera.PictureSourceType.CAMERA,
    //destinationType: Camera.DestinationType.DATA_URL,  
    destinationType: Camera.DestinationType.FILE_URI,
    //saveToPhotoAlbum: true,
    encodingType: Camera.EncodingType.JPEG,
    //allowEdit: true,
    quality: imgQuality,
    targetHeight: imgSize,
    targetWidth: imgSize
  };
  
  navigator.camera.getPicture(onSuccess, onError, config);
}

