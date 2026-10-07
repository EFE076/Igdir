import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

// ======================================================
// BASIC SETUP
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa7cfe4);
scene.fog = new THREE.FogExp2(0xa7cfe4, 0.002);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    800
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const gameContainer = document.querySelector("#game");

if (!gameContainer) {
    throw new Error("Kan #game niet vinden in index.html");
}

gameContainer.appendChild(renderer.domElement);


// ======================================================
// LIGHTING
// ======================================================

const hemisphereLight = new THREE.HemisphereLight(
    0xeaf6ff,
    0x667052,
    2
);

scene.add(hemisphereLight);

const sun = new THREE.DirectionalLight(0xffefd2, 3);

sun.position.set(-80, 110, 50);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;

scene.add(sun);


// ======================================================
// MATERIAL HELPERS
// ======================================================

function material(color, roughness = 0.8, metalness = 0) {

    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness
    });

}


const collisionObjects = [];
const streetLights = [];
const walkers = [];


// ======================================================
// BOX HELPER
// ======================================================

function createBox(
    x,
    y,
    z,
    width,
    height,
    depth,
    color,
    collision = false,
    customMaterial = null
) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        customMaterial || material(color)
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = height > 1;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collision) {

        collisionObjects.push({

            minX: x - width / 2,
            maxX: x + width / 2,

            minZ: z - depth / 2,
            maxZ: z + depth / 2

        });

    }

    return mesh;

}


// ======================================================
// CYLINDER HELPER
// ======================================================

function createCylinder(
    x,
    y,
    z,
    radius,
    height,
    color,
    segments = 12
) {

    const mesh = new THREE.Mesh(

        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            segments
        ),

        material(color)

    );

    mesh.position.set(x, y, z);

    mesh.castShadow = true;

    scene.add(mesh);

    return mesh;

}


// ======================================================
// PROCEDURAL TEXTURES
// ======================================================

function createTexture(drawFunction, repeatX = 1, repeatY = 1) {

    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");

    drawFunction(ctx, 256);

    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.repeat.set(repeatX, repeatY);

    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;

}


const asphaltTexture = createTexture((ctx, size) => {

    ctx.fillStyle = "#555958";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1500; i++) {

        const gray = 60 + Math.random() * 50;

        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;

        ctx.fillRect(
            Math.random() * size,
            Math.random() * size,
            1,
            1
        );

    }

}, 4, 40);


const sidewalkTexture = createTexture((ctx, size) => {

    ctx.fillStyle = "#aaa69b";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "#7d7b73";
    ctx.lineWidth = 1;

    for (let y = 0; y < size; y += 20) {

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();

    }

    for (let x = 0; x < size; x += 30) {

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();

    }

}, 4, 40);


const grassTexture = createTexture((ctx, size) => {

    ctx.fillStyle = "#71865d";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1000; i++) {

        ctx.fillStyle =
            Math.random() > 0.5
                ? "#667c52"
                : "#81936a";

        ctx.fillRect(
            Math.random() * size,
            Math.random() * size,
            2,
            2
        );

    }

}, 20, 20);


// ======================================================
// GROUND
// ======================================================

const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(500, 500),

    new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 1
    })

);

ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;

ground.receiveShadow = true;

scene.add(ground);


// ======================================================
// ROAD FUNCTION
// ======================================================

function createRoad(
    x1,
    z1,
    x2,
    z2,
    width = 10
) {

    const dx = x2 - x1;
    const dz = z2 - z1;

    const length = Math.sqrt(dx * dx + dz * dz);

    const angle = Math.atan2(dx, dz);

    const road = new THREE.Mesh(

        new THREE.BoxGeometry(
            width,
            0.12,
            length
        ),

        new THREE.MeshStandardMaterial({
            map: asphaltTexture,
            roughness: 0.95
        })

    );

    road.position.set(
        (x1 + x2) / 2,
        0.06,
        (z1 + z2) / 2
    );

    road.rotation.y = angle;

    road.receiveShadow = true;

    scene.add(road);


    // SIDEWALKS

    for (const side of [-1, 1]) {

        const sidewalk = new THREE.Mesh(

            new THREE.BoxGeometry(
                2.5,
                0.18,
                length
            ),

            new THREE.MeshStandardMaterial({
                map: sidewalkTexture,
                roughness: 1
            })

        );

        sidewalk.position.set(

            (x1 + x2) / 2 +
                Math.cos(angle) *
                side *
                (width / 2 + 1.25),

            0.1,

            (z1 + z2) / 2 -
                Math.sin(angle) *
                side *
                (width / 2 + 1.25)

        );

        sidewalk.rotation.y = angle;

        sidewalk.receiveShadow = true;

        scene.add(sidewalk);

    }

}


// ======================================================
// MAIN ROADS
// ======================================================

// Main boulevard

createRoad(
    0,
    -220,
    0,
    220,
    22
);


// D080 inspired diagonal

createRoad(
    -140,
    -210,
    -30,
    210,
    14
);


// vertical roads

createRoad(
    -90,
    -210,
    -75,
    210,
    9
);

createRoad(
    -55,
    -210,
    -45,
    210,
    8
);

createRoad(
    50,
    -210,
    55,
    210,
    9
);

createRoad(
    90,
    -210,
    105,
    210,
    9
);

createRoad(
    130,
    -210,
    145,
    210,
    8
);


// ======================================================
// SIDE STREETS
// ======================================================

const horizontalRoads = [
    -180,
    -145,
    -110,
    -70,
    -35,
    10,
    55,
    95,
    135,
    175
];

for (const z of horizontalRoads) {

    createRoad(
        -160,
        z,
        160,
        z,
        8
    );

}


// ======================================================
// EXTRA DIAGONAL CONNECTIONS
// ======================================================

createRoad(
    -145,
    130,
    -60,
    30,
    7
);

createRoad(
    45,
    160,
    140,
    100,
    7
);

createRoad(
    45,
    80,
    140,
    20,
    7
);

createRoad(
    45,
    -10,
    130,
    -80,
    7
);

createRoad(
    45,
    -90,
    120,
    -175,
    7
);


// ======================================================
// ROAD MARKINGS
// ======================================================

for (let z = -200; z <= 200; z += 13) {

    createBox(
        -5.5,
        0.14,
        z,
        0.15,
        0.03,
        5,
        0xf1efe5
    );

    createBox(
        5.5,
        0.14,
        z,
        0.15,
        0.03,
        5,
        0xf1efe5
    );

}


// ======================================================
// TREES
// ======================================================

function createTree(x, z, scale = 1) {

    createCylinder(
        x,
        2 * scale,
        z,
        0.35 * scale,
        4 * scale,
        0x5b4430
    );


    const positions = [

        [0, 5.1, 0, 2.2],

        [1, 5.2, 0, 1.5],

        [-1, 5, 0.2, 1.5],

        [0, 6.3, 0, 1.5]

    ];


    for (const item of positions) {

        const leaves = new THREE.Mesh(

            new THREE.IcosahedronGeometry(
                item[3] * scale,
                1
            ),

            material(
                Math.random() > 0.5
                    ? 0x426d32
                    : 0x527b39
            )

        );

        leaves.position.set(

            x + item[0] * scale,

            item[1] * scale,

            z + item[2] * scale

        );

        leaves.castShadow = true;

        scene.add(leaves);

    }

}


// ======================================================
// TREE LINES
// ======================================================

for (let z = -190; z <= 190; z += 16) {

    createTree(
        -17,
        z,
        0.9
    );

    createTree(
        17,
        z + 8,
        0.9
    );

}


// ======================================================
// BUILDINGS
// ======================================================

const buildingColors = [

    0xc6ae88,
    0xd1c7ac,
    0xba835e,
    0xaeb2a7,
    0xd1a371,
    0xb9b39f,
    0xd5c4ae

];


const shopNames = [

    "MARKET",
    "ECZANE",
    "FIRIN",
    "LOKANTA",
    "KAFE",
    "PASTANE",
    "BERBER",
    "TEKSTIL"

];


// ======================================================
// SIGN TEXTURE
// ======================================================

function createSignMaterial(
    text,
    background = "#315f43"
) {

    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = background;
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 44px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        256,
        64
    );

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.colorSpace =
        THREE.SRGBColorSpace;

    return new THREE.MeshBasicMaterial({
        map: texture
    });

}


// ======================================================
// BUILDING FUNCTION
// ======================================================

function createBuilding(
    x,
    z,
    width,
    depth,
    floors,
    seed = 0
) {

    const floorHeight = 3;

    const height =
        3.5 +
        floors * floorHeight;


    const color =
        buildingColors[
            seed %
            buildingColors.length
        ];


    createBox(
        x,
        height / 2,
        z,
        width,
        height,
        depth,
        color,
        true
    );


    const side =
        x < 0
            ? 1
            : -1;


    const front =
        x +
        side *
        (width / 2 + 0.03);


    // ==================================================
    // SHOP GROUND FLOOR
    // ==================================================

    createBox(
        front,
        1.7,
        z,
        0.2,
        3.4,
        depth * 0.92,
        0x343939
    );


    for (let i = -1; i <= 1; i++) {

        createBox(

            front +
            side * 0.1,

            1.7,

            z +
            i *
            depth *
            0.28,

            0.15,

            2.3,

            depth * 0.2,

            0x5c7881

        );

    }


    // ==================================================
    // SHOP SIGN
    // ==================================================

    const signMaterial =
        createSignMaterial(

            shopNames[
                seed %
                shopNames.length
            ],

            [
                "#286244",
                "#a62d2d",
                "#9a682f",
                "#55453b"
            ][seed % 4]

        );


    const sign =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                5,
                1
            ),

            signMaterial

        );


    sign.position.set(
        front +
        side * 0.15,
        3.2,
        z
    );


    sign.rotation.y =
        side > 0
            ? Math.PI / 2
            : -Math.PI / 2;


    scene.add(sign);


    // ==================================================
    // WINDOWS + BALCONIES
    // ==================================================

    for (
        let floor = 0;
        floor < floors;
        floor++
    ) {

        const y =
            5 +
            floor *
            floorHeight;


        for (
            let windowIndex = -2;
            windowIndex <= 2;
            windowIndex++
        ) {

            const windowZ =
                z +
                windowIndex *
                depth *
                0.14;


            // frame

            createBox(

                front,
                y,
                windowZ,

                0.16,
                1.6,
                1.35,

                0xe3dccf

            );


            // glass

            createBox(

                front +
                side * 0.08,

                y,

                windowZ,

                0.1,
                1.25,
                1.05,

                0x526f79

            );


            // sill

            createBox(

                front +
                side * 0.13,

                y - 0.85,

                windowZ,

                0.2,
                0.1,
                1.5,

                0x8d877b

            );

        }


        // BALCONY

        if (
            floor % 2 ===
            seed % 2
        ) {

            createBox(

                front +
                side * 0.55,

                y - 0.65,

                z,

                1,
                0.15,
                depth * 0.45,

                0xb7b1a4

            );


            createBox(

                front +
                side * 1,

                y - 0.1,

                z,

                0.08,
                1,
                depth * 0.45,

                0x484d4e

            );

        }


        // AC UNIT

        if (
            (floor + seed) % 3 === 0
        ) {

            createBox(

                front +
                side * 0.3,

                y - 0.5,

                z +
                depth * 0.35,

                0.5,
                0.5,
                0.85,

                0xe7e4da

            );

        }

    }


    // ==================================================
    // ROOF
    // ==================================================

    createBox(

        x,

        height + 0.25,

        z,

        width + 0.2,

        0.5,

        depth + 0.2,

        0xa39c90

    );


    // roof utility box

    createBox(

        x - side * 2,

        height + 1,

        z,

        2,

        1.2,

        1.7,

        0xbab5ab

    );


    // antenna

    createCylinder(

        x + side * 2,

        height + 1.5,

        z,

        0.05,

        2.5,

        0x55595a

    );

}


// ======================================================
// GENERATE MAIN STREET BUILDINGS
// ======================================================

let buildingSeed = 0;

for (
    let z = -190;
    z <= 190;
    z += 30
) {

    createBuilding(

        -29,
        z,
        17,
        22,
        3 + buildingSeed % 4,
        buildingSeed++

    );


    createBuilding(

        29,
        z + 8,
        18,
        22,
        3 + buildingSeed % 5,
        buildingSeed++

    );

}


// ======================================================
// OUTER CITY BUILDINGS
// ======================================================

const cityBlocks = [

    [-125, -155],
    [-100, -130],
    [-75, -155],

    [-130, -70],
    [-100, -50],
    [-70, -75],

    [-130, 10],
    [-100, 35],
    [-70, 10],

    [-130, 90],
    [-100, 115],
    [-70, 90],

    [-130, 165],
    [-100, 150],
    [-70, 170],

    [70, -155],
    [100, -135],
    [130, -155],

    [70, -70],
    [100, -50],
    [130, -75],

    [70, 10],
    [100, 35],
    [130, 10],

    [70, 90],
    [100, 115],
    [130, 90],

    [70, 165],
    [100, 150],
    [130, 170]

];


cityBlocks.forEach(
    (position, index) => {

        createBuilding(

            position[0],

            position[1],

            15 + index % 3,

            17,

            3 + index % 4,

            index

        );

    }
);


// ======================================================
// STREET LIGHTS
// ======================================================

function createStreetLight(
    x,
    z,
    direction = 1
) {

    createCylinder(
        x,
        3.8,
        z,
        0.08,
        7.6,
        0x44494a
    );


    createBox(

        x + direction * 0.5,

        7.5,

        z,

        1,

        0.08,

        0.08,

        0x44494a

    );


    const lampMaterial =
        new THREE.MeshStandardMaterial({

            color: 0xffdf9c,

            emissive: 0xffa52e,

            emissiveIntensity: 0.25

        });


    createBox(

        x + direction,

        7.4,

        z,

        0.3,

        0.18,

        0.3,

        0xffffff,

        false,

        lampMaterial

    );


    const pointLight =
        new THREE.PointLight(

            0xffb65b,

            0,

            18,

            2

        );


    pointLight.position.set(

        x + direction,

        7.2,

        z

    );


    scene.add(pointLight);

    streetLights.push(pointLight);

}


for (
    let z = -180;
    z <= 180;
    z += 30
) {

    createStreetLight(
        -10,
        z,
        1
    );

    createStreetLight(
        10,
        z + 15,
        -1
    );

}


// ======================================================
// SIMPLE PARKED CARS FALLBACK
// ======================================================

function createFallbackCar(
    x,
    z,
    color
) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3.8,
                0.7,
                1.7
            ),

            material(
                color,
                0.5,
                0.1
            )

        );


    body.position.y = 0.7;

    group.add(body);


    const roof =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2,
                0.65,
                1.45
            ),

            material(
                0x344c57,
                0.25,
                0.1
            )

        );


    roof.position.set(
        -0.2,
        1.35,
        0
    );

    group.add(roof);


    group.position.set(
        x,
        0,
        z
    );


    scene.add(group);

}


createFallbackCar(
    -7.5,
    -80,
    0x992f2a
);

createFallbackCar(
    7.5,
    20,
    0xe0ded8
);


// ======================================================
// AĞRI DAĞI
// ======================================================

function createMountain(
    centerX,
    centerZ,
    radius,
    height,
    color
) {

    const segments = 64;
    const rings = 24;

    const vertices = [];
    const indices = [];


    for (
        let ring = 0;
        ring <= rings;
        ring++
    ) {

        const t =
            ring / rings;


        const currentRadius =
            radius *
            (
                1 -
                Math.pow(
                    t,
                    1.5
                )
            );


        const y =
            t *
            height;


        for (
            let i = 0;
            i < segments;
            i++
        ) {

            const angle =
                i /
                segments *
                Math.PI *
                2;


            const noise =

                (
                    Math.sin(
                        i * 2.7 +
                        ring * 1.8
                    )

                    +

                    Math.sin(
                        i * 0.8 -
                        ring * 2.1
                    )

                )

                *

                0.9

                *

                (1 - t);


            vertices.push(

                centerX +
                Math.cos(angle) *
                (
                    currentRadius +
                    noise
                ),

                y,

                centerZ +
                Math.sin(angle) *
                (
                    currentRadius +
                    noise * 0.5
                )

            );

        }

    }


    for (
        let ring = 0;
        ring < rings;
        ring++
    ) {

        for (
            let i = 0;
            i < segments;
            i++
        ) {

            const next =
                (i + 1) %
                segments;


            const a =
                ring *
                segments +
                i;


            const b =
                ring *
                segments +
                next;


            const c =
                (ring + 1) *
                segments +
                i;


            const d =
                (ring + 1) *
                segments +
                next;


            indices.push(
                a,
                c,
                b,

                b,
                c,
                d
            );

        }

    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.Float32BufferAttribute(
            vertices,
            3
        )

    );


    geometry.setIndex(indices);

    geometry.computeVertexNormals();


    const mountain =
        new THREE.Mesh(

            geometry,

            material(
                color,
                1
            )

        );


    mountain.receiveShadow = true;

    scene.add(mountain);

}


createMountain(
    -10,
    -420,
    130,
    135,
    0x716e69
);


// snow cap

const snow =
    new THREE.Mesh(

        new THREE.ConeGeometry(
            31,
            31,
            48
        ),

        material(
            0xf2f0ea,
            0.95
        )

    );


snow.position.set(
    -10,
    120,
    -420
);

snow.scale.z = 0.6;

scene.add(snow);


// ======================================================
// LOAD GLB MODELS
// ======================================================

const gltfLoader =
    new GLTFLoader();


function normalizeModel(
    object,
    wantedHeight
) {

    object.updateMatrixWorld(true);


    const bounds =
        new THREE.Box3()
            .setFromObject(object);


    const size =
        new THREE.Vector3();


    bounds.getSize(size);


    if (
        size.y <= 0 ||
        !Number.isFinite(size.y)
    ) {

        return;

    }


    const scale =
        wantedHeight /
        size.y;


    object.scale.multiplyScalar(
        scale
    );


    object.updateMatrixWorld(true);


    const newBounds =
        new THREE.Box3()
            .setFromObject(object);


    object.position.y -=
        newBounds.min.y;

}


// ======================================================
// LOAD PEOPLE
// ======================================================

gltfLoader.load(

    "./assets/human.glb",

    (gltf) => {

        console.log(
            "human.glb loaded"
        );


        const template =
            gltf.scene;


        normalizeModel(
            template,
            1.75
        );


        const positions = [

            [-15, 150, -1],

            [-16, 110, 1],

            [15, 80, -1],

            [16, 30, 1],

            [-15, -20, -1],

            [15, -75, 1],

            [-16, -130, -1],

            [16, -170, 1]

        ];


        positions.forEach(
            (data, index) => {

                const person =
                    template.clone(true);


                person.position.x =
                    data[0];


                person.position.z =
                    data[1];


                person.rotation.y =
                    data[2] > 0
                        ? 0
                        : Math.PI;


                person.traverse(
                    (child) => {

                        if (
                            child.isMesh
                        ) {

                            child.castShadow =
                                true;

                            child.receiveShadow =
                                true;

                        }

                    }
                );


                scene.add(person);


                walkers.push({

                    object: person,

                    direction:
                        data[2],

                    speed:
                        0.4 +
                        (
                            index %
                            3
                        ) *
                        0.08

                });

            }
        );

    },

    undefined,

    (error) => {

        console.warn(
            "human.glb kon niet geladen worden",
            error
        );

    }

);


// ======================================================
// LOAD CAR MODEL
// ======================================================

gltfLoader.load(

    "./assets/generic_80s_european_car.glb",

    (gltf) => {

        console.log(
            "car GLB loaded"
        );


        const template =
            gltf.scene;


        normalizeModel(
            template,
            1.45
        );


        const cars = [

            [-7.5, 130, 0],

            [7.5, 70, Math.PI],

            [-7.5, -50, 0],

            [7.5, -145, Math.PI],

            [-80, -105, Math.PI / 2],

            [95, 55, -Math.PI / 2]

        ];


        cars.forEach(
            (data) => {

                const car =
                    template.clone(true);


                car.position.set(

                    data[0],

                    0,

                    data[1]

                );


                car.rotation.y =
                    data[2];


                car.traverse(
                    (child) => {

                        if (
                            child.isMesh
                        ) {

                            child.castShadow =
                                true;

                            child.receiveShadow =
                                true;

                        }

                    }
                );


                scene.add(car);

            }
        );

    },

    undefined,

    (error) => {

        console.warn(
            "Auto GLB kon niet geladen worden",
            error
        );

    }

);


// ======================================================
// PLAYER
// ======================================================

const player = {

    position:
        new THREE.Vector3(
            0,
            1.72,
            185
        ),

    velocityY: 0,

    grounded: true,

    radius: 0.4

};


camera.position.copy(
    player.position
);


let yaw = 0;
let pitch = 0;

let pointerLocked = false;

const keys = {};


// ======================================================
// UI
// ======================================================

const startScreen =
    document.querySelector("#start");


const transition =
    document.querySelector("#transition");


const playButton =
    document.querySelector("#play");


// ======================================================
// START BUTTON
// ======================================================

if (playButton) {

    playButton.addEventListener(
        "click",
        () => {

            console.log(
                "ŞEHRE GİR clicked"
            );


            if (startScreen) {

                startScreen.style.display =
                    "none";

            }


            if (transition) {

                transition.classList.add(
                    "show"
                );

            }


            setTimeout(
                () => {

                    renderer.domElement
                        .requestPointerLock();

                },
                100
            );


            setTimeout(
                () => {

                    if (transition) {

                        transition.classList.remove(
                            "show"
                        );

                    }

                },
                600
            );

        }
    );

}
else {

    console.error(
        "#play button bestaat niet"
    );

}


// ======================================================
// POINTER LOCK
// ======================================================

document.addEventListener(
    "pointerlockchange",
    () => {

        pointerLocked =

            document.pointerLockElement ===
            renderer.domElement;


        if (
            !pointerLocked &&
            startScreen
        ) {

            startScreen.style.display =
                "block";

        }

    }
);


// ======================================================
// MOUSE LOOK
// ======================================================

document.addEventListener(
    "mousemove",
    (event) => {

        if (!pointerLocked) {

            return;

        }


        yaw -=
            event.movementX *
            0.002;


        pitch -=
            event.movementY *
            0.002;


        pitch =
            Math.max(
                -1.45,
                Math.min(
                    1.45,
                    pitch
                )
            );


        camera.rotation.set(
            pitch,
            yaw,
            0
        );

    }
);


// ======================================================
// KEYBOARD
// ======================================================

document.addEventListener(
    "keydown",
    (event) => {

        keys[event.code] =
            true;


        if (
            event.code ===
            "Space" &&
            player.grounded
        ) {

            player.velocityY =
                6.5;


            player.grounded =
                false;

        }


        if (
            event.code ===
            "KeyN"
        ) {

            toggleNight();

        }

    }
);


document.addEventListener(
    "keyup",
    (event) => {

        keys[event.code] =
            false;

    }
);


// ======================================================
// COLLISION
// ======================================================

function collides(
    x,
    z
) {

    for (
        const object of
        collisionObjects
    ) {

        if (

            x +
            player.radius >
            object.minX

            &&

            x -
            player.radius <
            object.maxX

            &&

            z +
            player.radius >
            object.minZ

            &&

            z -
            player.radius <
            object.maxZ

        ) {

            return true;

        }

    }


    return false;

}


// ======================================================
// DAY / NIGHT
// ======================================================

let night = false;


function toggleNight() {

    night = !night;


    if (night) {

        scene.background.set(
            0x17263b
        );


        scene.fog.color.set(
            0x17263b
        );


        hemisphereLight.intensity =
            0.45;


        sun.intensity =
            0.2;


        renderer.toneMappingExposure =
            0.7;


        streetLights.forEach(
            (light) => {

                light.intensity =
                    7;

            }
        );

    }
    else {

        scene.background.set(
            0xa7cfe4
        );


        scene.fog.color.set(
            0xa7cfe4
        );


        hemisphereLight.intensity =
            2;


        sun.intensity =
            3;


        renderer.toneMappingExposure =
            1.05;


        streetLights.forEach(
            (light) => {

                light.intensity =
                    0;

            }
        );

    }

}


// ======================================================
// CLOCK
// ======================================================

const clock =
    new THREE.Clock();


// ======================================================
// GAME LOOP
// ======================================================

function updatePlayer(deltaTime) {

    if (!pointerLocked) {

        return;

    }


    const forward =
        new THREE.Vector3(

            -Math.sin(yaw),

            0,

            -Math.cos(yaw)

        );


    const right =
        new THREE.Vector3(

            Math.cos(yaw),

            0,

            -Math.sin(yaw)

        );


    const movement =
        new THREE.Vector3();


    if (keys.KeyW) {

        movement.add(
            forward
        );

    }


    if (keys.KeyS) {

        movement.sub(
            forward
        );

    }


    if (keys.KeyD) {

        movement.add(
            right
        );

    }


    if (keys.KeyA) {

        movement.sub(
            right
        );

    }


    if (
        movement.lengthSq() >
        0
    ) {

        movement.normalize();


        const speed =
            keys.ShiftLeft
                ? 8.5
                : 5.2;


        movement.multiplyScalar(
            speed *
            deltaTime
        );


        const nextX =
            player.position.x +
            movement.x;


        const nextZ =
            player.position.z +
            movement.z;


        if (
            !collides(
                nextX,
                player.position.z
            )
        ) {

            player.position.x =
                nextX;

        }


        if (
            !collides(
                player.position.x,
                nextZ
            )
        ) {

            player.position.z =
                nextZ;

        }

    }


    // gravity

    player.velocityY -=
        18 *
        deltaTime;


    player.position.y +=
        player.velocityY *
        deltaTime;


    if (
        player.position.y <=
        1.72
    ) {

        player.position.y =
            1.72;


        player.velocityY =
            0;


        player.grounded =
            true;

    }


    camera.position.copy(
        player.position
    );


    // walking head bob

    if (
        movement.lengthSq() >
        0 &&
        player.grounded
    ) {

        camera.position.y +=

            Math.sin(
                performance.now() *
                0.011
            )

            *

            0.025;

    }

}


// ======================================================
// NPC WALKING
// ======================================================

function updateWalkers(
    deltaTime
) {

    for (
        const walker of
        walkers
    ) {

        walker.object.position.z +=

            walker.direction *
            walker.speed *
            deltaTime;


        if (
            walker.object.position.z >
            195
        ) {

            walker.object.position.z =
                195;


            walker.direction =
                -1;


            walker.object.rotation.y =
                Math.PI;

        }


        if (
            walker.object.position.z <
            -195
        ) {

            walker.object.position.z =
                -195;


            walker.direction =
                1;


            walker.object.rotation.y =
                0;

        }

    }

}


// ======================================================
// MENU CAMERA
// ======================================================

function updateMenuCamera() {

    const time =
        performance.now() *
        0.0001;


    camera.position.set(

        Math.sin(time) *
        45,

        11,

        140 +
        Math.cos(time) *
        28

    );


    camera.lookAt(
        0,
        5,
        -40
    );

}


// ======================================================
// MAIN LOOP
// ======================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const deltaTime =
        Math.min(
            clock.getDelta(),
            0.04
        );


    if (pointerLocked) {

        updatePlayer(
            deltaTime
        );

    }
    else {

        updateMenuCamera();

    }


    updateWalkers(
        deltaTime
    );


    renderer.render(
        scene,
        camera
    );

}


animate();


// ======================================================
// RESIZE
// ======================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =

            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );

    }
);


console.log(
    "Iğdır game.js succesvol gestart"
);