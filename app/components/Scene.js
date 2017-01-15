import React from 'react';
import React3 from 'react-three-renderer';
import * as THREE from 'three';

const cameraPosition = new THREE.Vector3(0, 0, 5);
const cubeRotation = new THREE.Euler();

const vertexShader = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

function createScene(glsl: string) {
    if (!glsl) {
        return null;
    }

    const fragmentShader = glsl
        .split(/\n/)
        .filter(line =>
            !line.startsWith('#') &&
            !line.startsWith('precision')
        )
        .join('\n');

    return (
        <mesh rotation={cubeRotation}>
            <boxGeometry width={1} height={1} depth={1} />
            <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} />
        </mesh>
    );
}

type Props = {
    width: number,
    height: number,
    glsl: string,
};

export default (props: Props) => (
    <React3
        mainCamera="camera"
        width={props.width}
        height={props.height}>
        <scene>
            <perspectiveCamera
                name="camera"
                aspect={props.width / props.height}
                fov={75} near={0.1} far={1000}
                position={cameraPosition} />
            {createScene(props.glsl)}
        </scene>
    </React3>
);
