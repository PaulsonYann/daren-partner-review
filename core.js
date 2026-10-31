/* Shared validation and CSV helpers. */
(function(root){
const PLATFORMS=['YouTube','Instagram','TikTok','Facebook','X','Telegram','VK','其他'];
const PRODUCTS=['ChatGPT','Netflix','Spotify','Canva Pro','YouTube','Disney+','Perplexity','Gamma','其他'];
const STAGES=['待联系','沟通中','洽谈中','体验中','合作中','暂停／不合作'];
const unique=a=>[...new Set(a.map(x=>String(x).trim()).filter(Boolean))];
const split=v=>unique(String(v||'').split(/[;；\n|、]/));
function profile(raw,platform){
 let u;try{u=new URL(String(raw).trim())}catch{return {error:'请填写完整的主页链接'}}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return {error:'主页链接格式不正确'};
 let host=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');
 let path;try{path=decodeURIComponent(u.pathname).replace(/\/+$/,'')}catch{return {error:'主页链接格式不正确'}}
 if(['example.com','example.org','example.net'].includes(host))return {error:'请填写真实的平台账号主页'};
 let key;
 if(platform==='YouTube'){
 if(!['youtube.com'].includes(host))return {error:'平台与主页链接不匹配'};
 if(/^\/@[^/]+$/.test(path))key='youtube:handle:'+path.slice(2).toLowerCase();
 else if(/^\/channel\/[A-Za-z0-9_-]+$/.test(path))key='youtube:channel:'+path.split('/')[2];
 else if(/^\/(c|user)\/[^/]+$/.test(path))key='youtube:legacy:'+path;
 else return {error:'请使用频道主页，不是视频或平台首页'};
 }else if(platform==='Instagram'){
 if(host!=='instagram.com'||!/^\/[A-Za-z0-9._]+$/.test(path)||/^\/(p|reel|reels|explore|stories|accounts)$/i.test(path))return {error:'请填写 Instagram 账号主页'};
 key='instagram:'+path.slice(1).toLowerCase();path=path.toLowerCase();
 }else if(platform==='TikTok'){
 if(host!=='tiktok.com'||!/^\/@[^/]+$/.test(path))return {error:'请填写 TikTok 账号主页'};
 key='tiktok:'+path.slice(2).toLowerCase();path=path.toLowerCase();
 }else if(platform==='Telegram'){
 if(!['t.me','telegram.me'].includes(host)||!/^\/[A-Za-z0-9_]{3,}$/.test(path))return {error:'请填写 Telegram 频道或账号主页'};
 host='t.me';path=path.toLowerCase();key='telegram:'+path.slice(1);
 }else if(platform==='X'){
 if(!['x.com','twitter.com'].includes(host)||!/^\/[A-Za-z0-9_]+$/.test(path)||/^\/(home|search|explore|i)$/i.test(path))return {error:'请填写 X 账号主页'};
 host='x.com';path=path.toLowerCase();key='x:'+path.slice(1);
 }else if(platform==='VK'){
 if(!['vk.com','vk.ru'].includes(host)||!/^\/[A-Za-z0-9_.-]+$/.test(path))return {error:'请填写 VK 账号主页'};
 host='vk.com';path=path.toLowerCase();key='vk:'+path.slice(1);
 }else if(platform==='Facebook'){
 if(host!=='facebook.com'||!path||/^\/(watch|reel|reels|stories)$/i.test(path))return {error:'请填写 Facebook 账号主页'};
 if(path==='/profile.php'){const id=u.searchParams.get('id');if(!id||!/^\d+$/.test(id))return {error:'请填写有效账号ID'};key='facebook:id:'+id;return {key,url:'https://www.facebook.com/profile.php?id='+id,platform};}
 if(!/^\/[^/]+$/.test(path))return {error:'请填写 Facebook 账号主页'};
 key='facebook:'+path.toLowerCase();
 }else if(platform==='其他'){
 if(!path||path==='/')return {error:'请填写具体账号或作者主页'};
 // Unknown sites may use query parameters for account identity; retain them.
 key='other:'+host+path+u.search;
 return {key,url:'https://'+host+path+u.search,platform};
 }else return {error:'不支持的平台'};
 return {key,url:'https://'+host+path,platform};
}
function guessPlatform(raw){try{const h=new URL(raw).hostname.replace(/^(www\.|m\.)/,'');return h==='youtube.com'?'YouTube':h==='instagram.com'?'Instagram':h==='tiktok.com'?'TikTok':['x.com','twitter.com'].includes(h)?'X':['t.me','telegram.me'].includes(h)?'Telegram':['vk.com','vk.ru'].includes(h)?'VK':h==='facebook.com'?'Facebook':'其他'}catch{return '其他'}}
function validate(data){
 if(!String(data.name||'').trim())return '缺少 KOL 名称';
 if(!data.platforms?.length)return '请选择平台';
 if(data.platforms.some(p=>!PLATFORMS.includes(p)))return '存在未知平台';
 if(!data.accounts?.length)return '至少填写一条账号主页';
 for(const a of data.accounts){if(!data.platforms.includes(a.platform))return '账号与所选平台不匹配';let r=profile(a.url,a.platform);if(r.error)return r.error;}
 if(data.platforms.some(p=>!data.accounts.some(a=>a.platform===p)))return '每个所选平台都需填写主页';
 if((data.products||[]).some(p=>!PRODUCTS.includes(p)))return '存在未知推广产品';
 if(data.next&&!validDate(data.next))return '下次跟进日期无效';
 return '';
}
function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function makeIndex(records,excludeId){let map=new Map();for(const k of records){if(k.id===excludeId)continue;for(const a of k.accounts||[]){const p=profile(a.url,a.platform);if(!p.error)map.set(p.key,{id:k.id,owner:k.owner||null});}}return map;}
function collision(data,index,reserved=new Set()){
 let seen=new Set();for(const a of data.accounts||[]){let r=profile(a.url,a.platform);if(r.error)continue;if(seen.has(r.key)||index.has(r.key)||reserved.has(r.key))return true;seen.add(r.key);}return false;
}
function parseCSV(text){
 text=String(text).replace(/^\uFEFF/,'');const rows=[],lineNumbers=[];let row=[],cell='',quoted=false,closed=false,line=1,rowStart=1;
 for(let i=0;i<text.length;i++){let c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else{cell+=c;if(c==='\n')line++}continue;}
 if(c==='"'){if(cell||closed)throw Error('CSV引号格式错误');quoted=true;continue;}
 if(c===','){row.push(cell);cell='';closed=false;continue;}
 if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim())){rows.push(row);lineNumbers.push(rowStart)}row=[];cell='';closed=false;line++;rowStart=line;continue;}
 if(closed&&!/\s/.test(c))throw Error('CSV引号格式错误');if(!closed)cell+=c;
 }
 if(quoted)throw Error('CSV存在未闭合引号');row.push(cell);if(row.some(v=>v.trim())){rows.push(row);lineNumbers.push(rowStart)}
 if(rows.length<2)throw Error('文件需要表头和至少一条记录');let headers=rows.shift().map(h=>h.trim());
 if(headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('表头存在空列名或重复列名');
 lineNumbers.shift();return {headers,rows,lineNumbers};
}
function csvCell(v){let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(headers,rows){return '\uFEFF'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');}
const api={PLATFORMS,PRODUCTS,STAGES,unique,split,profile,guessPlatform,validate,validDate,makeIndex,collision,parseCSV,exportCSV};
if(typeof module!=='undefined')module.exports=api;else root.KOLCore=api;
})(typeof window==='undefined'?{}:window);
