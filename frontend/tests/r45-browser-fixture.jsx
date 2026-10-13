// Actual Login/Register + AuthProvider + HTTP client against real Backend/SQL.
let active;
export async function mountR45AuthForm(page) {
 const [{default:React},{createRoot},{MemoryRouter,Routes,Route},{AuthProvider},{default:Login},{default:Register},{authTokenStorage}] = await Promise.all([import('react'),import('react-dom/client'),import('react-router-dom'),import('/src/context/AuthContext.jsx'),import('/src/pages/auth/Login.jsx'),import('/src/pages/auth/Register.jsx'),import('/src/api/authToken.js')]);
 authTokenStorage.clear();
 const originalFetch=window.fetch,box=document.createElement('div');document.body.append(box);const root=createRoot(box),calls=[],checks=[];
 const wait=async fn=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('Auth form timeout');await new Promise(r=>setTimeout(r,30));}};
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name:page+': '+name,status:'PASS'});};
 window.fetch=async(url,options={})=>{const response=await originalFetch(url,options);calls.push({route:new URL(url,location.href).pathname,method:options.method??'GET',status:response.status});return response;};
 root.render(React.createElement(MemoryRouter,{initialEntries:['/'+page]},React.createElement(AuthProvider,null,React.createElement(Routes,null,React.createElement(Route,{path:'/login',element:React.createElement(Login)}),React.createElement(Route,{path:'/register',element:React.createElement(Register)}),React.createElement(Route,{path:'/',element:React.createElement('p',null,'R45 authenticated destination')})))));
 await wait(()=>box.querySelector('input[type="email"]'));
 const set=async(node,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,70));};
 const email=box.querySelector('input[type="email"]'),password=box.querySelector('input[type="password"]');
 if(page==='register')await set(box.querySelector('input[autocomplete="name"]'),'R45 browser duplicate');
 await set(email,'khachhang1@gmail.com');await set(password,page==='login'?'123456':'R45-browser-password');
 active={page,box,root,calls,checks,wait,check,authTokenStorage,originalFetch};
 box.querySelector('button[type="submit"]').click();
 await wait(()=>box.querySelector('[role="alert"]')&&!box.querySelector('button[type="submit"]').disabled);
 check('real429 shown as existing understandable retry error',calls.length===1&&calls[0].status===429&&box.querySelector('[role="alert"]').textContent.includes('Vui lòng thử lại'));
 check('form values retained and submit released',email.value==='khachhang1@gmail.com'&&password.value===(page==='login'?'123456':'R45-browser-password')&&!box.querySelector('button[type="submit"]').disabled);
 await new Promise(r=>setTimeout(r,100));check('no automatic retry or navigation on429',calls.length===1&&!box.textContent.includes('R45 authenticated destination'));
 return {status:'PASS',checks:[...checks],calls:[...calls]};
}
export async function retryR45AuthForm() {
 const {page,box,wait,check,calls,checks}=active;
 box.querySelector('button[type="submit"]').click();
 if(page==='login'){
  await wait(()=>box.textContent.includes('R45 authenticated destination'));
  check('explicit retry after expiry logs in and uses real JWT/me',calls.some(c=>c.route==='/api/auth/login'&&c.status===200)&&calls.some(c=>c.route==='/api/auth/me'&&c.status===200));
 }else{
  await wait(()=>box.querySelector('[role="alert"]')?.textContent==='Email đã được sử dụng.');
  check('explicit retry after expiry reaches existing duplicate-email contract',calls.at(-1).status===409&&!box.querySelector('button[type="submit"]').disabled);
 }
 return {status:'PASS',checks:[...checks],calls:[...calls]};
}
export function cleanupR45AuthForm(){if(active){active.root.unmount();active.box.remove();active.authTokenStorage.clear();window.fetch=active.originalFetch;active=undefined;}}
