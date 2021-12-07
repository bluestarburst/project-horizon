export default class webrtc {

    constructor(_name) {

        this.STUN = {
            urls: 'stun:stun.l.google.com:19302'
        };

        this.config = {
            iceServers: [this.STUN]
        };

        this.user = _name;

        this.peers = {};
        this.channels = {};
        this.serverConnection;

        this.server();
    }

    async server() {
        this.serverConnection = await this.connect();
        this.serverConnection.onmessage = message => {
            const data = JSON.parse(message.data);
            switch (data.type) {
                case "connect":
                    break;
                case "login":
                    this.onConnect();
                    this.users(data);
                    break
                case "updateUsers":
                    this.updateUsers(data);
                    break;
                case "offer":
                    this.onOffer(data);
                    break;
                case "answer":
                    this.onAnswer(data);
                    break;
                case "candidate":
                    this.onCandidate(data);
                    break;
                case "error":
                    this.onError(data);
                    break;
                case "leave":
                    //this.onLeave(data);
                    this.attemptDis(data.user.userName);
                    break;
                default:
                    break;
            }
        };
        this.send({
            type: "login",
            name: this.user
        })
    }

    async onLeave(data) {
        delete this.peers[data];
        delete this.channels[data];
    }

    async connect() {
        return new Promise(function (resolve, reject) {
            var server = new WebSocket("wss://websocket.bryanthargreave.repl.co/");
            server.onopen = function () {
                resolve(server);
            };
            server.onerror = function (err) {
                reject(err);
            };
        });
    }

    async offerToAll() {
        Object.keys(this.peers).forEach(async element => {
            const offer = await this.peers[element].createOffer();
            await this.peers[element].setLocalDescription(offer);
            this.send({ type: "offer", offer: offer, name: element });
        });
    }

    async onAnswer({ answer, sender }) {
        if (this.peers[sender].connectionState == "stable")
            return;

        console.log(`Got an answer from ${sender}`);
        this.log("Got an answer from " + sender);
        this.peers[sender].setRemoteDescription(new RTCSessionDescription(answer));

        console.log(this.channels);
        console.log(this.peers);
    }

    async onOffer({ offer, name }) {
        if (this.peers[name].connectionState == "stable")
            return;

        console.log(`Got an offer from ${name}`);
        this.log(`Got an offer from ${name}`);

        this.peers[name].setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peers[name].createAnswer();
        await this.peers[name].setLocalDescription(answer);
        this.send({ type: "answer", answer: this.peers[name].localDescription, name, sender: this.user })

        console.log(this.peers);
    }

    async onCandidate(data) {
        //console.log(data);
        this.peers[data.sender].addIceCandidate(data.candidate);
    }

    users(data) {
        if (!data.success) {
            return;
        }
        data.users.forEach(element => {
            if (!this.peers[element.userName]) {
                this.createPeer(element.userName);
            }
        });
        this.offerToAll();
    }

    updateUsers(data) {
        if (!this.peers[data.user.userName]) {
            this.createPeer(data.user.userName);
        }
    }

    async createPeer(_name) {
        var peerConnection = new RTCPeerConnection(this.config);

        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                this.send({
                    name: _name,
                    sender: this.user,
                    type: "candidate",
                    candidate
                });
            }
        };

        this.channels[_name] = peerConnection.createDataChannel("data");

        const self = this;

        peerConnection.ondatachannel = function (ev) {
            console.log('Data channel is created!');
            self.log("Created data channel for user: " + _name);
            ev.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
            ev.channel.onmessage = function (event) {
                var data = JSON.parse(event.data);
                //console.log(data);
                switch (data.type) {
                    case "message":
                        self.onMessage(data);
                    case "player":
                        self.onPlayerUpdate(data);
                    default:
                        break;
                }
            }
        };

        peerConnection.onconnectionstatechange = function (event) {
            switch (peerConnection.connectionState) {
                case "connected":
                    console.log(`The connection with ${_name} was successful!`);
                    //self.log(`The connection with ${_name} was successful!`);
                    self.onConn(_name);
                    break;
                case "connecting":
                    //setTimeout(self.reconnect(_name), 10000 );
                    break;
                case "disconnected":
                case "failed":
                    console.log(`The connection with ${_name} failed or disconnected`);
                    peerConnection.restartIce();
                    //self.reOffer(_name);
                    break;
                case "closed":
                    console.log(`The connection with ${_name} was closed`);
                    break;
            }
        }

        /*
        peerConnection.onnegotiationneeded = async ev => {
            //peerConnection = await self.createPeer(_name);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            self.send({ type: "offer", offer: offer, name: _name });
        };*/

        this.peers[_name] = peerConnection;
        return true;
    }

    reconnect(_name) {
        console.log("reconnecting...");
        if (this.peers[_name].connectionState == "connecting") {
            this.peers[_name].restartIce();
        }
    }

    async reOffer(_name) {
        if (this.peers[_name].localDescription.type == "offer") {
            return;
        }
        await this.createPeer(_name);
        const offer = await this.peers[_name].createOffer();
        await this.peers[_name].setLocalDescription(offer);
        this.send({ type: "offer", offer: offer, name: _name });
    }

    attemptDis(_name) {
        this.onDis(_name);
        this.onLeave(_name);
    }

    send(data) {
        this.serverConnection.send(JSON.stringify(data));
    }

    onError({ message }) {
        console.log(message);
    }

    sendToAll(type, message) {
        Object.keys(this.channels).forEach((key) => {
            if (this.channels[key].readyState == 'open') {
                this.channels[key].send(JSON.stringify({ type: type, user: this.user, message: message }));
            }
        })
    }

}