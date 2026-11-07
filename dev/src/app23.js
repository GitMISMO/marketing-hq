/* ---------- New member logos from Member 360 (Jonna, Nov 5, 2026). Member 360 lists the new members that have a logo
   (data/mm-newmembers in member-360-data). When MISMO Media opens, each logo not already here is added to the Image Library
   (campaign Logos, in SharePoint like every picture), placed in the New Member Welcome section of the right MISMO Matters edition
   (the first edition after the month they joined whose content date hasn't passed), and the month's LinkedIn new member
   announcement request is made or brought up to date with the logos attached. ---------- */
const NM_R="https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/member-360";
function nmTok(){try{return window.ResourcesSession.token()||"";}catch(e){return "";}}
function nmNext(mo){let [y,m]=mo.split("-").map(Number);m++;if(m>12){m=1;y++;}return y+"-"+String(m).padStart(2,"0");}
function nmEdition(joined){const t=T(),jm=String(joined||t).slice(0,7);
  const eds=vals("editions").filter(e=>e&&e.month).sort((a,b)=>a.month.localeCompare(b.month));
  /* a new member goes in the first issue after they join that is still being built (build day), not only before its content day (Jonna, Nov 6, 2026) */
  const ok=eds.find(e=>e.month>jm&&String((e.dates||{}).build||(e.dates||{}).publish||(e.dates||{}).content||e.month+"-01")>=t);if(ok)return ok.month;
  let mo=nmNext(jm);while(mo<=t.slice(0,7))mo=nmNext(mo);return mo;}
/* the same company under a slightly different name: "HomeVision" and "HomeVision, Inc.", "The Money Store" and "MLD Mortgage dba The Money Store", "Ameriprise Financial" and "Ameriprise Bank" */
function nmSame(a,b){const parts=s=>String(s||"").toLowerCase().split(/\s+d\/?b\/?a\s+/).map(p=>p.replace(/&/g," and ").replace(/\b(inc|llc|l\.l\.c|corp|corporation|company|co|the|ltd|lp|na|n\.a)\b\.?/g," ").trim()).filter(Boolean);
  const c=p=>p.replace(/[^a-z0-9]+/g,""),f=p=>(p.match(/[a-z0-9]+/)||[""])[0];
  const A=parts(a),B=parts(b);return A.some(x=>B.some(y=>{const X=c(x),Y=c(y);return X===Y||(X.length>5&&Y.length>5&&(X.indexOf(Y)===0||Y.indexOf(X)===0))||(f(x).length>=6&&f(x)===f(y)&&!/^(american|national|united|federal|mortgage|financial|first|community|citizens)$/.test(f(x)));}));}
let NM_BUSY=false;
async function nmImport(){if(NM_BUSY||!DB||typeof addImages!=="function")return;NM_BUSY=true;try{
  const r=await fetch(NM_R+"/data/mm-newmembers",{headers:{Authorization:"Bearer "+nmTok()},cache:"no-store"});if(!r.ok)return;
  const j=await r.json().catch(()=>null);const items=((j&&j.data)||{}).items||[];if(!items.length)return;
  const have=new Set(vals("images").map(im=>im.m360Logo).filter(Boolean)),touched={};
  for(const it of items){if(!it||!it.logo||!it.logo.path||have.has(it.logo.path)||!/^image\//.test(it.logo.type||""))continue;
    /* only members new enough for a welcome: the edition must be within two months of the month they joined (older members were welcomed before) */
    /* only the issue right after the month they joined (October joiners go in November): a member who joined earlier was welcomed then, even if their logo only arrived now (Jonna, Nov 6, 2026) */
    {const jm=String(it.joined||"").slice(0,7);if(!jm||nmEdition(it.joined)!==nmNext(jm))continue;}
    const fr=await fetch(NM_R+"/file/"+it.logo.path,{headers:{Authorization:"Bearer "+nmTok()},cache:"no-store"});if(!fr.ok)continue;
    const fj=await fr.json().catch(()=>null);if(!fj||!fj.content)continue;const bin=atob(String(fj.content).replace(/\s/g,""));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    const ext=it.logo.path.split(".").pop(),file=new File([u],String(it.name||"Logo").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-")+"-logo."+ext,{type:it.logo.type});
    const month=nmEdition(it.joined),group=it.champion?(it.type==="Lender"?"Lender Champions":"Industry Champions"):"Corporate Members";
    const made=await addImages([file],{name:it.name+" Logo",company:it.name,group,campaign:"logos",edition:"",alt:it.name+" logo",site:it.website||"",m360Logo:it.logo.path,m360Key:it.k||"",m360Level:it.level||"",m360Joined:it.joined||""});
    if(!made||!made.length)continue;const im=made[0];have.add(it.logo.path);
    if(vals("sections").some(x=>x&&x.key==="welcome"&&(x.logos||[]).some(l=>(l.k&&l.k===it.k)||nmSame(l.name,it.name))))continue;
    const sid=month+"__welcome",cur=(S.sections||{})[sid]||{month,key:"welcome",status:"in",owner:"Kelly",from:"Member 360 new members",headline:"MISMO Welcomes New Members"};
    const logos=(cur.logos||[]).filter(l=>l.name!==it.name).concat([{id:im.id,name:it.name,group,url:it.website||"",k:it.k||""}]);
    await put("sections",sid,Object.assign({},cur,{month,key:"welcome",logos}));touched[month]=1;}
  for(const month of Object.keys(touched)){const rid="rq-newmembers-"+month,cur=(S.requests||{})[rid];
    const logos=((S.sections||{})[month+"__welcome"]||{}).logos||[],ed=vals("editions").find(e=>e.month===month)||{};
    const need=(ed.dates&&(ed.dates.publish||ed.dates.approve))||(month+"-15");
    await put("requests",rid,Object.assign({status:"review",role:"MISMO Staff",type:"linkedin",n:"Member 360",e:"",group:"Membership",owner:"",neededBy:need,at:new Date().toISOString()},cur||{},{
      title:"New Member Announcement: "+monthName(month),
      details:"LinkedIn post welcoming MISMO's new members, to go with the "+monthName(month)+" MISMO Matters: "+logos.map(l=>l.name).join(", ")+". Their logos are attached below and are in the Image Library under Logos.",
      images:logos.map(l=>l.id),links:logos.map(l=>l.name+(l.url?" · "+l.url:"")).join("\n"),auto:"member-360"}));}
  if(Object.keys(touched).length)toast("New member logos from Member 360 added to MISMO Matters and the LinkedIn request.",5000);
}catch(e){console.error("new member logos",e);}finally{NM_BUSY=false;}}
{let n=0;const iv=setInterval(()=>{n++;if(DB&&typeof S!=="undefined"&&S.images&&Object.keys(S.images).length&&S.editions){clearInterval(iv);setTimeout(()=>nmImport(),6000);}else if(n>120)clearInterval(iv);},1500);}
/* a request with logos attached shows them */
{const _oR=openRequest;openRequest=function(id){const r=_oR.apply(this,arguments);try{const q=id&&rqGet(id);if(q&&Array.isArray(q.images)&&q.images.length){const b=document.getElementById("pane-body");
  if(b){const box=document.createElement("div");box.className="nm-att";box.innerHTML='<div class="nm-att-h">Attached Logos</div>';
  q.images.forEach(iid=>{const im=(S.images||{})[iid];if(!im)return;const fig=document.createElement("figure"),img=document.createElement("img"),cap=document.createElement("figcaption");
  img.alt=im.alt||im.name||"";cap.textContent=im.company||im.name||"";fig.append(img,cap);box.appendChild(fig);Promise.resolve(imgEnsure(im)).then(()=>{const s=imgSrc(im);if(s)img.src=s;});});
  b.appendChild(box);}}}catch(e){console.error("attached logos",e);}return r;};}
