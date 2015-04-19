var fileHelper = {};

fileHelper.getFilesystem = function(onSuccess, onError) {
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
}

fileHelper.getFolder = function (fileSystem, folderName, onSuccess, onError) {
	fileSystem.root.getDirectory(folderName, {create: true, exclusive: false}, onSuccess, onError)
}

fileHelper.getFileEntry = function(folderName, fileName, createIfNotExist, onSuccess, onError) {
    //log("fileHelper.getFileEntry('" + folderName + "', '" + fileName + "', " + createIfNotExist + ")");
    var that = this;
    var onResolveSuccess = function(fileEntry) {if (onSuccess != undefined) {onSuccess(fileEntry);}}
    var onResolveError = function(error) {if (onError != undefined) {onError("error.code=" + error.code);}}
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    that.getFilesystem(
        function(fileSystem) {
            that.getFolder(fileSystem, folderName,
                function(folder) {
                    var filePath = folder.toURL() + "/" + fileName;
                    //window.resolveLocalFileSystemURL(filePath, onResolveSuccess, onResolveError)
                    folder.getFile(fileName, {create: false, exclusive: false}, 
                        onResolveSuccess, 
                        function(error) {
                            if ((error.code == FileError.NOT_FOUND_ERR) && createIfNotExist) {
                                folder.getFile(fileName, {create: true, exclusive: false}, onResolveSuccess, onResolveError);
                            } else {
                                onResolveError(error);
                            }
                        }
                    );
                },
                function() {
                    onErrors("Error: failed to get folder '" + folderName + "'");
                }
            );
        },
        function() {
            onErrors("Error: failed to get filesystem");
        }
    );
}

fileHelper.fileName = function(filePrefix, fileId) {
    return filePrefix + fileId.toString() + ".png";
}

fileHelper.folderName = function() {
    return settings.rootFolderName;
}

fileHelper.fileCopy = function(srcFullName, dstFolderName, dstFileName, onSuccess, onError) {
    var onResolveSuccess = function(fileEntry) {
        var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
        var onCopySuccess = function (fileEntry) {if (onSuccess != undefined) {onSuccess(fileEntry);}}
        var onCopyError = function(error) {if (onError != undefined) {onError("error.code=" + error.code);}}
        
        fileHelper.getFilesystem(
            function(fileSystem) {
                fileHelper.getFolder(fileSystem, dstFolderName,
                    function(folder) {
                        fileEntry.copyTo(folder, dstFileName, onCopySuccess, onCopyError);
                    },
                    function() {
                        onErrors("Error: failed to get folder '" + dstFolderName + "'");
                    }
                );
            },
            function() {
                onErrors("Error: failed to get filesystem");
            }
        );
    }
    
    var onResolveError = function(error) {if (onError != undefined) {onError("error.code=" + error.code);}}
    
    window.resolveLocalFileSystemURL(srcFullName, onResolveSuccess, onResolveError);
}

/*fileHelper.errMsg = function(fileError) {
    switch (fileError.code) {
        case FileError.NOT_FOUND_ERR:
        case FileError.SECURITY_ERR:
        case FileError.ABORT_ERR:
        case FileError.NOT_READABLE_ERR:
        case FileError.ENCODING_ERR:
        case FileError.NO_MODIFICATION_ALLOWED_ERR:
        case FileError.INVALID_STATE_ERR:
        case FileError.SYNTAX_ERR:
        case FileError.INVALID_MODIFICATION_ERR:
        case FileError.QUOTA_EXCEEDED_ERR:
        case FileError.TYPE_MISMATCH_ERR:
        case FileError.PATH_EXISTS_ERR:
    }
}
*/

fileHelper.fileDataSave = function(dataStr, folderName, fileName, onSuccess, onError) {
    log("fileHelper.fileDataSave('" + dataStr.substring(0, 10) + "...', '" + folderName + "', '" + fileName + "')");
    
    var onSaveError = function(writer) {if (onError != undefined) {onError("error.code=" + writer.error.code + ", file='" + writer.localURL + "'");}}
    
    var getFileWriterSuccess = function(writer) {
        //log("..fileHelper.fileSave getFileWriterSuccess '" + writer.localURL + "'");
        writer.onwrite = function(e) {
            log("....fileHelper.fileSave truncate done '" + writer.localURL + "'");
            writer.onwrite = function(e) {
                log("..fileHelper.fileSave succsess '" + this.localURL + "'");
                if (onSuccess != undefined) {onSuccess(e.target);}
            };
            writer.write(fileHelper.dataStrToByteArray(dataStr));
        };
        writer.onerror = function(e) {
            onSaveError(e.target);
        };
        
        writer.truncate(0);
    }
    
    var getFileEntrySuccess = function(fileEntry) {
        //log("..fileHelper.fileSave getFileEntrySuccess '" + fileEntry.fullPath + "'");
        fileEntry.createWriter(getFileWriterSuccess, onSaveError);
    }
    
    this.getFileEntry(folderName, fileName, true, getFileEntrySuccess, onSaveError);
}

fileHelper.dataStrToByteArray = function(dataStr) {
    var data = new ArrayBuffer(dataStr.length / 2),
        dataView = new Int8Array(data);
    for (var i = 0; i < data.byteLength; i++) {
        dataView[i] = parseInt(dataStr.slice(i * 2, i * 2 + 2), 16);
    }
    return data;
}