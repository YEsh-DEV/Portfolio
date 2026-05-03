const fs = require('fs');
function checkAnimations(file) {
    if (!fs.existsSync(file)) return console.log(file, 'not found');
    const buffer = fs.readFileSync(file);
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
    const gltf = JSON.parse(jsonStr);
    
    if (gltf.animations) {
        const anims = gltf.animations.map(a => a.name).join(', ');
        console.log(file, '=> Animations:', anims);
    } else {
        console.log(file, '=> No animations');
    }
}
checkAnimations('public/models/character.glb');
checkAnimations('public/models/desk_scene.glb');
