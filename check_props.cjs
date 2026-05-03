const fs = require('fs');
function checkNodes(file) {
    if (!fs.existsSync(file)) return console.log(file, 'not found');
    const buffer = fs.readFileSync(file);
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);
    const nodes = gltf.nodes.map(n => n.name).join(', ');
    console.log(file, '=> Nodes:', nodes);
}
checkNodes('public/models/prop_a.glb');
checkNodes('public/models/prop_b.glb');
