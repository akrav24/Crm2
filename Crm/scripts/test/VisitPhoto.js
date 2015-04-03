var imgQuality = 85;
var imgSize = 600;

function visitNewPhotoOnClick(e) {
  var success = function(data) {
    var image = $("#visit-photo-img");
    //image.attr("src", "data:image/jpeg;base64," + data);
    //log("img size=" + data.length);
    //log("img=" + data);
    
    image.attr("src", data);
    
    var dt = new Date();
    var dstFileName = settings.nodeId.toString() + "_" + dateToStr(dt, "YYYY_MM_DD_HH_NN_SS_ZZZ") + ".jpg";
    var mimeType = "image/jpeg";
    dbTools.exchangeDataFileUpload(0, dstFileName, data, mimeType, function() {log("----" + dstFileName + " uploaded");}, function(errMsg) {log("----" + dstFileName +  " upload error: " + errMsg);});
  };
  
  var error = function() {
    navigator.notification.alert("Unfortunately we could not add the image");
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
  
  navigator.camera.getPicture(success, error, config);
}
