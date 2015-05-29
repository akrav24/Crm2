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
    var onResolveError = function(error) {if (onError != undefined) {onError(that.fileErrMsg(error) + ", folderName=" + folderName + ", fileName=" + fileName);}}
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    that.getFilesystem(
        function(fileSystem) {
            that.getFolder(fileSystem, folderName,
                function(folder) {
                    //var filePath = folder.toURL() + "/" + fileName;
                    //window.resolveLocalFileSystemURL(filePath, onResolveSuccess, onResolveError)
                    // TODO: В симуляторе, если fileName на кириллице, то возникает ошибка code=5 (ENCODING_ERR)
                    // TODO: На Lenovo A5500-F все Ок
                    // TODO: Проверить на Samsung
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
    var that = this;
    var onResolveSuccess = function(fileEntry) {
        var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
        var onCopySuccess = function (fileEntry) {if (onSuccess != undefined) {onSuccess(fileEntry);}}
        var onCopyError = function(error) {if (onError != undefined) {onError(that.fileErrMsg(error));}}
        
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
    
    var onResolveError = function(error) {if (onError != undefined) {onError(that.fileErrMsg(error));}}
    
    window.resolveLocalFileSystemURL(srcFullName, onResolveSuccess, onResolveError);
}

fileHelper.fileErrMsg = function(fileError) {
    var errMsg = "code=" + fileError.code;
    switch (fileError.code) {
        case FileError.NOT_FOUND_ERR: errMsg += " (NOT_FOUND_ERR)"; break;
        case FileError.SECURITY_ERR: errMsg += " (SECURITY_ERR)"; break;
        case FileError.ABORT_ERR: errMsg += " (ABORT_ERR)"; break;
        case FileError.NOT_READABLE_ERR: errMsg += " (NOT_READABLE_ERR)"; break;
        case FileError.ENCODING_ERR: errMsg += " (ENCODING_ERR)"; break;
        case FileError.NO_MODIFICATION_ALLOWED_ERR: errMsg += " (NO_MODIFICATION_ALLOWED_ERR)"; break;
        case FileError.INVALID_STATE_ERR: errMsg += " (INVALID_STATE_ERR)"; break;
        case FileError.SYNTAX_ERR: errMsg += " (SYNTAX_ERR)"; break;
        case FileError.INVALID_MODIFICATION_ERR: errMsg += " (INVALID_MODIFICATION_ERR)"; break;
        case FileError.QUOTA_EXCEEDED_ERR: errMsg += " (QUOTA_EXCEEDED_ERR)"; break;
        case FileError.TYPE_MISMATCH_ERR: errMsg += " (TYPE_MISMATCH_ERR)"; break;
        case FileError.PATH_EXISTS_ERR: errMsg += " (PATH_EXISTS_ERR)"; break;
    }
    return errMsg;
}

fileHelper.fileDataWrite = function(dataStr, folderName, fileName, onSuccess, onError) {
    var that = this;
    var dataSize = "";
    if (dataStr.length < (1024 * 2)) {
        dataSize = (dataStr.length / 2).toFixed(0) + "B";
    } else {
        dataSize = (dataStr.length / 2 / 1024).toFixed(0) + "K";
    }
    log("fileHelper.fileDataWrite('" + dataStr.substring(0, 10) + "...(" + dataSize + ")', '" + folderName + "', '" + fileName + "')");
    
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    var onSaveError = function(writer) {if (onError != undefined) {onError(that.fileErrMsg(writer.error) + ", file='" + writer.localURL + "'");}}
    
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
    
    var that = this;
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    var onLoadError = function(reader) {if (onError != undefined) {onError(that.fileErrMsg(reader.error) + ", file='" + reader.localURL + "'");}}
    
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
        function(error) {onErrors(that.fileErrMsg(error));}
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
    var dataView = new Uint8Array(data);
    log("fileHelper.dataByteArrayToStr('...(" + (dataView.length < 1024 ? (dataView.length).toFixed(0) + "B" : dataSize = (dataView.length / 1024).toFixed(0) + "K") + ")')");
    
    var dataStr = "";
    for (var i = 0; i < dataView.length; i++) {
        dataStr += (dataView[i].toString(16).length < 2 ? "0" : "") + dataView[i].toString(16);
    }
    log("..fileHelper.dataByteArrayToStr('" + dataStr.substring(0, 10) + "...(" + dataSize + ")') done");
    return dataStr;
}
