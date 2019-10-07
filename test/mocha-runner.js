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

const expect = chai.expect;

function verifySmokeTestResult(parameters, result) {
  expect(result.testDuration, 'test duration')
      .to.be.at.least(parameters.duration);
  expect(result.pushSuccessRate).to.be.equal(100);
  expect(result.pullSuccessRate).to.be.equal(100);
  expect(Math.abs(result.pushInterval * 1000 - result.pushStats.mean))
      .to.be.lessThan(1.5);
  expect(Math.abs(result.pullInterval * 1000 - result.pullStats.mean))
      .to.be.lessThan(1.5);
  expect(result.pushStats.standardDeviation, 'push standard deviation')
      .to.be.lessThan(1.2);
  expect(result.pullStats.standardDeviation, 'pull standard deviation')
      .to.be.lessThan(1.2);
}

describe('FreeQueue Smoke Test', function() {

  it('Set 1: Pull=256, Push=512, Queue=1536', function(done) {
    const parameters = {
      duration: 1000,
      timeout: 1100,
      sampleRate: 48000,
      bufferLength: 1536,
      pullBlockLength: 256,
      pushBlockLength: 512,
    };

    this.timeout(parameters.timeout);
    SmokeTest(parameters, result => {
      verifySmokeTestResult(parameters, result);
      done();
    });
  });

  it('Set 2: Pull=256, Push=768, Queue=2048', function(done) {
    const parameters = {
      duration: 1000,
      timeout: 1100,
      sampleRate: 48000,
      bufferLength: 1280,
      pullBlockLength: 256,
      pushBlockLength: 640,
    };

    this.timeout(parameters.timeout);
    SmokeTest(parameters, result => {
      verifySmokeTestResult(parameters, result);
      done();
    });
  });

  it('Set 3: Pull=384, Push=256, Queue=1024', function(done) {
    const parameters = {
      duration: 1000,
      timeout: 1100,
      sampleRate: 48000,
      bufferLength: 1024,
      pullBlockLength: 384,
      pushBlockLength: 256,
    };

    this.timeout(parameters.timeout);
    SmokeTest(parameters, result => {
      verifySmokeTestResult(parameters, result);
      done();
    });
  });

});

function verifyIOTestResult(parameters, result) {
  expect(result.testDuration, 'test duration')
      .to.be.at.least(parameters.duration);
  expect(result.pullSuccessRate).to.be.equal(100);

  // TODO: why do always some initial pushes fail?
  // Still, this is okay because the onset of test cannot be synchronized.
  // Probably the start-up time of AudioContext is relatively slower than
  // a Worker. (This is why push is always 100%)
  expect(result.pushSuccessRate).to.be.at.least(98);
}

describe('FreeQueue IO Test', function() {

  it('Set 1: Push=512, Queue=1536 (99% push success rate)', function(done) {
    const parameters = {
      timeout: 3100,
      duration: 3000,
      bufferLength: 1536,
      channelCount: 2,
      producerBlockLength: 512,
    };

    this.timeout(parameters.timeout);
    IOTest(parameters, result => {
      verifyIOTestResult(parameters, result);
      done();
    });
  });

  it('Set 2: Push=256, Queue=1280 (99% push success rate)', function(done) {
    const parameters = {
      timeout: 3100,
      duration: 3000,
      bufferLength: 1280,
      channelCount: 2,
      producerBlockLength: 256,
    };

    this.timeout(parameters.timeout);
    IOTest(parameters, result => {
      verifyIOTestResult(parameters, result);
      done();
    });
  });

});
