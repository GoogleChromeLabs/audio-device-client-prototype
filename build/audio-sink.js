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
import{Agent,State,Command}from"./infra/events.esm.js";import FreeQueue from"./infra/free-queue.esm.js";const RENDER_QUANTUM=128;class AudioSink extends AudioWorkletProcessor{constructor(e){super(e),this.port.onmessage=this._handleMessage.bind(this),this._agent=Agent.Consumer,this._state=State.Pending}_initialize(e){this._queue=new FreeQueue(e.sharedBuffer)}_handleMessage(e){switch(e.data.command){case Command.Initialize:this._initialize(e.data.payload),this._state=State.StandBy;break;case Command.Start:this._state=State.Running;break;case Command.Stop:this._state=State.StandBy;break;case Command.Close:this._state=State.Closed;break;default:throw Error()}this.port.postMessage({agent:this._agent,state:this._state})}process(e,t){if(this._state!==State.Running)return!0;const s=t[0];return this._queue.pull(s,RENDER_QUANTUM)||console.log("[AudioSink] Failed to pull in Worklet. (underflow)"),!0}}registerProcessor("audio-sink",AudioSink);