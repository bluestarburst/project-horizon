import { useLoader } from 'react-three-fiber'
import React from 'react'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from 'three'
import { useBox, useConvexPolyhedron } from '@react-three/cannon';

export default class renderModel {

    constructor(path, position = [0, 0, 0], rotation = [0, 0, 0], scale = [0, 0, 0]) {
        this.loader = useLoader(GLTFLoader, path);
        this.original = this.loader.scene;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.ground = [];
        this.meshes = [];
        this.items = 0;
    }

    getModel() {
        return <group
            children={this.getChildren(this.original)}
            position={this.position}
            rotation={this.rotation}
            scale={this.scale}
        ></group>;
    }

    getChildren(current) {
        //console.log(current);
        if (!current) {
            return [];
        }
        let children = [];
        current.children.forEach(element => {
            //console.log(element.type);

            if (element.type == 'Mesh') {
                children.push(this.createMesh(element));
            }
            if (element.type == 'Object3D') {

                children.push(this.create3D(element));
            }

        });
        return children;
    }

    getGround() {
        //console.log(this.ground);
        return this.ground;
    }

    getMesh() {
        //console.log(this.meshes);
        return this.meshes;
    }

    createMesh(mesh) {
        //console.log(mesh);
        //let mesh_ = new THREE.Mesh(mesh.geometry, mesh.material);
        //mesh.material.side = THREE.DoubleSide;
        //console.log(mesh.material.side);

        var threeMesh = new THREE.Mesh(mesh.geometry, mesh.material);

        //const [ref] = useBox(() => ({ type: 'Kinematic', mass: 0, position: [mesh.position.x, mesh.position.y, mesh.position.z], args: [mesh.scale.x,mesh.scale.y,mesh.scale.z] }))

        if (mesh.name.includes("ground")) {
            this.ground.push(mesh);
        }
        this.meshes.push(mesh);

        console.log(mesh);

        return <Meshthing mesh={mesh}/>

        //return <primitive object={mesh} position={mesh.position} key={this.items++} ref={ref}> </primitive>;

        return <mesh
            name={mesh.name}
            position={mesh.position}
            key={this.items++}
        >
            <primitive object={mesh.geometry}> </primitive>
            <meshStandardMaterial color={'grey'} />
        </mesh>

        //return <mesh geometry={nodes.Cube_003_0.geometry} />
    }

    create3D(obj) {
        let obj_ = new THREE.Object3D();
        const [ref] = useBox(() => ({ mass: 0, position: [obj.position.x, obj.position.y, obj.position.z] }))
        return <primitive
            object={obj_}
            ref={ref}
            children={this.getChildren(obj)}
            position={[obj.position.x, obj.position.y, obj.position.z]}
            rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
            scale={[obj.scale.x, obj.scale.y, obj.scale.z]}
            key={this.items++}
        />;
    }
}

function Meshthing(props) {
    const mesh = props.mesh;
    const [ref] = useBox(() => ({ type:"Kinematic", mass: 10, position: [mesh.position.x,mesh.position.y,mesh.position.z], args: [mesh.scale.x, mesh.scale.y, mesh.scale.z] }))

    return <mesh ref={ref}>
        <boxBufferGeometry attach="geometry" args={[mesh.scale.x, mesh.scale.y, mesh.scale.z]}> </boxBufferGeometry>
    </mesh>
}