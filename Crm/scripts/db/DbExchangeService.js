dbTools.serverUrl = function(serverName, port) {
    return "http://" + serverName + (port != undefined ? ":" + port : "") + "/"
}

dbTools.checkConnection = function(onSuccess, onError) {
    log("checkConnection()");
    var networkState = navigator.connection.type;
    
    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';
    
    log("..checkConnection: " + states[networkState]);
    if (networkState != Connection.NONE) {
        if (onSuccess != undefined) {onSuccess(networkState, states[networkState]);}
    } else {
        if (onError != undefined) {onError(networkState, states[networkState]);}
    }
    
    return networkState != Connection.NONE;
}

// Get blockId (exchange start)
dbTools.exchangeBlockIdGet = function(onSuccess, onError) {
    var blockId = 0;
    var url = dbTools.serverUrl(settings.serverName, settings.serverPort) + "Api/ExchangeStart/?nodeId=" + settings.nodeId;
    log("exchangeBlockIdGet() nodeId=" + settings.nodeId);
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            if (data.length !== 0) {
                blockId = data[0].blockId;
            }
            log("..exchangeBlockIdGet blockId=" + blockId);
            if (onSuccess != undefined) {onSuccess(blockId);}
        },
        error: function (jqXHR, textStatus, errorThrown) {if (onError != undefined) {onError("Ajax Get Error: " + url);}}
    });
    return blockId;
}

// Send data to web service
dbTools.exchangeDataPost = function(blockId, data, onSuccess, onError) {
    dataLength = data.length;
    log("exchangeDataPost(blockId=" + blockId  + ", data=[" + data.length + " rows])");
    var url = dbTools.serverUrl(settings.serverName, settings.serverPort) + "Api/Exchange/?blockId=" + blockId;
    log("..exchangeDataPost: sending data...");
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data) {
            log("......");
            log("..exchangeDataPost: " + dataLength + " rows sent");
            log("......");
            if (onSuccess != undefined) {
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {log("====error");/*if (onError != undefined) {onError("Ajax Post Error: " + url);}*/}
    });
}

// Get data from web service
dbTools.exchangeDataGet = function(blockId, onSuccess, onError) {
    log("exchangeDataGet(blockId=" + blockId + ")");
    var url = dbTools.serverUrl(settings.serverName, settings.serverPort) + "Api/Exchange/?blockId=" + blockId;
    log("..exchangeDataGet: receiving data...");
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            log("......");
            log("..exchangeDataGet: " + data.length + " rows received");
            log("......");
            if (onSuccess != undefined) {
                onSuccess(blockId, data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {if (onError != undefined) {onError("Ajax Get Error: " + url);}}
    });
}

// Upload file to web service
dbTools.exchangeDataFileUpload = function(blockId, dstFileName, fileURI, mimeType, onSuccess, onError) {
    log("exchangeDataFileUpload(blockId=" + blockId  + ", dstFileName=" + dstFileName + ", fileURI=" + fileURI + ", mimeType=" + mimeType +  ")");
    
    var uploadOnSuccess = function(r) {
        log("..exchangeDataFileUpload file sent");
        if (onSuccess != undefined) {
            var data = {responseCode: r.responseCode, response: r.response, bytesSent: r.bytesSent};
            onSuccess(blockId, data);
        }
    }

    var uploadOnError = function(error) {
        if (onError != undefined) {
            onError("FileTransfer Upload Error: code=" + error.code + ", source=" + error.source + ", target=" + error.target);
        }
    }
    
    var url = dbTools.serverUrl(settings.serverName, settings.serverPort) + "Api/Exchange/PostFile/?blockId=" + blockId + "&fileName=" + dstFileName;
    
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = dstFileName;
    options.mimeType = mimeType;

    var params = {};
    /*params.blockId = blockId;
    params.fileName = dstFileName;
    */
    options.params = params;

    var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI(url), uploadOnSuccess, uploadOnError, options, true);
}

// Download file (by fileId) from web service
dbTools.exchangeDataFileByIdDownload = function(blockId, fileId, onSuccess, onError) {
    log("exchangeDataFileByIdDownload(blockId=" + blockId  + ", fileId=" + fileId +  ")");
    
    var url = dbTools.serverUrl(settings.serverName, settings.serverPort) + "Api/Exchange/GetFileById/?blockId=" + blockId + "&fileId=" + fileId;
    var folderName = fileHelper.folderName();
    var fileName = fileHelper.fileName("plan", fileId);
    var filePath = "";
    
    var uploadOnSuccess = function(fileEntry) {
        //log("..exchangeDataFileByIdDownload file received: " + fileEntry.fullPath);
        fileHelper.getFileEntry(folderName, fileName, function(fileEntry) {log("..exchangeDataFileByIdDownload file received: " + fileEntry.toURL());}, onError);
        if (onSuccess != undefined) {
            onSuccess(blockId, fileId, fileEntry);
        }
    }

    var uploadOnError = function(error) {
        if (onError != undefined) {
            onError("FileTransfer Download Error: code=" + error.code + ", source=" + error.source + ", target=" + error.target);
        }
    }
    
    fileHelper.getFilesystem(
        function(fileSystem) {
            fileHelper.getFolder(fileSystem, folderName,
                function(folder) {
                    filePath = folder.toURL() + "/" + fileName;
log("====" + folder.toURL());
                    
                    var options = new FileUploadOptions();
                    //options.headers = "";
                    
                    var ft = new FileTransfer();
                    ft.download(url, filePath, uploadOnSuccess, uploadOnError, false, options);
                },
                function() {
                    onError("FileTransfer Download Error: failed to get folder '" + folderName + "'");
                }
            );
        },
        function() {
            onError("FileTransfer Download Error: failed to get filesystem");
        }
    );
}

