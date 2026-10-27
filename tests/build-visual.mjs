import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const deps=existsSync(path.join(root,'node_modules/vite'))?path.join(root,'node_modules'):path.resolve(root,'../../gemeo_digital_vibracaomotor/node_modules');
const {build}=await import(pathToFileURL(path.join(deps,'vite/dist/node/index.js')));
await build({root,configFile:false,base:'./',resolve:{alias:{'@babylonjs/core':path.join(deps,'@babylonjs/core')}},build:{outDir:path.join(root,'visual-test-dist'),emptyOutDir:true,chunkSizeWarningLimit:7000,rollupOptions:{input:path.join(root,'tests/visual-fixture.html')}}});
