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

/**
 * Tests the performance and stability of FreeQueue. It sets up two worker
 * agents to pull (push) data from (to) the queue. The task interval for each
 * operation is independent to each other.
 *
 * The success criteria is:
 * - 100% pull/push success rate.
 * - The diff between the measured mean and given interval timing < 1.5 ms.
 * - The standard deviation of the measured intervals < 1.2.
 */
function SmokeTest(parameters, completeCallback) {

  const TestOptions = {
    duration: parameters.duration,
    sampleRate: parameters.sampleRate,
    bufferLength: parameters.bufferLength,
    bufferChannelCount: 2,
  };

  const ConsumerOptions = {
    label: 'consumer',
    blockLength: parameters.pullBlockLength,
    sampleRate: TestOptions.sampleRate,
  };

  const ProducerOptions = {
    label: 'producer',
    blockLength: parameters.pushBlockLength,
    sampleRate: TestOptions.sampleRate,
  };

  const T = new Tracer();
  const Consumer = new Worker('smoke-test/smoke-test-agent.js');
  const Producer = new Worker('smoke-test/smoke-test-agent.js');
  const SharedBuffer = FreeQueue.createSharedBuffer(
      TestOptions.bufferLength, TestOptions.bufferChannelCount);

  function initializeTest() {
    T.trace1('test-start');
    Consumer.onmessage = (event) => {
      Consumer.state = event.data.state;
      handleAgentEvent(event);
    };
    Producer.onmessage = (event) => {
      Producer.state = event.data.state;
      handleAgentEvent(event);
    };
    Consumer.postMessage({
        command: 'initialize',
        payload: {sharedBuffer: SharedBuffer, options: ConsumerOptions}});
    Producer.postMessage({
        command: 'initialize',
        payload: {sharedBuffer: SharedBuffer, options: ProducerOptions}});
  }

  function startAgents() {
    Consumer.postMessage({command: 'start'});
    Producer.postMessage({command: 'start'});
  }

  function stopAgents() {
    Consumer.postMessage({command: 'stop'});
    Producer.postMessage({command: 'stop'});
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
    result.pushInterval = ProducerOptions.blockLength / TestOptions.sampleRate;
    result.pullInterval = ConsumerOptions.blockLength / TestOptions.sampleRate;
    result.pushStats = Tracer.getStat(T.getRecord('producer-interval'), 1);
    result.pullStats = Tracer.getStat(T.getRecord('consumer-interval'), 1);
    return result;
  }

  function handleAgentEvent(event) {
    switch (event.data.state) {
      case 'ready':
        if (Consumer.state === 'ready' && Producer.state === 'ready') {
          startAgents();
          setTimeout(stopAgents, TestOptions.duration);
        }
        break;
      case 'stopped':
        T.mergeRecords(event.data.payload);
        if (Consumer.state === 'stopped' && Producer.state === 'stopped') {
          T.trace1('test-end');
          Consumer.terminate();
          Producer.terminate();
          completeCallback(prepareTestResult());
        }
        break;
      default:
        console.error('NOTREACHED');
        break;
    }
  }

  initializeTest();
}
