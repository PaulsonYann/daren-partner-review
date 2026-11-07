/* Public, entirely fictional learning demo. No private course or server data.
 * All mutations below concern this browser's demo namespace only. */
(function () {
 'use strict';
 const P=globalThis.PublicDemo;
 if(!P)throw Error('公开演示适配层尚未初始化');
 const clone=value=>JSON.parse(JSON.stringify(value));
 const stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
 const bodyOf=blocks=>blocks.flatMap(block=>['heading','paragraph'].includes(block.type)?[block.text]:block.type==='list'?block.items:[...(Object.hasOwn(block,'caption')?[block.caption]:[]),...block.headers,...block.rows.flat()]);
 const stamp=ctx=>typeof ctx.now==='function'?ctx.now():typeof ctx.now==='string'?ctx.now:new Date().toISOString();
 const actor=ctx=>({id:ctx.user.id,display:ctx.user.display});
 function fail(ctx,message,status,code){let error;try{error=ctx.error(message,status)}catch(thrown){error=thrown}if(!error||typeof error!=='object')error=Object.assign(Error(message),{status});if(code)error.code=code;throw error}
 const names={type:'内容类型',competitors:'竞争对手',blocker:'合作卡点'};
 const canonicalGroups=['商务BD方法','产品知识'];
 const defaults={type:['科技数码','AI工具','影视娱乐','游戏','生活日常','知识教育','旅游','其他'],market:['台湾','香港','日本','美国','新加坡'],lang:['繁体中文','中文（普通话）','英语','日语'],attribute:['自主开发','公司客户'],competitors:['示例竞对甲','示例竞对乙'],blocker:['稿费过高','暂无档期','竞对独家','分佣过高','其他']};
 const fingerprint=row=>{let a=2166136261;for(const char of stable(row)){a^=char.codePointAt(0);a=Math.imul(a,16777619)}return (a>>>0).toString(16).padStart(8,'0').repeat(8)};
 const metadata=row=>({publishedAt:row.publishedAt,requiresAcknowledgment:row.requiresAcknowledgment,sourceLabel:row.sourceLabel||'',sourceUrl:'',providedBy:'',sourceCommit:'',sourceBlobSha:'',url:''});
 function course(id,title,group,blocks,order,acknowledge=false){
  const row={id,module:'training',title,group,contentBlocks:blocks,body:bodyOf(blocks),version:1,published:true,publishedAt:'2026-11-08T00:00:00+08:00',requiresAcknowledgment:acknowledge,sourceLabel:'公开虚构课文 · 仅供演示',sourceUrl:'',providedBy:'',sourceCommit:'',sourceBlobSha:'',url:'',order,publicationRevision:0,draftId:null,draftIds:[],updatedAt:'',updatedBy:null,changeNote:'',history:[]};
  row.fingerprint=fingerprint(row);return row;
 }
 P.learningSeed=function(){
  const courses=[
   course('demo-training-cooperation','示例课程 · 合作前的信息核对','商务BD方法',[
    {type:'heading',level:2,text:'这是一篇公开虚构课程'},
    {type:'paragraph',text:'本课程仅用于展示阅读、学习进度和本人认可的界面，不包含团队内部客户分级标准、私有培训原文或真实合作资料。'},
    {type:'heading',level:2,text:'合作前先核对三件事'},
    {type:'list',ordered:true,items:['确认平台主页可以打开，账号与联络信息对应。','记录拟合作内容与计划日期，暂不确定的信息明确标记待确认。','讨论报价、排期与沟通方式，使用虚构示例进行练习。']},
    {type:'table',caption:'虚构核对示例',headers:['项目','示例内容','检查动作'],rows:[['主页','example.test 下的虚构链接','核对填写格式'],['排期','下个月的一次内容合作','与对方重新确认'],['报价','USD 120（纯示例）','记录沟通结果']]},
    {type:'paragraph',text:'阅读本身不会自动完成学习。可选择标记已学；明确认可当前示例标准时，再点击认可按钮。以上记录只保存在当前浏览器。'}
   ],0,true),
   course('demo-training-product','示例课程 · 产品介绍准备','产品知识',[
    {type:'heading',level:2,text:'准备一次清晰的产品介绍'},
    {type:'paragraph',text:'以完全虚构的“示例效率工具”为对象，练习说明使用场景、展示重点和需要对方确认的事项。这里不提供任何真实商品权益、套餐承诺或提成规则。'},
    {type:'list',ordered:false,items:['用一句话说明希望解决的问题。','列出需要演示的两个场景。','把尚未确认的价格、权益和时长保留为待定。']}
   ],1),
   course('demo-training-tracking','示例课程 · 推广数据回填','商务BD方法',[
    {type:'heading',level:2,text:'记录同一次发布的累计结果'},
    {type:'paragraph',text:'本例演示在发布后的四个节点记录累计新增注册与累计订单。虚构数值仅供查看界面，不代表真实推广效果。'},
    {type:'table',headers:['节点','累计新增注册','累计订单'],rows:[['第15天','12','2'],['第30天','24','5'],['第60天','31','7'],['第90天','未知','未知']]},
    {type:'paragraph',text:'无法取得数据时填写未知并说明原因，不用零代替未知。该说明只用于本次公开演示。'}
   ],2)
  ];
  courses.push({id:'demo-help-start',module:'help',title:'公开演示使用说明',group:0,body:['所有人物、邮箱、账号、业务和课程均为虚构。','切换示例身份仅改变演示视角，不提供真实身份认证；请勿输入真实资料或密码。','资料只保存在当前浏览器。重置演示不会改变任何正式系统。'],version:1,published:true,publishedAt:'2026-11-08T00:00:00+08:00',requiresAcknowledgment:false,url:'',order:0});
  const blocks=[{type:'heading',level:2,text:'演示工作稿'}, {type:'paragraph',text:'这是可编辑的虚构课程草稿，可以练习新增段落、排序、预览和与正式示例对照。保存仅影响当前浏览器，不发布到真实团队课程。'}];
  return {learning:{version:0,draftVersion:0,courses,drafts:[{id:'demo-draft-1',creationKey:'demo-seed-draft-1',title:'演示工作稿 · 合作检查清单',group:'商务BD方法',contentBlocks:blocks,body:bodyOf(blocks),changeNote:'仅演示课程编辑与预览。',source:null,sourceChanged:false,createdAt:'2026-11-08T00:00:00+08:00',updatedAt:'2026-11-08T00:00:00+08:00',createdBy:{id:101,display:'示例管理员'},updatedBy:{id:101,display:'示例管理员'}}],progress:{'102':{'training/demo-training-product':{version:1,completedAt:'2026-11-08T00:00:00+08:00',revision:1,acknowledgments:[]}}},receipts:{},optionConfig:null}};
 };
 function state(ctx){
  if(!ctx.d.learning)ctx.d.learning=P.learningSeed().learning;
  return ctx.d.learning;
 }
 function requireUser(ctx,admin=false){
  if(!ctx.user)throw ctx.error('请先选择公开演示身份',401);
  if(admin&&ctx.user.role!=='admin')throw ctx.error('该模块仅供示例管理员视角查看',403);
 }
 function listing(ctx){
  const data=state(ctx),progress=data.progress[String(ctx.user.id)]||{};
  return {courses:data.courses.filter(row=>row.published!==false).map(row=>{
   const p=progress[row.module+'/'+row.id],completed=!!p?.completedAt,history=clone(p?.acknowledgments||[]),current=history.find(item=>item.version===row.version),latest=current||history[0];
   return {...clone(row),learned:completed,review:completed&&p.version!==row.version,new:!completed,completedAt:completed?p.completedAt:'',completedVersion:completed?p.version:0,progressRevision:p?.revision||0,acknowledged:!!current,acknowledgedVersion:latest?.version||0,acknowledgedAt:latest?.acknowledgedAt||'',acknowledgmentHistory:history};
  })};
 }
 async function persist(ctx,mutate){
  const before={learning:clone(ctx.d.learning),businessOptions:clone(ctx.d.businessOptions||defaults),businessOptionsVersion:ctx.d.businessOptionsVersion||0,disabledOptions:clone(ctx.d.disabledOptions||{type:[],competitors:[],blocker:[]})};
  try{const result=mutate();await ctx.save();return result}catch(error){Object.assign(ctx.d,before);throw error}
 }
 async function learning(ctx){
  if(ctx.body===undefined)return listing(ctx);
  const d=ctx.body,data=state(ctx),ack=d.action==='acknowledge',allowed=ack?['action','module','id','version','revision','requestId']:['module','id','version','learned','revision'];
  if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(key=>!allowed.includes(key))||!['training','help'].includes(d.module)||typeof d.id!=='string'||!Number.isSafeInteger(d.version)||!Number.isSafeInteger(d.revision)||d.revision<0||(!ack&&typeof d.learned!=='boolean'))throw ctx.error('学习请求格式无效');
  const row=data.courses.find(row=>row.module===d.module&&row.id===d.id&&row.published!==false);
  if(!row)throw ctx.error('示例课程不可用',404);
  if(row.version!==d.version)throw ctx.error('示例课程已变化，请重新读取后核对',409);
  if(ack&&(!row.requiresAcknowledgment||typeof d.requestId!=='string'||d.requestId.length<8||d.requestId.length>100))throw ctx.error('示例课程认可请求无效');
  const key=d.module+'/'+d.id,uid=String(ctx.user.id),p=data.progress[uid]?.[key],revision=p?.revision||0,receiptKey=uid+'/'+d.requestId;
  if(ack&&Object.hasOwn(data.receipts,receiptKey)){
   const receipt=data.receipts[receiptKey];
   if(receipt.payload!==stable(d)||revision!==receipt.appliedRevision||p?.completedAt!==receipt.at)throw ctx.error('后续学习记录已经变化，请重新读取后核对',409);
   return {...listing(ctx),idempotent:true};
  }
  if(revision!==d.revision)throw ctx.error('示例学习记录已更新，请刷新后重试',409);
  return persist(ctx,()=>{
   data.progress[uid]??={};const at=ack||d.learned?stamp(ctx):'',acknowledgments=clone(p?.acknowledgments||[]);
   if(ack)acknowledgments.unshift({version:row.version,acknowledgedAt:at});
   data.progress[uid][key]={version:row.version,completedAt:at,revision:revision+1,acknowledgments};
   if(ack)data.receipts[receiptKey]={payload:stable(d),appliedRevision:revision+1,at};
   return {...listing(ctx),...(ack?{idempotent:false}:{})};
  });
 }
 function optionConfig(ctx){
  const learning=state(ctx),options=ctx.d.businessOptions||defaults;
  if(!learning.optionConfig)learning.optionConfig={version:ctx.d.businessOptionsVersion||0,groups:Object.entries(names).map(([key,label])=>({key,label,items:(options[key]||defaults[key]).map((value,index)=>({id:'demo-option-'+key+'-'+index,label:value,enabled:true}))}))};
  return learning.optionConfig;
 }
 function publicOptions(ctx){
  const config=optionConfig(ctx),options=clone(ctx.d.businessOptions||defaults),disabledOptions={};
  for(const group of config.groups){options[group.key]=group.items.filter(item=>item.enabled).map(item=>item.label);disabledOptions[group.key]=group.items.filter(item=>!item.enabled).map(item=>item.label)}
  return {version:config.version,options,disabledOptions};
 }
 async function businessOptions(ctx){
  const config=optionConfig(ctx),d=ctx.body;
  if(d===undefined)return clone(config);
  if(!d||!Number.isSafeInteger(d.version)||d.version!==config.version)fail(ctx,'演示选项已变化，请重新读取',409,'BUSINESS_OPTIONS_CHANGED');
  const group=config.groups.find(group=>group.key===d.kind);
  if(!group)throw ctx.error('演示选项分组无效');
  return persist(ctx,()=>{
   let changed=false;
   if(d.action==='add'){
    const label=typeof d.label==='string'?d.label.trim():'';
    if(!label||Array.from(label).length>100||/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(label))throw ctx.error('请输入1—100字的选项名称');
    if(group.items.length>=300)throw ctx.error('演示选项数量已达上限');
    if(group.items.some(item=>item.label.toLocaleLowerCase()===label.toLocaleLowerCase()))throw ctx.error('选项名称已存在',409);
    group.items.push({id:'demo-option-'+d.kind+'-local-'+crypto.randomUUID(),label,enabled:true});changed=true;
   }else if(d.action==='set-enabled'){
    const item=group.items.find(item=>item.id===d.id);
    if(!item||typeof d.enabled!=='boolean')throw ctx.error('选项状态无效');
    if(!d.enabled&&item.enabled&&group.items.filter(item=>item.enabled).length===1)throw ctx.error('每组至少保留一个启用选项');
    changed=item.enabled!==d.enabled;item.enabled=d.enabled;
   }else if(d.action==='reorder'){
    if(!Array.isArray(d.ids)||d.ids.length!==group.items.length||new Set(d.ids).size!==group.items.length||d.ids.some(id=>!group.items.some(item=>item.id===id)))throw ctx.error('排序范围无效');
    changed=group.items.some((item,index)=>item.id!==d.ids[index]);group.items=d.ids.map(id=>group.items.find(item=>item.id===id));
   }else throw ctx.error('公开演示不支持该选项操作');
   if(changed)config.version++;
   const output=publicOptions(ctx);ctx.d.businessOptions=output.options;ctx.d.businessOptionsVersion=output.version;ctx.d.disabledOptions=output.disabledOptions;
   return clone(config);
  });
 }
 function sources(ctx){
  const data=state(ctx);
  return data.courses.filter(row=>row.module==='training').map(row=>({id:row.id,title:row.title,group:row.group,version:row.version,contentBlocks:clone(row.contentBlocks),body:bodyOf(row.contentBlocks),metadata:metadata(row),fingerprint:row.fingerprint,existingDraftId:data.drafts.find(draft=>draft.source?.courseId===row.id)?.id||null}));
 }
 function draftDTO(ctx){return {version:state(ctx).draftVersion,sources:sources(ctx),drafts:clone(state(ctx).drafts)}}
 function validateContent(ctx,value,oldGroup=null){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!['title','group','contentBlocks','changeNote'].includes(key))||typeof value.title!=='string'||!value.title.trim()||Array.from(value.title.trim()).length>120||typeof value.group!=='string'||(!canonicalGroups.includes(value.group)&&value.group!==oldGroup)||typeof(value.changeNote??'')!=='string'||Array.from(value.changeNote??'').length>2000)throw ctx.error('请填写有效的示例课程标题、规范分类和变更说明');
  if(/[\p{C}\p{Zl}\p{Zp}]/u.test(value.title+value.group))throw ctx.error('课程标题或分类包含无效字符');
  const blocks=value.contentBlocks,text=(value,max)=>typeof value==='string'&&Array.from(value).length<=max&&!/[\p{Cc}\p{Cs}]/u.test(value.replace(/[\r\n\t]/g,''));
  if(!Array.isArray(blocks)||blocks.length>100||new Blob([JSON.stringify(blocks)]).size>131072||!text(value.changeNote??'',2000))throw ctx.error('示例课程内容过长或格式无效');
  for(const block of blocks){
   if(!block||typeof block!=='object'||Array.isArray(block))throw ctx.error('课程内容块无效');
   const allowed=block.type==='heading'?['type','level','text']:block.type==='paragraph'?['type','text']:block.type==='list'?['type','ordered','items']:block.type==='table'?['type','caption','headers','rows']:[];
   const valid=allowed.length&&Object.keys(block).every(key=>allowed.includes(key))&&(block.type==='heading'?[2,3,4].includes(block.level)&&text(block.text,10000):block.type==='paragraph'?text(block.text,10000):block.type==='list'?typeof block.ordered==='boolean'&&Array.isArray(block.items)&&block.items.length<=100&&block.items.every(item=>text(item,2000)):(!Object.hasOwn(block,'caption')||text(block.caption,10000))&&Array.isArray(block.headers)&&block.headers.length<=20&&block.headers.every(item=>text(item,2000))&&Array.isArray(block.rows)&&block.rows.length<=100&&block.rows.every(row=>Array.isArray(row)&&row.length<=20&&row.every(item=>text(item,2000))));
   if(!valid)throw ctx.error('课程内容块格式无效');
  }
  return {title:value.title.trim(),group:value.group,contentBlocks:clone(blocks),changeNote:value.changeNote??''};
 }
 async function drafts(ctx){
  const data=state(ctx),d=ctx.body;
  if(d===undefined)return draftDTO(ctx);
  if(!d||d.version!==data.draftVersion)fail(ctx,'演示工作稿已变化，请重新读取',409,'TRAINING_DRAFTS_CHANGED');
  if(!['create','copy-source','save','reorder'].includes(d.action))throw ctx.error('公开演示不支持该工作稿操作');
  const source=d.action==='copy-source'?sources(ctx).find(row=>row.id===d.sourceId):null;
  if(d.action==='copy-source'&&!source)throw ctx.error('示例来源课程不可用',404);
  if(['create','copy-source'].includes(d.action)&&(typeof d.requestId!=='string'||d.requestId.length<8||d.requestId.length>100))throw ctx.error('工作稿创建标识无效');
  if(['create','copy-source'].includes(d.action)&&data.drafts.some(row=>row.creationKey===d.requestId))fail(ctx,'此演示工作稿请求已存在，请刷新后查看',409,'TRAINING_DRAFT_CREATION_EXISTS');
  if(source&&data.drafts.some(row=>row.source?.courseId===source.id))fail(ctx,'此示例来源已有工作稿',409,'TRAINING_DRAFT_SOURCE_EXISTS');
  return persist(ctx,()=>{
   let changed=false;
   if(['create','copy-source'].includes(d.action)){
    if(data.drafts.length>=100)throw ctx.error('演示草稿数量已达上限');
    const content=source?{title:source.title,group:source.group==='商务BD'?'商务BD方法':source.group,contentBlocks:clone(source.contentBlocks),changeNote:''}:validateContent(ctx,d.content),at=stamp(ctx);
    data.drafts.push({id:'demo-draft-'+crypto.randomUUID(),creationKey:d.requestId,...content,body:bodyOf(content.contentBlocks),source:source?{courseId:source.id,version:source.version,fingerprint:source.fingerprint,metadata:clone(source.metadata)}:null,sourceChanged:false,createdAt:at,updatedAt:at,createdBy:actor(ctx),updatedBy:actor(ctx)});changed=true;
   }else if(d.action==='save'){
    const row=data.drafts.find(row=>row.id===d.id);if(!row)throw ctx.error('演示工作稿不存在',404);
    const content=validateContent(ctx,{...d.content,changeNote:Object.hasOwn(d.content||{},'changeNote')?d.content.changeNote:row.changeNote},row.group),old={title:row.title,group:row.group,contentBlocks:row.contentBlocks,changeNote:row.changeNote??''};
    changed=stable(content)!==stable(old);if(changed)Object.assign(row,content,{body:bodyOf(content.contentBlocks),updatedAt:stamp(ctx),updatedBy:actor(ctx)});
   }else{
    if(!Array.isArray(d.ids)||d.ids.length!==data.drafts.length||new Set(d.ids).size!==data.drafts.length||d.ids.some(id=>!data.drafts.some(row=>row.id===id)))throw ctx.error('工作稿排序范围无效');
    changed=data.drafts.some((row,index)=>row.id!==d.ids[index]);data.drafts=d.ids.map(id=>data.drafts.find(row=>row.id===id));
   }
   if(changed)data.draftVersion++;
   return draftDTO(ctx);
  });
 }
 function publications(ctx){
  if(ctx.body!==undefined)throw ctx.error('公开演示仅提供课程发布预览；正式发布、重要更新及上下架不会执行。',403);
  const data=state(ctx);
  return {version:data.version,draftVersion:data.draftVersion,courses:clone(data.courses.filter(row=>row.module==='training')),drafts:data.drafts.map(row=>({...clone(row),publicationCourseId:row.source?.courseId||null})),receipt:null};
 }
 P.adapters.push(async function(ctx){
  const paths=['/api/learning','/api/business-options','/api/admin/business-options','/api/admin/training-drafts','/api/admin/training-publications'];
  if(!paths.includes(ctx.path))return P.UNHANDLED;
  requireUser(ctx,ctx.path.startsWith('/api/admin/'));state(ctx);
  if(ctx.path==='/api/learning')return learning(ctx);
  if(ctx.path==='/api/business-options'){
   if(ctx.body!==undefined)throw ctx.error('公开演示仅允许读取业务选项',403);
   return publicOptions(ctx);
  }
  if(ctx.path==='/api/admin/business-options')return businessOptions(ctx);
  if(ctx.path==='/api/admin/training-drafts')return drafts(ctx);
  return publications(ctx);
 });
})();
