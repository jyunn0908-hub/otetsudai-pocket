import {firebaseConfig} from '../dist/config.js';
import {spawnSync} from 'node:child_process';
if(!firebaseConfig?.projectId||!firebaseConfig?.apiKey||!firebaseConfig?.authDomain||!firebaseConfig?.appId){console.error('先に dist/config.js に Firebase のWebアプリ用設定を入れてください。');process.exit(1)}
const cli=process.platform==='win32'?'npx.cmd':'npx';
const result=spawnSync(cli,['--yes','firebase-tools','deploy','--project',firebaseConfig.projectId,'--only','hosting,firestore:rules'],{stdio:'inherit',shell:false});
process.exit(result.status??1);
