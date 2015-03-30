var fileHelper = {};

fileHelper.getFilesystem = function(onSuccess, onError) {
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
}

fileHelper.getFolder = function (fileSystem, folderName, onSuccess, onError) {
	fileSystem.root.getDirectory(folderName, {create: true, exclusive: false}, onSuccess, onError)
}

fileHelper.getFileEntry = function(folderName, fileName, onSuccess, onError) {
    var that = this;
    var onResolveSuccess = function(fileEntry) {if (onSuccess != undefined) {onSuccess(fileEntry);}}
    var onResolveError = function(error) {if (onError != undefined) {onError("error.code=" + error.code);}}
    var onErrors = function(errMsg) {if (onError != undefined) {onError(errMsg);}}
    that.getFilesystem(
        function(fileSystem) {
            that.getFolder(fileSystem, folderName,
                function(folder) {
                    var filePath = folder.toURL() + "/" + fileName;
                    window.resolveLocalFileSystemURL(filePath, onResolveSuccess, onResolveError)
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
