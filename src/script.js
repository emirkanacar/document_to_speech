const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const shell = require('electron').shell;
const detectFileType = require('detect-file-type');
var fs = require('fs');
const cpFile = require('cp-file');
var textract = require('textract');
var path = require('path');
var gtts = require('node-gtts')('tr');
var mammoth = require("mammoth");

const uploadButton = document.getElementById('pdfUpload');
const textsFolderButton = document.getElementById('openTexts');
const soundsFolderButton = document.getElementById('openSounds');
const githubButton = document.getElementById('openGithub');

uploadButton.addEventListener('click', (event) => {
   ipc.send('open-file-dialog-for-file');
});

textsFolderButton.addEventListener('click', (event) => {
    shell.openItem(remote.app.getPath('userData') + '/ConvertedFiles/Texts/');
});

soundsFolderButton.addEventListener('click', (event) => {
    shell.openItem(remote.app.getPath('userData') + '/ConvertedFiles/Sounds/');
});

githubButton.addEventListener('click', (event) => {
    shell.openExternal('https://github.com/emirkanacar/document_to_speech');
});

function checkSysFolders()
{

    let filesTexts = remote.app.getPath('userData') + '/ConvertedFiles/Texts/';
    let filesSounds = remote.app.getPath('userData') + '/ConvertedFiles/Sounds/';

    if (!fs.existsSync(filesTexts)){
        fs.promises.mkdir(filesTexts, {recursive: true}).then(r => console.log("ok converted texts created!"));
    }

    if (!fs.existsSync(filesSounds)){
        fs.promises.mkdir(filesSounds, {recursive: true}).then(r => console.log("ok converted sounds created!"));
    }

}


function saveAndPlay(userDataFile, text, filename)
{
    fs.writeFile(userDataFile, text, (error) => {
        if (error) throw (error);

        let convertedFile = remote.app.getPath('userData') + '/ConvertedFiles/Sounds/' + filename + '.wav';

        gtts.save(convertedFile, text, () => {
            console.log('save done');
            shell.openItem(convertedFile)
        })
    });
}

ipc.on('selected-file', (event, selectedFile) => {
    console.log('path: ' + selectedFile);
    checkSysFolders();

    let filePath = "" + selectedFile;
    let fileName = path.basename(selectedFile, path.extname(selectedFile));
    let splittedFileName = path.basename(selectedFile).split('.');

    console.log(fileName);


    if(splittedFileName[1] === 'pdf' || splittedFileName[1] === 'xlsx' || splittedFileName[1] === 'pptx')
    {
        textract.fromFileWithPath(filePath, function( error, text ) {
            if(error) throw (error);

            let userDataFile = remote.app.getPath('userData') + '/ConvertedFiles/Texts/' + fileName + '.txt';
            let convertedText = "" + text;

            console.log(userDataFile);
            saveAndPlay(userDataFile, convertedText, fileName);
        })

    }else if(splittedFileName[1] === 'txt')
    {
        let fileName = path.basename(selectedFile, path.extname(selectedFile));
        let userDataFile = remote.app.getPath('userData') + '/ConvertedFiles/Texts/' + fileName + '.txt';

        (async () => {
            await cpFile(filePath, userDataFile);
            console.log('File copied');
        })();

        textract.fromFileWithPath(userDataFile, function( error, text ) {
            if(error) throw (error);

            let convertedText = "" + text;
            let convertedFile = remote.app.getPath('userData') + '/ConvertedFiles/Sounds/' + fileName + '.wav';

            console.log(userDataFile);
            saveAndPlay(userDataFile, convertedText, fileName);
        })

    } else if(splittedFileName[1] === 'docx')
    {
        let userDataFile = remote.app.getPath('userData') + '/ConvertedFiles/Texts/'  + fileName + '.html';

        mammoth.convertToHtml({ path: filePath })
            .then((res) => {
                fs.writeFile(userDataFile, res.value, (error) => {
                    if (error) throw (error);
                    console.log('file converted(docx)');
                    textract.fromFileWithPath(userDataFile, (error, text) => {

                        let userDataFileTxt = remote.app.getPath('userData') + '/ConvertedFiles/Texts/' + fileName + '.txt';
                        let convertedText = "" + text;

                        saveAndPlay(userDataFileTxt, convertedText, fileName);
                    });
                });
            }).done();
    }
    else {
        console.log("file is not pdf")
    }
});