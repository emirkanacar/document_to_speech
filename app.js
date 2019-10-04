const {app, BrowserWindow, dialog} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const url = require('url');
const os = require('os');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
      height: 450,
      webPreferences: { nodeIntegration: true }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.setMenu(null);
  // development only
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    app.quit();
  });

  // file upload event render
  ipc.on('open-file-dialog-for-file', (event => {
      if(os.platform() == 'linux' || os.platform() == 'win32')
      {
          dialog.showOpenDialog({
              properties: ['openFile']
          }, (files) => {
              if(files)
              {
                event.sender.send('selected-file', files[0]);
              }
          })
      }else {
          dialog.showOpenDialog({
              properties: ['openFile', 'openDirectory']
          }, (files) => {
              if(files)
              {
                event.sender.send('selected-file', files[0]);
              }
          })
      }
  }));
});