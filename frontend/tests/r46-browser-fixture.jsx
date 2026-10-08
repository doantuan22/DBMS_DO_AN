// Real Profile/AuthProvider/http client, no intercepted responses or mocked API.
let active;
export async function mountR46Profile(token,role){
 const [{default:React},{createRoot},{AuthProvider,useAuth},{default:Profile},{authTokenStorage}]=await Promise.all([import('react'),import('react-dom/client'),import('/src/context/AuthContext.jsx'),import('/src/pages/auth/Profile.jsx'),import('/src/api/authToken.js')]);
 authTokenStorage.set(token);const originalFetch=window.fetch,box=document.createElement('div');document.body.append(box);const root=createRoot(box),calls=[],checks=[];
 const wait=async fn=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('Profile form timeout');await new Promise(r=>setTimeout(r,30));}};
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name:role+': '+name,status:'PASS'});};
 window.fetch=async(url,options={})=>{const response=await originalFetch(url,options);calls.push({route:new URL(url,location.href).pathname,method:options.method??'GET',status:response.status,...(options.method==='PUT'?{payload:JSON.parse(options.body)}:{})});return response;};
 function Gate(){const {user,initializing}=useAuth();return user&&!initializing?React.createElement(Profile):React.createElement('p',null,'Loading');}
 root.render(React.createElement(AuthProvider,null,React.createElement(Gate)));active={root,box,authTokenStorage,originalFetch};
 await wait(()=>box.querySelector('input[type="tel"]'));
 const customer=role==='KHACH_HANG';check('role appropriate fields after real GET me',Boolean(box.querySelector('input[type="date"]'))===customer&&Boolean(box.querySelector('select'))===customer);
 const set=async(node,value)=>{Object.getOwnPropertyDescriptor(node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));await new Promise(r=>setTimeout(r,70));};
 await set(box.querySelector('input[required]'),'R46 browser '+role);if(customer){await set(box.querySelector('input[type="date"]'),'1996-07-08');await set(box.querySelector('select'),'Nữ');}
 box.querySelector('button[type="submit"]').click();await wait(()=>box.querySelector('[role="status"]')&&!box.querySelector('button').disabled);
 const put=calls.find(c=>c.method==='PUT');check('real PUT succeeds, Customer fields only for Customer',put?.status===200&&put.payload.NgaySinh===(customer?'1996-07-08':null)&&put.payload.GioiTinh===(customer?'Nữ':null));
 const me=await (await originalFetch('/api/auth/me',{headers:{Authorization:'Bearer '+token}})).json();
 check('read after write matches name and role',me.user.name==='R46 browser '+role&&me.user.role===role);
 check('Customer updates specific fields; abnormal Staff fields preserved',me.user.birthday===(customer?'1996-07-08':'1990-02-01')&&me.user.gender===(customer?'Nữ':'Nam')&&me.user.loyaltyPoints===23);
 return {status:'PASS',checks,calls,user:{userId:me.user.userId,role:me.user.role,name:me.user.name,birthday:me.user.birthday,gender:me.user.gender,loyaltyPoints:me.user.loyaltyPoints}};
}
export function cleanupR46Profile(){if(active){active.root.unmount();active.box.remove();active.authTokenStorage.clear();window.fetch=active.originalFetch;active=undefined;}}
