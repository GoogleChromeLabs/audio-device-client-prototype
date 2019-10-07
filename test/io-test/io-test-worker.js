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

const Producer = {
  queue: null,
  clock: null,
  channelData: null,
  outputBuffer: null,
  sampleRate: null,
  callbackInternval: null,
  now: 0,
  delta: 0,
};

Producer.render = (now) => {
  for (let i = 0; i < Producer.channelData.length; ++i) {
    Producer.channelData[i] = Math.sin(2 * Math.PI * 440 * Producer.now) * 0.01;
    Producer.now += Producer.delta;
  }
  const result = Producer.queue.push(
      Producer.outputBuffer, Producer.channelData.length);
  T.trace1(`producer-${result ? 'success' : 'fail'}`, now);
};

Producer.initialize = (payload) => {
  Producer.queue = new FreeQueue(payload.sharedBuffer);
  Producer.channelData = new Float32Array(payload.options.pushLength);
  Producer.outputBuffer = [Producer.channelData, Producer.channelData];
  Producer.sampleRate = payload.options.sampleRate;
  Producer.delta = 1 / payload.options.sampleRate;
  Producer.callbackInternval =
      payload.options.pushLength / payload.options.sampleRate * 1000;
  Producer.clock = new FreeClock(Producer.callbackInternval, Producer.render);
  self.postMessage({state: 'ready'});
};


self.onmessage = (event) => {
  switch(event.data.command) {
    case 'initialize':
      Producer.initialize(event.data.payload);
      break;
    case 'start':
      Producer.clock.start();
      break;
    case 'stop':
      Producer.clock.stop();
      self.postMessage({state: 'stopped', payload: T.getAllRecords()});
      break;
  }
};
