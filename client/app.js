
import React from 'react'
import { render } from 'react-dom'
import Scene from './scene'

var name = "";
var conn;
document.getElementById("container").style.display = 'none';

document.getElementById("conn").addEventListener("click", (e) => {
    if (document.getElementById("name").value != "") {
        connect(document.getElementById("name").value);
        document.getElementById("init").style.display = 'none';
        document.getElementById("container").style.display = 'block';
    }
});

document.getElementById("send").addEventListener("click", (e) => {
    message();
});

document.getElementById('message').onkeypress = function (e) {
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter') {
        message();
    }
}

function message() {
    if (document.getElementById("message").value != "") {
        conn.sendToAll("message", document.getElementById("message").value);
        addText(conn.user, document.getElementById("message").value);
        document.getElementById("message").value = "";
    }
}

function addText(sender, message) {
    document.getElementById("chat").innerHTML += "<br> " + sender + ": " + message;
}



document.getElementById('quit').addEventListener('click', (e) => {
    window.closeCurrentWindow();
});

document.getElementById('minimize').addEventListener('click', (e) => {
    window.minimize();
});

document.getElementById('maximize').addEventListener('click', (e) => {
    window.minMaxWindow();
});


function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}

window.onload = function () {
    if (isElectron()) {
        console.log("electron");
        document.getElementById("nav").style.display = 'block';
        document.getElementById("main").style.height = 'calc(98% - 30px)';
        document.getElementById("main").style.paddingTop = '30px';
        document.getElementById("main").style.top = '30px';
    }
    else {
        document.getElementById("nav").style.display = 'none';
        document.getElementById("main").style.height = '100%';
        document.getElementById("main").style.paddingTop = '0';
        document.getElementById("main").style.top = '0';
    }
}

document.getElementById('root').requestPointerLock();



render(
    <>
        <Scene />
    </>, document.getElementById("root"));

