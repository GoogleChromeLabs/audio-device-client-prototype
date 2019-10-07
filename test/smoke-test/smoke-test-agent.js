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

importScripts('../../build/infra/free-queue.js',
              '../../build/infra/free-clock.js');
importScripts('../lib/tracer.js');

const T = new Tracer();
const Agent = {};
const EventHandlers = {
  initialize: (payload) => {
    const label = payload.options.label;
    const blockLength = payload.options.blockLength;
    const queue = new FreeQueue(payload.sharedBuffer);
    const tempBuffer = new Float32Array(blockLength);
    const callbackInterval = blockLength / payload.options.sampleRate * 1000;

    const runTask = (label === 'consumer')
        ? () => { return queue.pull([tempBuffer, tempBuffer], blockLength); }
        : () => { return queue.push([tempBuffer, tempBuffer], blockLength); }

    let lastTimestamp = performance.now();
    const callbackFunction = (timestamp) => {
      T.trace1(`${label}-interval`, timestamp - lastTimestamp);
      const result = runTask() ? 'success' : 'fail';
      T.trace2(`${label}-${result}`, result, timestamp);
      lastTimestamp = timestamp;
    };

    Agent.clock = new FreeClock(callbackInterval, callbackFunction);
    self.postMessage({state: 'ready'});
  },

  start: () => {
    Agent.clock.start();
  },

  stop: () => {
    Agent.clock.stop();
    self.postMessage({state: 'stopped', payload: T.getAllRecords()});
  }
};

self.onmessage = (event) => {
  typeof EventHandlers[event.data.command] === 'function'
      ? EventHandlers[event.data.command](event.data.payload)
      : console.error('Undefined command');
};
