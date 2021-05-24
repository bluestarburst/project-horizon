import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import webrtc from './webrtc'
import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'
import * as THREE from "three"
import { Vector3 } from 'three';

import model from './models/map.glb'
import renderModel from './modelRenderer'
//import Cube from './cube'

import 'bootstrap/dist/css/bootstrap.min.css';
import { Physics, useBox, usePlane } from '@react-three/cannon';

/*
import { AxesHelper } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { PerspectiveCamera } from '@react-three/drei'
*/

const fps = 60;

let keys = {};
let dir = [0, 0];
let pos = { x: 0, y: 0, z: 0 };
var camrot = new THREE.Euler(0, 0, 0, 'XYZ');
var axis = new THREE.Vector3(0, 0, 0);
var coll = new THREE.Raycaster(new THREE.Vector3(pos.x, pos.y, pos.z), new THREE.Vector3(pos.x, pos.y, pos.z));

var ground = [];
var meshes = [];
var player = null;

var maxRad = 4;

function Camera(props) {
    const ref = useRef()
    const col = useRef()
    const { setDefaultCamera } = useThree()
    // Make the camera known to the system
    useEffect(() => void setDefaultCamera(ref.current), [])

    var stopped = false;

    // Update it every frame
    useFrame(() => {

        ref.current.updateMatrixWorld();

        ref.current.position.set(pos.x, pos.y, pos.z);

        ref.current.getWorldDirection(axis);

        if (!stopped) {
            ref.current.rotateX(-dir[1]);
            ref.current.rotateY(-dir[0]);
        }

        ref.current.translateZ(maxRad);

        ref.current.lookAt(pos);

        ref.current.lookAt(pos.x, pos.y, pos.z);
        //console.log(ref.current.rotation);

        camrot = ref.current.rotation;

        var directionVector = new THREE.Vector3(pos.x, pos.y - 0.5, pos.z).sub(ref.current.position);
        coll.set(ref.current.position, directionVector.clone().normalize());

        var collisionResults = coll.intersectObjects(meshes);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            var distance = 0;
            for (var i = 0; i < collisionResults.length; i++) {
                //console.log(collisionResults[i]);
                if (collisionResults[i].object.name == 'local') {
                    break;
                }
                distance = collisionResults[i].distance + 0.01;
            }
            ref.current.translateZ(-distance);
        }
    })
    return <>
        <perspectiveCamera ref={ref} {...props} />
    </>
}

function Model(props) {
    // This reference will give us direct access to the mesh
    const mesh = useRef()

    return (
        <mesh
            {...props}
            ref={mesh}
            onPointerOver={(event) => setHover(true)}
            onPointerOut={(event) => setHover(false)}>
            <boxBufferGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={props.color} />
        </mesh>
    )
}

var players = {};
var update = false;

function RemotePlayers(props) {

    const [updater, setUpdate] = useState(false);
    var children = Object.values(players).map((element) => element.obj);

    useEffect(() => {
        console.log("updating!");
        setUpdate(false);
    }, [updater]);

    useFrame(() => {
        if (update) {
            console.log("updates");
            setUpdate(true);
            update = false;
        }
    })

    return (
        <group>
            {children}
        </group>
    );
}

function Player(props) {

    const mesh = useRef();

    useFrame(() => {
        if (players[props.name]) {
            mesh.current.position.set(players[props.name].pos.x, players[props.name].pos.y, players[props.name].pos.z);
            mesh.current.rotation.set(players[props.name].rot.x, players[props.name].rot.y, players[props.name].rot.z);
        }
    })

    return (<mesh
        {...props}
        ref={mesh}>
        <boxBufferGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color={'blue'} />
    </mesh>);
}

var initpos = JSON.parse(getCookie('session'));




function LocalPlayer(props) {

    const [clock] = React.useState(new THREE.Clock());
    const [play, api] = useBox(() => ({ mass: 1, scale:[1,2,1], ...props }))

    var loaded = false;

    useFrame(() => {

        if (!loaded && meshes.length > 0) {
            meshes.push(play.current);
            loaded = true;
        }

        if (initpos) {
            play.current.position.set(initpos.pos.x, initpos.pos.y, initpos.pos.z);
            initpos = null;
        }

        if (keys['w']) {
            api.position.set(play.current.position.x,play.current.position.y,play.current.position.z-1);
        }
        if (keys['s']) {
            api.position.set(play.current.position.x,play.current.position.y,play.current.position.z+1);
        }
        if (keys['a']) {
            api.position.set(play.current.position.x-1,play.current.position.y,play.current.position.z);
        }
        if (keys['d']) {
            api.position.set(play.current.position.x+1,play.current.position.y,play.current.position.z);
        }

        //api.position.set(play.current.position.x+1,play.current.position.y,play.current.position.z);

        pos.x = play.current.position.x;
        pos.y = play.current.position.y;
        pos.z = play.current.position.z;

        //play.current.rotation = rot;
        if (conn) {
            conn.sendToAll("player", [play.current.position.x, play.current.position.y, play.current.position.z, play.current.rotation.x, play.current.rotation.y, play.current.rotation.z]);
            saveLocal(play.current.position);
        }
    })

    return (

        <mesh
            {...props}
            ref={play}
            name='local'>
            <boxBufferGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={'orange'} />
            <axesHelper scale={[3, 3, 3]} />
        </mesh>

    )
}

function Log(props) {

    const style = {
        width: '100%',
        color: "white",
        textAlign: "right"
    }

    return (
        <div style={style} className={"slideIn"}>
            <p> {props.message} </p>
        </div>
    )
}

var updateLog = function () {
    console.log("hello");
};

function logEvent(data) {
    let index = logs.length;
    logs.push(<Log message={data} key={index}> </Log>);
    updateLog(true);
    setTimeout(function () {
        delete logs[index];
        updateLog(true);
    }, 3000);

}

var logs = [];

function Logs(props) {

    const [update, addLog] = useState(false);

    useEffect(() => {
        updateLog = addLog;
        addLog(false);
    }, [update]);

    const style = {
        width: "30vw",
        height: "100vh",
        position: "absolute",
        top: "1vh",
        left: '70vw',
        'zIndex': 10000
    }

    return (
        <>
            <br />
            <div style={style}>
                {logs}
            </div>
        </>
    );
}

function Map(props) {

    const obj = useRef();

    const map = new renderModel(model, [-1, 0, 0], [0, 0, 0], [0.45, 0.45, 0.45]);

    meshes = map.getMesh();
    ground = map.getGround();


    //setMap(new renderModel(model, [-1, 0, 0], [0,0,0], [0.5,0.5,0.5]));

    return (
        <group
            ref={obj}
        >
            {map.getModel()}
        </group >
    );
}

function Plane(props) {
    const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
    return (
      <mesh ref={ref}>
        <planeBufferGeometry args={[100, 100]} />
      </mesh>
    )
  }
  

function Scene(props) {

    const style = {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#454545",
    }

    const overlay = {
        backgroundColor: "rgba(0,0,0,0.2)",
        position: "absolute",
        width: "100vw",
        height: "100vh",
        left: 0,
        top: 0,
        "zIndex": 2,
        display: "none"
    }


    return (<>
        <Server />
        <div id={"paused"} style={overlay} onClick={clicks}> </div>
        <input id="focus" />
        <Logs />
        <Canvas style={style} id="canvas" shadowMap>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />

            <directionalLight
                intensity={0.5}
                castShadow
                shadow-mapSize-height={512}
                shadow-mapSize-width={512}
            />

            <RemotePlayers />
            <Camera rotation={[-Math.PI / 6, 0, 0]} />

            <Physics>
                <LocalPlayer castShadow  />
                <Plane position={[0,-20,0]} />
                <Suspense fallback={<Loading position={[0, 0, 0]} />}>
                    <Map position={[0, 0, 0]} />
                </Suspense>
            </Physics>


        </Canvas>
    </>);
}

//<Model tag={"Ground"} position={[0, -1, 0]} scale={[100, 1, 100]} color={'gray'} />
//<Model position={[10, 0, 0]} scale={[0.25, 0.25, 0.25]} color={'white'} />

function Loading(props) {

    return (
        <>
        </>
    )
}

var name = "";
var conn;


function connect(_name) {
    console.log("Connecting");
    conn = new webrtc(_name);
    document.getElementById("name").disabled = true;
    document.getElementById("conn").disabled = true;

    conn.onConnect = function () {
        console.log("Connected!");
        logEvent("Connected to Server!");
        document.getElementById("init").style.display = 'none';
    }
    conn.onMessage = function (data) {
        //addText(data.user, data.message);
    }
    conn.onPlayerUpdate = function (data) {
        if (players[data.user]) {
            players[data.user].pos.set(data.message[0], data.message[1], data.message[2]);
            players[data.user].rot.set(data.message[3], data.message[4], data.message[5]);
        }
    }
    conn.onConn = function (data) {
        console.log("Created Player");
        players[data] = {
            obj: <Player position={[0, 0, 0]} key={data} name={data} />,
            pos: new THREE.Vector3(0, 0, 0),
            rot: new THREE.Euler(0, 0, 0, 'XYZ')
        };
        update = true;
        console.log(players);
        //console.log(document.getElementById("canvas"));
        //document.getElementById("canvas").innerHTML += players[data];
    }
    conn.log = function (data) {
        logEvent(data);
    }

    conn.onDis = function (data) {
        delete players[data];
        update = true;
    }
}

function attemptConnection(e) {
    connect(name);
}

function Server() {

    var ui = {
        position: 'absolute',
        top: '5%',
        left: "5%",
        border: "2px solid transparent",
        'borderRadius': "25px",
        'zIndex': 5
    }

    return (<div style={ui}>
        <div id="init">
            <InputGroup className="mb-3">
                <FormControl id="name"
                    placeholder="Username"
                    onChange={(e) => {
                        name = e.target.value;
                    }}
                    aria-label="Recipient's username"
                    aria-describedby="basic-addon2"
                />
                <InputGroup.Append>
                    <Button onClick={attemptConnection} id="conn" variant="outline-secondary">Connect!</Button>
                </InputGroup.Append>
            </InputGroup>
        </div>
    </div>);
}

var paused = false;

document.addEventListener("keydown", event => {

    if (!paused)
        keys[event.key] = true;

    if (event.key == 'p' && conn) {
        conn = null;
        players = {};
        console.log("disconnected");
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.getElementById("init").style.display = 'block';
        document.getElementById("name").disabled = false;
        document.getElementById("conn").disabled = false;
    }

    if (event.key == 'Tab') {
        event.preventDefault();
        if (!paused) {
            document.exitPointerLock();
            document.getElementById('paused').style.display = 'block';
            paused = true;
        } else {
            document.getElementById('root').requestPointerLock();
            document.getElementById('paused').style.display = 'none';
            paused = false;
        }
    }
    //console.log(paused);
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

var timeout;
const sensitivity = 1000;

function clicks(e) {
    if (paused) {
        paused = false;
        document.getElementById('paused').style.display = 'none'
        document.getElementById('root').requestPointerLock();
    }
}

document.addEventListener("mousemove", event => {
    if (paused) {
        return;
    }
    dir[0] = event.movementX / sensitivity;
    dir[1] = event.movementY / sensitivity;
    clearTimeout(timeout);
    timeout = setTimeout(function () { dir[0] = 0; dir[1] = 0; }, 100);
});

function saveLocal(pos) {
    var data = {
        pos: pos,
        name: name
    }
    setCookie('session', JSON.stringify(data), 10);
}

function setCookie(cname, cvalue, exsec) {
    var d = new Date();
    d.setTime(d.getTime() + (exsec * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

if (initpos) {
    name = initpos.name;
    connect(initpos.name);
}

var scrollableElement = document.body; //document.getElementById('scrollableElement');

scrollableElement.addEventListener('wheel', checkScrollDirection);

function checkScrollDirection(event) {
    if (!checkScrollDirectionIsUp(event)) {
        maxRad += 0.5;
    } else if (maxRad > 1) {
        maxRad -= 0.5;
    }

}

function checkScrollDirectionIsUp(event) {
    if (event.wheelDelta) {
        return event.wheelDelta > 0;
    }
    return event.deltaY < 0;
}

export { Scene as default, meshes };