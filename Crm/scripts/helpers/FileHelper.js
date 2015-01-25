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

fileHelper.planogramFileName = function(fileId) {
    return planogamFilePrefix + fileId.toString() + ".png";
}

fileHelper.planogramFolderName = function() {
    return rootFolderName/* + "\/files"*/;
}

