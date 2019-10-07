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

import FreeQueue from '../../build/infra/free-queue.esm.js';
import Tracer from '../lib/tracer.esm.js';

const RenderQuantum = 128;

class IOTestConsumer extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.queue = new FreeQueue(options.processorOptions.sharedBuffer);
    this.tracer = new Tracer();
    this.active = false;
    this.port.onmessage = this._handleMessage.bind(this);
    this.port.postMessage({state: 'ready'});
  }

  process(_, outputs) {
    if (!this.active)
      return true;

    const result = this.queue.pull(outputs[0], RenderQuantum);
    this.tracer.trace1(`consumer-${result ? 'success' : 'fail'}`, currentTime);
    return true;
  }

  _handleMessage(event) {
    switch(event.data.command) {
      case 'start':
        this.active = true;
        break;
      case 'stop':
        this.active = false;
        this.port.postMessage({
          state: 'stopped',
          payload: this.tracer.getAllRecords()
        });
        break;
    }
  }
}

registerProcessor('io-test-consumer', IOTestConsumer);
