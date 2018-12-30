const path = require('path');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let win;

app.on('ready', function() {
    mainScreen = electron.screen.getPrimaryDisplay().size;
    win = new BrowserWindow( { width: mainScreen.width, height: mainScreen.height });
    win.loadURL('file://' + path.join(__dirname, './map/index.html'));
    win.webContents.openDevTools({
        detach: true
    });
    win.on('closed', function() {
        win = null;
    })
});

app.on('activate', function() {
    if(win === null) {
        createWindow();
    }
});

app.on('window-all-closed', function() {
    if(process.platform != 'darwin')
        app.quit();
});