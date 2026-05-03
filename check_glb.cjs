const fs = require('fs');

function checkGLB(file) {
    const buffer = fs.readFileSync(file);
    const magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') return console.log(file, 'not gltf');
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonChunkType = buffer.toString('utf8', 16, 20);
    if (jsonChunkType !== 'JSON') return console.log(file, 'no JSON chunk');
    
    const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);
    
    const nodes = gltf.nodes.map(n => n.name).slice(0, 15).join(', ');
    console.log(file, '=> Nodes:', nodes);
}

checkGLB('public/models/character_desk.glb');
checkGLB('public/models/character_contact.glb');
checkGLB('public/models/character_hologram.glb');
