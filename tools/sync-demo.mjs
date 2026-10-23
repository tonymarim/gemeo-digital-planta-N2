import {cp,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const portal=path.resolve(root,process.argv[2]||'../../cmvi-demos');
const target=path.join(portal,'src/n2');
await mkdir(target,{recursive:true});
for(const file of ['web','model.mjs','commissioning.mjs','checks.mjs','data/catalog.mjs','data/robot.json','data/sources.json'])await cp(path.join(root,file),path.join(target,file),{recursive:true});
console.log('Fonte da demo sincronizada em '+target);
