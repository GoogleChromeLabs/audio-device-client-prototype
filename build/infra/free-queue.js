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
const States={Read:0,Write:1};class FreeQueue{static createSharedBuffer(t,e){const s=new Uint32Array(new SharedArrayBuffer(Object.keys(States).length*Uint32Array.BYTES_PER_ELEMENT));s[States.Write]=Math.ceil(.5*t);const a=[];for(let s=0;s<e;++s)a.push(new Float32Array(new SharedArrayBuffer((t+1)*Float32Array.BYTES_PER_ELEMENT)));return{states:s,channelData:a,length:t,channelCount:e}}constructor(t){this._states=t.states,this._channelData=t.channelData,this._bufferLength=t.length+1,this._channelCount=t.channelCount}_reset(){for(let t=0;t<this._channelCount;++t)this._channelData[t].fill(0);Atomics.store(this._states,States.Read,0),Atomics.store(this._states,States.Write,0)}push(t,e){const s=Atomics.load(this._states,States.Write),a=Atomics.load(this._states,States.Read);if(this._getAvailableWrite(s,a)<e)return!1;let n=s+e;if(this._bufferLength<n){n-=this._bufferLength;for(let e=0;e<this._channelCount;++e){const a=this._channelData[e].subarray(s),r=this._channelData[e].subarray(0,n);a.set(t[e].subarray(0,a.length)),r.set(t[e].subarray(a.length))}}else{for(let e=0;e<this._channelCount;++e)this._channelData[e].subarray(s,n).set(t[e]);n===this._bufferLength&&(n=0)}return Atomics.store(this._states,States.Write,n),!0}pull(t,e){const s=Atomics.load(this._states,States.Write),a=Atomics.load(this._states,States.Read);if(this._getAvailableRead(s,a)<e)return!1;let n=a+e;if(this._bufferLength<n){n-=this._bufferLength;for(let e=0;e<this._channelCount;++e){const s=this._channelData[e].subarray(a),r=this._channelData[e].subarray(0,n);t[e].set(s),t[e].set(r,s.length)}}else{for(let e=0;e<this._channelCount;++e)t[e].set(this._channelData[e].subarray(a,n));n===this._bufferLength&&(n=0)}return Atomics.store(this._states,States.Read,n),!0}getBufferLength(){return this._bufferLength-1}_getAvailableWrite(t,e){const s=e-t-1;return s<=-1?s+this._bufferLength:s}_getAvailableRead(t,e){const s=t-e;return s>=0?s:s+this._bufferLength}}