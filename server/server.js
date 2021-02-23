const express = require("express");
const WebSocket = require("ws");
const fs = require('fs');
const http = require("http");
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const app = express();
const capp = express();
var path = require('path');

const serverConfig = {
  key: fs.readFileSync(__dirname + '/key.pem'),
  cert: fs.readFileSync(__dirname + '/cert.pem'),
};

const HTTPS_PORT = 443;

const port = process.env.PORT || 26950;

//initialize a http server
const server = https.createServer(serverConfig, app);

capp.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'..') + '/dist/index.html');
});

capp.use(express.static('dist'))

const httpsServer = https.createServer(serverConfig, capp);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);


//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

let users = {};

const sendTo = (connection, message) => {
  connection.send(JSON.stringify(message));
};

const sendToAll = (clients, type, { id, name: userName }) => {
  Object.values(clients).forEach(client => {
    if (client.name !== userName) {
      client.send(
        JSON.stringify({
          type,
          user: { id, userName }
        })
      );
    }
  });
};

wss.on("connection", ws => {
  ws.on("message", msg => {
    let data;
    //accept only JSON messages
    console.log(msg);
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }
    const { type, name, offer, answer, candidate, sender } = data;
    switch (type) {
      //when a user tries to login
      case "login":
        //Check if username is available
        if (users[name]) {
          sendTo(ws, {
            type: "login",
            success: false,
            message: "Username is unavailable"
          });
        } else {
          const id = uuidv4();
          const loggedIn = Object.values(
            users
          ).map(({ id, name: userName }) => ({ id, userName }));
          users[name] = ws;
          ws.name = name;
          ws.id = id;
          sendTo(ws, {
            type: "login",
            success: true,
            users: loggedIn
          });
          sendToAll(users, "updateUsers", ws);
        }
        break;
      case "offer":
        //Check if user to send offer to exists
        const offerRecipient = users[name];
        if (!!offerRecipient) {
          sendTo(offerRecipient, {
            type: "offer",
            offer,
            name: ws.name
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `User ${name} does not exist!`
          });
        }
        break;
      case "answer":
        //Check if user to send answer to exists
        const answerRecipient = users[name];
        if (!!answerRecipient) {
          sendTo(answerRecipient, {
            type: "answer",
            sender: sender,
            answer,
          });
        } else {
          sendTo(ws, {
            type: "error",
            message: `User ${name} or ${sender} does not exist!`
          });
        }
        break;
      case "candidate":
        const candidateRecipient = users[name];
        if (!!candidateRecipient) {
          sendTo(candidateRecipient, {
            type: "candidate",
            sender: sender,
            candidate: candidate
          });
        }
        break;
      case "leave":
        sendToAll(users, "leave", ws);
        break;
      default:
        sendTo(ws, {
          type: "error",
          message: "Command not found: " + type
        });
        break;
    }
  });
  ws.on("close", function() {
    delete users[ws.name];
    sendToAll(users, "leave", ws);
  });
  //send immediatly a feedback to the incoming connection
  ws.send(
    JSON.stringify({
      type: "connect",
      message: "Woohoo! You're connected!"
    })
  );
});

//start our server
server.listen(port, () => {
  console.log(`Signalling Server running on port: ${port}`);
});