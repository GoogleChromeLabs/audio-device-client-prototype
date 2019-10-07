/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
importScripts("./infra/free-queue.js","./infra/free-clock.js","./infra/events.js");let clock,queue,channelData,outputBuffer,deviceCallbackFunction,agent=Agent.Producer,state=State.Pending;self.sampleRate=null;const initialize=e=>{queue=new FreeQueue(e.sharedBuffer),channelData=new Float32Array(e.constraints.callbackBufferSize),outputBuffer=[channelData,channelData],self.sampleRate=e.constraints.sampleRate;const a=channelData.length/self.sampleRate*1e3;clock=new FreeClock(a,render)},setDeviceCallback=e=>{deviceCallbackFunction=e},loadScript=e=>{self.importScripts(e.scriptPath)},render=()=>{deviceCallbackFunction(null,outputBuffer),queue.push(outputBuffer,channelData.length)||console.log("[ClientGlobalScope] Failed to push in Worker. (overflow)")};self.onmessage=(e=>{switch(e.data.command){case Command.Initialize:initialize(e.data.payload),state=State.StandBy;break;case Command.LoadScript:loadScript(e.data.payload);break;case Command.Start:clock.start(),state=State.Running;break;case Command.Stop:clock.stop(),state=State.StandBy;break;case Command.Close:clock.stop(),state=State.Closed}self.postMessage({agent:agent,state:state})}),self.postMessage({agent:agent,state:state});