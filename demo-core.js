/* Public Pages demo only. No server authentication, business uploads, or shared state. */
(function(root){
'use strict';
const STORAGE='daren-public-demo-v11-20261108',SESSION='daren-public-demo-role-v11';
const D=root.PublicDemo={adapters:[],UNHANDLED:Symbol('unhandled-demo-route'),version:'V11 · 2026-11-08',STORAGE,SESSION};
D.users=[
{id:101,username:'demo.admin',display:'示例管理员',role:'admin',enabled:true,passwordChangeRequired:false},
{id:102,username:'demo.bd',display:'示例商务甲',role:'bd',enabled:true,passwordChangeRequired:false},
{id:103,username:'demo.peer',display:'示例商务乙',role:'bd',enabled:true,passwordChangeRequired:false},
{id:104,username:'demo.supervisor',display:'示例主管',role:'admin',enabled:true,passwordChangeRequired:false}
];
D.error=(message,status=400)=>Object.assign(new Error(message),{status});
D.role=()=>{try{return sessionStorage.getItem(SESSION)||''}catch{throw D.error('浏览器禁止会话存储，请允许此站点存储后重试。')}};
D.user=()=>{const raw=D.users.find(x=>String(x.id)===D.role());if(!raw)return null;return {...raw,theme:'blue',promotionTracking:true,adminAccounts:raw.role==='admin',adminReadOnly:raw.role==='admin',adminTeam:raw.role==='admin',adminIdentity:raw.role==='admin',adminHandoffPreview:raw.role==='admin',adminHandoff:raw.role==='admin',adminHandoffExecute:raw.role==='admin',adminBusinessOptions:raw.role==='admin',adminTrainingDrafts:raw.role==='admin',adminTrainingPublications:raw.role==='admin',adminBackupRecovery:raw.role==='admin',adminPublicationCorrections:raw.role==='admin'}};
D.save=d=>{try{localStorage.setItem(STORAGE,JSON.stringify(d))}catch{throw D.error('浏览器存储不可用或空间不足，修改未保存。请清理后重试。',507)}};
D.seed=()=>({schemaVersion:11,...(D.businessSeed?.()||{}),...(D.adminSeed?.()||{}),...(D.learningSeed?.()||{})});
D.read=()=>{let raw;try{raw=localStorage.getItem(STORAGE)}catch{throw D.error('浏览器禁止本地存储，无法载入演示。请允许此站点存储后重试。',507)}if(raw===null){const d=D.seed();D.save(d);return d}try{const d=JSON.parse(raw);if(d.schemaVersion!==11||!Array.isArray(d.kols)||!Array.isArray(d.pool))throw Error();return d}catch{throw D.error('当前浏览器的演示资料损坏，请通过“重置演示资料”恢复虚构样例。',422)}};
D.request=async(url,body)=>{
 const parsed=new URL(url,'https://demo.invalid'),path=parsed.pathname,now=new Date().toISOString(),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
 if(parsed.origin!=='https://demo.invalid'||!path.startsWith('/api/'))throw D.error('演示版不会访问外部业务接口。');
 if(path==='/api/me')return {user:D.user(),setupRequired:false};
 if(path==='/api/logout'){try{sessionStorage.removeItem(SESSION)}catch{throw D.error('浏览器会话无法清除，请关闭当前标签页。')}return {ok:true}}
 if(['/api/login','/api/setup','/api/password','/api/password-recovery','/api/first-password'].includes(path))throw D.error('公开演示不设置或验证密码，请使用演示入口；请勿输入真实密码。');
 const user=D.user();if(!user)throw D.error('请先选择演示身份。',401);
 const d=D.read(),ctx={url,path,params:parsed.searchParams,body,d,user,error:(...args)=>{throw D.error(...args)},now,today,save:()=>D.save(d)};
 if(path.startsWith('/api/admin/')&&user.role!=='admin')throw D.error('请切换管理员演示身份查看此模块。',403);
 for(const adapter of D.adapters){const result=await adapter(ctx);if(result!==D.UNHANDLED)return structuredClone(result)}
 throw D.error('此操作需要正式后台，公开演示不执行。输入仍留在当前页面。',400);
};
})(window);
