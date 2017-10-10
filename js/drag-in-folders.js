if (typeof(nw) === 'object') {

    var fs = require('fs');
    var modal = document.getElementById('drag-in-folders');

    // send files to the not already running app
    // ("Open With" or drag-n-drop)
    if (process.argv.length) {
        var files = process.argv.map(function (path) {
            return {
                path: path
            };
        });

        onFilesDrop(files);
    }

    // send files to the already running app
    // ("Open With" or drag-n-drop)
    nw.App.on('open', function (path) {
        onFilesDrop([{
            path: path
        }]);
    });

    function showModal () {
        modal.style.visibility = 'visible';
    }
    function hideModal () {
        modal.style.visibility = 'hidden';
    }

    function allowDrag (evt) {
        evt.dataTransfer.dropEffect = 'copy';
        evt.preventDefault();
    }

    function handleDrop (evt) {
        evt.preventDefault();
        var files = [].slice.call(evt.dataTransfer.files);
        onFilesDrop(files);
        hideModal();
    }

    window.addEventListener('dragenter', function () {
        showModal();
    });
    // modal.addEventListener('dragenter', allowDrag);
    window.addEventListener('dragover', allowDrag);
    modal.addEventListener('dragleave', function () {
        hideModal();
    });
    modal.addEventListener('drop', handleDrop);

    /**
     * Actions to perform when new files are imported
     * @param  {array} files A list of files
     */
    function onFilesDrop (files) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i].path;
            var isFolder = fs.lstatSync(file).isDirectory();
            if (!isFolder && !file.endsWith('.exe') && !file.endsWith('nw')) {
                var contents = fs.readFileSync(file);
                app.packagejson = contents;
                app.validatePackage();
            }
        }

        process.argv = [];
    }
}
