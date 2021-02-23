
const { remote } = require('electron');

let currWindow = remote.BrowserWindow.getFocusedWindow();

window.closeCurrentWindow = function () {
  currWindow.close();
}

window.preload = function () {
  return true;
}

window.minMaxWindow = function () {
  if (currWindow.isMaximized()) {
    currWindow.restore();
  } else {
    currWindow.maximize();
  }
}

window.minimize = function () {
  currWindow.minimize();
}