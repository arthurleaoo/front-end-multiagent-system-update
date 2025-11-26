const API_URL_KEY = "api_url"
const TOKEN_KEY = "token"
const DEFAULT_API_URL = "http://127.0.0.1:5000"
let apiUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL
let token = localStorage.getItem(TOKEN_KEY) || ""

const overlay = document.getElementById("overlay")
const toasts = document.getElementById("toasts")
const loginView = document.getElementById("loginView")
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const userSection = document.getElementById("userSection")
const healthBtn = null
const generateOpenBtn = document.getElementById("generateOpenBtn")
const generateCloseBtn = document.getElementById("generateCloseBtn")
const generatePanel = document.getElementById("generatePanel")
const generateForm = document.getElementById("generateForm")
const inlinePanel = document.getElementById("inlinePanel")
const inlineOpenBtn = document.getElementById("generateInlineBtn")
const inlineCloseBtn = document.getElementById("inlineCloseBtn")
const inlineForm = document.getElementById("inlineForm")
const inlineResult = document.getElementById("inlineResult")
 
const chatLog = document.getElementById("chatLog")
const chatTaskInput = document.getElementById("chatTaskInput")
const chatLanguageInput = document.getElementById("chatLanguageInput")
const chatPresetSelect = document.getElementById("chatPresetSelect")
const chatSendBtn = document.getElementById("chatSendBtn")
const chatZipBtn = document.getElementById("chatZipBtn")
const chatAgents = document.getElementById("chatAgents")

function setLoading(v){overlay.hidden=!v}
function toast(text,type){const el=document.createElement("div");el.className=`toast ${type||""}`;el.textContent=text;toasts.appendChild(el);setTimeout(()=>{el.remove()},3500)}
function updateUser(){
  if(token){
    getMe().then(u=>{
      const b=document.createElement("div");b.className="user-badge";const label=(u.email||"").split("@")[0];b.textContent=label;
      const out=document.createElement("button");out.className="button";out.textContent="Sair";out.onclick=logout;
      userSection.innerHTML="";userSection.appendChild(b);userSection.appendChild(out);
      showApp();
    }).catch(()=>{
      token="";localStorage.removeItem(TOKEN_KEY);
      userSection.innerHTML="";
      showLogin();
      toast("Sessão expirada ou inválida","error");
    })
  } else {
    userSection.innerHTML="";
    showLogin();
  }
}
function showApp(){const appEl=document.querySelector('.app');if(loginView){loginView.hidden=true;try{loginView.remove()}catch{}}if(appEl) appEl.style.display='grid'}
function showLogin(){const appEl=document.querySelector('.app');if(loginView) loginView.hidden=false;if(appEl) appEl.style.display='none'}

async function apiFetch(path,init){const headers={"Content-Type":"application/json"};if(init&&init.headers){for(const k in init.headers){headers[k]=init.headers[k]}}if(token)headers["Authorization"]=`Bearer ${token}`;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),90000);const opts=init?Object.assign({},init):{};opts.headers=headers;opts.signal=controller.signal;opts.mode="cors";try{const res=await fetch(`${apiUrl}${path}`,opts);clearTimeout(timeout);return res}catch(e){clearTimeout(timeout);throw e}}

async function withRetry(fn){let delay=500;for(let i=0;i<3;i++){try{return await fn()}catch(err){if(i===2)throw err;await new Promise(r=>setTimeout(r,delay));delay*=2}}}

function logout(){token="";localStorage.removeItem(TOKEN_KEY);updateUser();toast("Sessão encerrada","success")}

loginForm&& loginForm.addEventListener("submit",async e=>{e.preventDefault();const email=document.getElementById("emailInput").value.trim();const password=document.getElementById("passwordInput").value.trim();setLoading(true);try{const res=await apiFetch("/auth/login",{method:"POST",body:JSON.stringify({email,password})});const j=await res.json();if(res.ok&&j.token){token=j.token;localStorage.setItem(TOKEN_KEY,token);showApp();updateUser();toast("Login realizado","success");
 setTimeout(()=>{try{location.href=location.origin + location.pathname + location.search}catch{}} , 50)
}else{toast("Falha no login","error")}}catch(err){toast("Erro de rede","error")}finally{setLoading(false)}})

registerForm&& registerForm.addEventListener("submit",async e=>{e.preventDefault();const email=document.getElementById("regEmailInput").value.trim();const password=document.getElementById("regPasswordInput").value.trim();if(!email||!password){toast("Informe email e senha","error");return}setLoading(true);try{const res=await apiFetch("/auth/register",{method:"POST",body:JSON.stringify({email,password})});const j=await res.json();if(res.status===201){if(j.token){token=j.token;localStorage.setItem(TOKEN_KEY,token)}else{const lr=await apiFetch("/auth/login",{method:"POST",body:JSON.stringify({email,password})});const lj=await lr.json();if(lr.ok&&lj.token){token=lj.token;localStorage.setItem(TOKEN_KEY,token)}else{toast("Registro ok, login falhou","error");setLoading(false);return}}showApp();updateUser();toast("Registrado e logado","success")
 ; setTimeout(()=>{try{location.href=location.origin + location.pathname + location.search}catch{}} , 50)
}else{toast("Falha ao registrar","error")}}catch(err){toast("Erro ao registrar","error")}finally{setLoading(false)}})

async function getMe(){const res=await apiFetch("/auth/me",{method:"GET"});if(res.ok){return res.json()}throw new Error("Falha ao obter perfil")}

async function jsonOrText(res){const ct=(res.headers.get("content-type")||"").toLowerCase();if(ct.includes("application/json")){return res.json()}const t=await res.text();try{return JSON.parse(t)}catch{return {status:t.trim(),raw:t}}}

 

generateOpenBtn&& (generateOpenBtn.onclick=()=>{generatePanel.hidden=false})
generateCloseBtn&& (generateCloseBtn.onclick=()=>{generatePanel.hidden=true})
inlineOpenBtn&& (inlineOpenBtn.onclick=()=>{inlinePanel.hidden=false})
inlineCloseBtn&& (inlineCloseBtn.onclick=()=>{inlinePanel.hidden=true})

generateForm&& generateForm.addEventListener("submit",async e=>{e.preventDefault();const task=document.getElementById("taskInput").value.trim();const preset=document.getElementById("presetSelect").value;const project=document.getElementById("projectNameInput").value.trim();const language=(document.getElementById("languageInput").value.trim()||"Python");const groupId=document.getElementById("groupIdInput").value.trim();const agents=[...generateForm.querySelectorAll('.agents input[type="checkbox"]:checked')].map(i=>i.value);if(!token){toast("Faça login","error");return}setLoading(true);const btn=document.getElementById("generateSubmitBtn");btn.disabled=true;try{const payload={task:task,language:language,agents:agents,project_name:project};if(preset) payload.preset=preset; if(preset==="spring") payload.group_id = (groupId||"com.example.demo");const run=()=>apiFetch("/generate_zip",{method:"POST",body:JSON.stringify(payload)});const res=await withRetry(run);if(!res.ok){const txt=await res.text();toast(txt?`Falha: ${txt}`:"Falha ao gerar ZIP","error")}else{const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${project||"projeto"}.zip`;document.body.appendChild(a);a.click();URL.revokeObjectURL(url);toast("ZIP gerado","success")}}catch(err){toast("Erro ao gerar ZIP","error")}finally{btn.disabled=false;setLoading(false)}})

inlineForm&& inlineForm.addEventListener("submit",async e=>{e.preventDefault();const task=document.getElementById("inlineTaskInput").value.trim();const language=(document.getElementById("inlineLanguageInput").value.trim()||"Python");const preset=document.getElementById("inlinePresetSelect").value;const agents=[...inlineForm.querySelectorAll('.agents input[type="checkbox"]:checked')].map(i=>i.value);if(!token){toast("Faça login","error");return}setLoading(true);const btn=document.getElementById("inlineSubmitBtn");btn.disabled=true;try{const payload={task:task,language:language,agents:agents};const res=await apiFetch("/generate",{method:"POST",body:JSON.stringify(payload)});const j=await res.json();if(res.ok){inlineResult.textContent=JSON.stringify(j,null,2);toast("Execução concluída","success")}else{const txt=await res.text();toast(txt?`Falha: ${txt}`:"Falha na execução","error")}}catch(err){toast("Erro na execução","error")}finally{btn.disabled=false;setLoading(false)}})



overlay&& overlay.addEventListener("click",()=>setLoading(false))
window.addEventListener("error",()=>setLoading(false))
window.addEventListener("unhandledrejection",()=>setLoading(false))

function init(){
  const qp=new URLSearchParams(location.search)
  const api=qp.get("api")
  if(api){apiUrl=api;localStorage.setItem(API_URL_KEY,api)}
  setLoading(false)
  if(token){updateUser()}else{showLogin()}
  toast(`API: ${apiUrl}`)
}
document.addEventListener("DOMContentLoaded",init)
function addMessage(role, content, opts){
  const el=document.createElement("div");
  el.className='bubble ' + role;
  const meta=document.createElement("div");
  meta.className="bubble-meta";
  const who = (role==='user') ? 'Você' : 'CodeLab';
  meta.textContent= who;
  const body=document.createElement("div");
  body.className="bubble-content";
  body.textContent=content||"";
  el.appendChild(meta);
  el.appendChild(body);
  if(role==='user'){
    const actions=document.createElement("div");
    actions.className="bubble-actions";
    const ex=document.createElement("button");
    ex.className="button";
    ex.textContent="Executar";
    ex.onclick=()=>executeTaskWithText(content);
    const gz=document.createElement("button");
    gz.className="button";
    gz.textContent="Gerar ZIP";
    gz.onclick=()=>generateZipWithText(content);
    actions.appendChild(ex);
    actions.appendChild(gz);
    el.appendChild(actions)
  }
  if(opts&&opts.download){
    const a=document.createElement("a");
    a.className="download";
    a.href=opts.download.href;
    a.download=opts.download.filename||"projeto.zip";
    a.textContent=opts.download.label||"Baixar ZIP";
    el.appendChild(a)
  }
  chatLog.appendChild(el);
  chatLog.scrollTop=chatLog.scrollHeight
}

function getSelectedChatAgents(){if(!chatAgents) return ["front","back","qa"];return [...chatAgents.querySelectorAll('input[type="checkbox"]:checked')].map(i=>i.value)}
async function executeTaskWithText(task){const language=(chatLanguageInput.value||"Python").trim();const agents=getSelectedChatAgents();if(!agents.length){toast("Selecione ao menos um agente","error");return}if(!token){toast("Faça login","error");return}setLoading(true);try{const payload={task:task,language:language,agents:agents};const run=()=>apiFetch("/generate",{method:"POST",body:JSON.stringify(payload)});const res=await withRetry(run);const j=await res.json();if(res.ok){addMessage('assistant',JSON.stringify(j,null,2));toast("Execução concluída","success")}else{const t=await res.text();addMessage('assistant',t||'Falha na execução');toast("Falha","error")}}catch(e){addMessage('assistant','Erro na execução');toast("Erro","error")}finally{setLoading(false)}}

async function generateZipWithText(task){
  const language = (chatLanguageInput.value || "Python").trim();
  const preset = chatPresetSelect.value;
  const agents = getSelectedChatAgents();
  const project = (task ? task.split(' ').slice(0,2).join('-').toLowerCase() : 'projeto');
  if(!agents.length){ toast("Selecione ao menos um agente","error"); return }
  if(!token){ toast("Faça login","error"); return }
  setLoading(true);
  try{
    const payload = { task: task, language: language, agents: agents, project_name: project };
    if(preset) payload.preset = preset;
    if(preset === "spring") payload.group_id = "com.example.demo";
    const run = () => apiFetch("/generate_zip",{ method:"POST", body: JSON.stringify(payload) });
    const res = await withRetry(run);
    if(!res.ok){
      const t = await res.text();
      addMessage('assistant', t || 'Falha ao gerar ZIP');
      toast("Falha","error");
    } else {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      addMessage('assistant','ZIP gerado',{ download: { href: url, filename: `${project}.zip`, label: 'Baixar ZIP' } });
      try{
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project}.zip`;
        document.body.appendChild(a);
        a.click();
      } catch(e){}
      toast("ZIP pronto","success");
    }
  } catch(e){
    addMessage('assistant','Erro ao gerar ZIP');
    toast("Erro","error");
  } finally {
    setLoading(false);
  }
}

chatSendBtn&& (chatSendBtn.onclick=async()=>{const task=(chatTaskInput.value||"").trim();if(!task){toast("Digite a tarefa","error");return}addMessage('user',task);const friendly=/\b(obrigado|valeu|thanks|obg)\b/i;if(friendly.test(task)){addMessage('assistant','De nada! Posso gerar outro ZIP com ajustes.');return}chatSendBtn.disabled=true;try{await executeTaskWithText(task)}finally{chatSendBtn.disabled=false}})

chatZipBtn&& (chatZipBtn.onclick=async()=>{const task=(chatTaskInput.value||"").trim();if(!task){toast("Digite a tarefa","error");return}addMessage('user',`Gerar ZIP: ${task}`);chatZipBtn.disabled=true;try{await generateZipWithText(task)}finally{chatZipBtn.disabled=false}})
