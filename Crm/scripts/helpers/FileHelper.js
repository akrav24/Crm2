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

fileHelper.fileDataWrite = function(dataStr, folderName, fileName, onSuccess, onError) {
    var dataSize = "";
    if (dataStr.length < (1024 * 2)) {
        dataSize = (dataStr.length / 2).toFixed(0) + "B";
    } else {
        dataSize = (dataStr.length / 2 / 1024).toFixed(0) + "K";
    }
    log("fileHelper.fileDataWrite('" + dataStr.substring(0, 10) + "...(" + dataSize + ")', '" + folderName + "', '" + fileName + "')");
    
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    var onSaveError = function(writer) {if (onError != undefined) {onError("error.code=" + writer.error.code + ", file='" + writer.localURL + "'");}}
    
    var getFileWriterSuccess = function(writer) {
        //log("..fileHelper.fileDataWrite getFileWriterSuccess '" + writer.localURL + "'");
        writer.onwrite = function(e) {
            log("....fileHelper.fileDataWrite truncate done '" + writer.localURL + "'");
            writer.onwrite = function(e) {
                log("..fileHelper.fileDataWrite succsess '" + this.localURL + "'");
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
        //log("..fileHelper.fileDataWrite getFileEntrySuccess '" + fileEntry.fullPath + "'");
        fileEntry.createWriter(getFileWriterSuccess, onSaveError);
    }
    
    this.getFileEntry(folderName, fileName, true, getFileEntrySuccess, onErrors);
}

fileHelper.fileDataRead = function(fileEntry, onSuccess, onError) {
    log("fileHelper.fileDataRead('" + fileEntry.fullPath + "')");
    
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    var onLoadError = function(reader) {if (onError != undefined) {onError("error.code=" + reader.error.code + ", file='" + reader.localURL + "'");}}
    
    var getFileSuccess = function(file) {
        //log("..fileHelper.fileDataRead getFileEntrySuccess '" + file.fullPath + "'");
        var reader = new FileReader();
        reader.onload = function(e) {
            log("..fileHelper.fileDataRead succsess '" + this._localURL + "'");
            if (onSuccess != undefined) {onSuccess(fileHelper.dataByteArrayToStr(e.target.result));}
        }
        reader.onerror = function(e) {
            onLoadError(e.target);
        };
        reader.readAsArrayBuffer(file);
    }
    
    fileEntry.file(getFileSuccess, 
        function(error) {onErrors("error.code=" + writer.error.code);}
    );
}

fileHelper.fileDataReadByName = function(folderName, fileName, onSuccess, onError) {
    log("fileHelper.fileDataReadByName('" + folderName + "', '" + fileName + "')");
    
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    
    var getFileEntrySuccess = function(fileEntry) {
        //log("..fileHelper.fileDataRead getFileEntrySuccess '" + fileEntry.fullPath + "'");
        fileHelper.fileDataRead(fileEntry, onSuccess, onError);
    }
    
    this.getFileEntry(folderName, fileName, false, getFileEntrySuccess, onErrors);
}

fileHelper.dataStrToByteArray = function(dataStr) {
    var dataSize = "";
    if (dataStr.length < (1024 * 2)) {
        dataSize = (dataStr.length / 2).toFixed(0) + "B";
    } else {
        dataSize = (dataStr.length / 2 / 1024).toFixed(0) + "K";
    }
    log("fileHelper.dataStrToByteArray('" + dataStr.substring(0, 10) + "...(" + dataSize + ")')");
    
    var data = new ArrayBuffer(dataStr.length / 2),
        dataView = new Int8Array(data);
    for (var i = 0; i < data.byteLength; i++) {
        dataView[i] = parseInt(dataStr.slice(i * 2, i * 2 + 2), 16);
    }
    log("..fileHelper.dataStrToByteArray('" + dataStr.substring(0, 10) + "...(" + dataSize + ")') done");
    return data;
}

fileHelper.dataByteArrayToStr = function(data) {
    var dataSize = "";
    if (data.length < (1024)) {
        dataSize = (data.length).toFixed(0) + "B";
    } else {
        dataSize = (data.length / 1024).toFixed(0) + "K";
    }
    log("fileHelper.dataByteArrayToStr('...(" + dataSize + ")')");
    
    var dataView = new Uint8Array(data);
    var dataStr = "";
    for (var i = 0; i < dataView.length; i++) {
        dataStr += dataView[i].toString(16);
    }
    log("..fileHelper.dataByteArrayToStr('" + dataStr.substring(0, 10) + "...(" + dataSize + ")') done");
    return dataStr;
}
