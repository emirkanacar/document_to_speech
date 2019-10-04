const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const shell = require('electron').shell;
const detectFileType = require('detect-file-type');
var fs = require('fs');
var textract = require('textract');
var path = require('path');
var gtts = require('node-gtts')('tr');

const uploadButton = document.getElementById('pdfUpload');

uploadButton.addEventListener('click', (event) => {
   ipc.send('open-file-dialog-for-file');
});

ipc.on('selected-file', (event, pathN) => {
    console.log('path: ' + pathN);

    let filePath = "" + pathN;
    let fileName = path.basename(pathN, path.extname(pathN));

    console.log(fileName);

    detectFileType.fromFile(filePath, (err, res) => {
        if(err) throw (err);

        if(res.ext === 'pdf')
        {
            console.log("file is pdf");

            textract.fromFileWithPath(filePath, function( error, text ) {
                if(error) throw (error);

                let userDataFile = remote.app.getPath('userData') + '/' + fileName + '.txt';
                let convertedText = "" + text;

                console.log(userDataFile);

                fs.writeFile(userDataFile, convertedText, (error) => {
                   if (error) throw (error);

                   let convertedFile = remote.app.getPath('userData') + '/' + fileName + '.wav';

                   gtts.save(convertedFile, convertedText, () => {
                       console.log('save done');
                       shell.openItem(convertedFile)
                   })

                });
            })

        }else {
            console.log("file is not pdf")
        }

    });

});