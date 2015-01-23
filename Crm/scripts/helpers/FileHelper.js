var fileHelper = {};

fileHelper.getFilesystem = function(onSuccess, onError) {
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
}

fileHelper.getFolder = function (fileSystem, folderName, onSuccess, onError) {
	fileSystem.root.getDirectory(folderName, {create: true, exclusive: false}, onSuccess, onError)
}
