import fs from 'node:fs';
import path from 'node:path';
import { out,save } from './collect.mjs';
import { fixtures,persist,date } from './api.mjs';

export class CDP {
  pending=new Map(); next=1; events=[];
  async open(){const target=await (await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();this.ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{this.ws.onopen=resolve;this.ws.onerror=reject;});this.ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){const p=this.pending.get(v.id);this.pending.delete(v.id);v.error?p?.reject(Error(JSON.stringify(v.error))):p?.resolve(v.result);}else if(['Network.requestWillBeSent','Network.responseReceived','Runtime.exceptionThrown'].includes(v.method)){if(v.method==='Network.requestWillBeSent'){this.events.push({method:v.method,url:v.params.request.url,httpMethod:v.params.request.method,body:v.params.request.postData?.replace(/"(?:MatKhau|password)":"[^"]*"/g,'"password":"[REDACTED]"')});}else if(v.method==='Network.responseReceived')this.events.push({method:v.method,url:v.params.response.url,status:v.params.response.status});else this.events.push({method:v.method,details:v.params.exceptionDetails.text});}};await this.send('Page.enable');await this.send('Runtime.enable');await this.send('Network.enable');}
  send(method,params={}){return new Promise((resolve,reject)=>{const id=this.next++;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+r.result?.description);return r.result?.value;}
  async nav(route){await this.send('Page.navigate',{url:'http://127.0.0.1:5173'+route});await this.until("document.readyState==='complete'");}
  async until(expression,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.eval(expression))return true;}catch{}await new Promise(r=>setTimeout(r,150));}throw Error(`Browser timeout: ${expression}`);}
  async set(selector,value){return this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');const setter=Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true;})()`);}
  async click(text){await this.eval(`(()=>{const b=[...document.querySelectorAll('button'),...document.querySelectorAll('a')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing action: '+${JSON.stringify(text)});b.click();})()`);}
  async snapshot(name){const text=await this.eval('document.body.innerText');save(`browser-${name}.txt`,text);const r=await this.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,`browser-${name}.png`),Buffer.from(r.data,'base64'));return text;}
}

