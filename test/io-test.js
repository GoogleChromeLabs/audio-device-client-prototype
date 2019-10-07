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

const Context = new AudioContext();

async function IOTest(parameters, completeCallback) {

  const TestOptions = {
    duration: parameters.duration,
    bufferLength: parameters.bufferLength,
    channelCount: parameters.channelCount,
    producerBlockLength: parameters.producerBlockLength,
  };

  const T = new Tracer();

  const SharedBuffer = FreeQueue.createSharedBuffer(
    TestOptions.bufferLength, TestOptions.channelCount);
  const Producer = new Worker('io-test/io-test-worker.js');
  await Context.audioWorklet.addModule('io-test/io-test-worklet.js');
  const consumerOptions = {
    outputChannelCount: [TestOptions.channelCount],
    processorOptions: {sharedBuffer: SharedBuffer},
  };
  const Consumer =
      new AudioWorkletNode(Context, 'io-test-consumer', consumerOptions);
  Consumer.connect(Context.destination);

  function initializeTest() {
    T.trace1('test-start');
    Consumer.port.onmessage = (event) => {
      Consumer.state = event.data.state;
      handleEvent(event);
    };
    Producer.onmessage = (event) => {
      Producer.state = event.data.state;
      handleEvent(event);
    };
    Consumer.port.postMessage({command: 'initialize'});
    const ProducerPayload = {
      sharedBuffer: SharedBuffer,
      options: {
        pushLength: TestOptions.producerBlockLength,
        sampleRate: Context.sampleRate,
      }
    };
    Producer.postMessage({command: 'initialize', payload: ProducerPayload});
  }

  function maybeStartTest() {
    if (Consumer.state !== 'ready' || Producer.state !== 'ready')
      return;
    Consumer.port.postMessage({command: 'start'});
    Producer.postMessage({command: 'start'});
    setTimeout(() => {
      Consumer.port.postMessage({command: 'stop'});
      Producer.postMessage({command: 'stop'});
    }, TestOptions.duration);
  }

  function maybeFinishTest() {
    if (Consumer.state !== 'stopped' || Producer.state !== 'stopped')
      return;
    Consumer.disconnect();
    Producer.terminate();
    T.trace1('test-end');
    completeCallback(prepareTestResult());
  }

  function handleEvent(event) {
    switch (event.data.state) {
      case 'ready':
        maybeStartTest();
        break;
      case 'stopped':
        T.mergeRecords(event.data.payload);
        maybeFinishTest();
        break;
      default:
        console.error('NOTREACHED');
        break;
    }
  }

  function prepareTestResult() {
    const result = {};
    result.testDuration =
        T.getRecord('test-end')[0][2] - T.getRecord('test-start')[0][2];
    result.pullSuccess = T.getRecord('consumer-success').length;
    result.pullFail = T.getRecord('consumer-fail').length;
    result.pullSuccessRate =
        result.pullSuccess / (result.pullSuccess + result.pullFail) * 100;
    result.pushSuccess = T.getRecord('producer-success').length;
    result.pushFail = T.getRecord('producer-fail').length;
    result.pushSuccessRate =
        result.pushSuccess / (result.pushSuccess + result.pushFail) * 100;
    result.pushInterval =
        TestOptions.producerBlockLength / Context.sampleRate;
    return result;
  };

  initializeTest();
}
