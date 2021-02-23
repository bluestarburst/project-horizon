const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        },
        frame: true
    });

    // and load the index.html of the app.
    win.loadFile(path.join(__dirname, "index.html"));
}

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.on('ready', createWindow);