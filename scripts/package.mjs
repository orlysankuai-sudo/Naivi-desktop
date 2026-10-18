import {packager} from '@electron/packager';
import fs from 'node:fs';
const result=await packager({electronZipDir:process.env.NAIVI_ELECTRON_ZIP_DIR||undefined,dir:'.',name:'Naivi',platform:'win32',arch:'x64',out:'dist/4.0.0',overwrite:true,asar:true,prune:true,
 icon:fs.existsSync('src/renderer/naivi.ico')?'src/renderer/naivi.ico':undefined,
 appCopyright:'Copyright 2026 SanGuai Culture Studio / SanGuai Inc. HK',
 ignore:[/^\/(?:tests|scripts|server|dist|test-results|runtime-logs|\.git)(?:\/|$)/,/^\/\.env/,/\.secret$/,/\.sqlite(?:-|$)/,/\.(?:pem|key)$/],
 win32metadata:{CompanyName:'SanGuai Culture Studio / SanGuai Inc. HK',FileDescription:'Naivi — A Cygnus Automation Project',ProductName:'Naivi'}});
console.log('Packaged: '+result.join(', '));
