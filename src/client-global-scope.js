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

importScripts(
    './infra/free-queue.js', './infra/free-clock.js', './infra/events.js');

let agent = Agent.Producer;
let state = State.Pending;

let clock;
let queue;
let channelData;
let outputBuffer;
let deviceCallbackFunction;

self.sampleRate = null;

const initialize = (payload) => {
  queue = new FreeQueue(payload.sharedBuffer);
  channelData = new Float32Array(payload.constraints.callbackBufferSize);

  // This is a fixed stereo, but should be configurable.
  outputBuffer = [channelData, channelData];

  self.sampleRate = payload.constraints.sampleRate;
  const callbackIntervalInMS = channelData.length / self.sampleRate * 1000;
  clock = new FreeClock(callbackIntervalInMS, render);
};

const setDeviceCallback = (userCallbackFunction) => {
  deviceCallbackFunction = userCallbackFunction;
};

const loadScript = (payload) => {
  self.importScripts(payload.scriptPath);
};

const render = () => {
  deviceCallbackFunction(null, outputBuffer);
  const didPushOkay = queue.push(outputBuffer, channelData.length);
  if (!didPushOkay) {
    // eslint-disable-next-line no-console
    console.log('[ClientGlobalScope] Failed to push in Worker. (overflow)');
  }
};

self.onmessage = (event) => {
  switch (event.data.command) {
    case Command.Initialize:
      initialize(event.data.payload);
      state = State.StandBy;
      break;
    case Command.LoadScript:
      loadScript(event.data.payload);
      break;
    case Command.Start:
      clock.start();
      state = State.Running;
      break;
    case Command.Stop:
      clock.stop();
      state = State.StandBy;
      break;
    case Command.Close:
      clock.stop();
      state = State.Closed;
      break;
  }

  self.postMessage({agent, state});
};

// The device global scope is ready for operation.
self.postMessage({agent, state});
