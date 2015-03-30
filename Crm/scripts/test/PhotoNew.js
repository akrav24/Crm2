/*
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
        navigateBack(1);
    };
  
    var onError = function() {
        //navigator.notification.alert("Unfortunately we could not add the image");
        navigateBack(1);
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

function visitPhotoNewNavBackClick() {
    photoGallery.goToNextViewIfEmpty = false;
    if (photoGallery.Count > 0) {
        navigateBack(1);
    } else {
        navigateBack(2);
    }
}
*/
