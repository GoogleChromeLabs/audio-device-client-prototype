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

import { Agent, State, Command } from './infra/events.esm.js';
import FreeQueue from './infra/free-queue.esm.js';

const DEFAULT_BUFFER_SIZE = 256;
const DEFAULT_CHANNEL_COUNT = 2;
const CLIENT_GLOBAL_SCOPE_FILE = 'client-global-scope.js';
const AUDIO_SINK_FILE = 'audio-sink.js';

let LIBRARY_PATH = '';
function SET_LIBRARY_PATH(relativeLibraryPath) {
  const url = new URL(relativeLibraryPath, window.location.href);
  LIBRARY_PATH = url.href;
}

/**
 * Audio Device Client API
 */
class AudioDeviceClient {
  /**
   * @constructor
   * @param {object} constraints
   * @param {number} constraints.callbackBufferSize
   * @param {number} constraints.channelCount
   */
  constructor(constraints) {
    this._context = new AudioContext();
    this._agent = Agent.Controller;
    this._state = State.Pending;
    
    this._constraints = this._sanitizeConstraints(constraints);

    this._context.destination.channelCount = constraints.channelCount;
    this._context.destination.channelCountMode = 'explicit';
    this._context.destination.channelInterpretation = 'discrete';    
  }

  _sanitizeConstraints(constraints) {
    if (!constraints)
      constraints = {};

    return {
      callbackBufferSize: constraints.callbackBufferSize || DEFAULT_BUFFER_SIZE,
      channelCount: constraints.channelCount || DEFAULT_CHANNEL_COUNT,
      sampleRate: constraints.sampleRate || this._context.sampleRate,
    };
  }

  async initialize() {
    this._sharedBuffer = 
        FreeQueue.createSharedBuffer(this._constraints.callbackBufferSize * 4,
                                     this._constraints.channelCount);
    
    try {
      await this._context.audioWorklet.addModule(
          LIBRARY_PATH + AUDIO_SINK_FILE);
    } catch(error) {
      throw error;
    }

    this._workletNode = new AudioWorkletNode(this._context, 'audio-sink', {
      outputChannelCount: [this._constraints.channelCount],
    });
    this._workletNode.connect(this._context.destination);
    this._workletNode.port.onmessage = this._handleMessage.bind(this);
    this._workletNode.agent = Agent.Consumer;
    this._workletNode.state = State.Pending;

    this._worker = new Worker(LIBRARY_PATH + CLIENT_GLOBAL_SCOPE_FILE);
    this._worker.onmessage = this._handleMessage.bind(this);
    this._worker.agent = Agent.Producer;
    this._worker.state = State.Pending;

    this._notifyBackends(Command.Initialize, {
      constraints: this._constraints,
      sharedBuffer: this._sharedBuffer
    });
  }

  _notifyBackends(command, payload) {
    const message = {command, payload};
    this._workletNode.port.postMessage(message);
    this._worker.postMessage(message);
  }

  _maybeChangeControllerState(agentState) {
    if (this._workletNode.state === agentState &&
        this._worker.state === agentState) {
      this._state = agentState;
    }
  }

  _handleMessage(event) {
    const agent = event.data.agent;
    const state = event.data.state;
    switch (agent) {
      case Agent.Consumer:
        this._workletNode.state = state;
        this._maybeChangeControllerState(state);
        break;
      case Agent.Producer:
        this._worker.state = state;
        this._maybeChangeControllerState(state);
        break;
      default:
        throw Error();
    }
  }

  _untilMessageReceived() {
    return new Promise(resolve => {
      this._worker.addEventListener(
          'message', (event) => resolve(), {once: true});
    })
  }

  /**
   * @public
   * @param {string} scriptUrl An url of script file for AudioDeviceGlobalScope.
   */
  async addModule(scriptUrl) {
    // if (this._state === AgentState.StandBy)
    //   throw Error();

    const userCodeUrl = new URL(scriptUrl, window.location.href);
    this._worker.postMessage({
      command: Command.LoadScript,
      payload: {scriptPath: userCodeUrl.href}
    });

    await this._untilMessageReceived();
  }

  /**
   * @public
   */
  start() {
    if (this._state !== State.StandBy)
      throw Error();
    
    this._notifyBackends(Command.Start);
  }

  /**
   * @public
   */
  stop() {
    if (this._state !== State.Running)
      throw Error;
    
    this._notifyBackends(Command.Stop);
  }

  /**
   * @public
   */
  close() {
    if (this._state === State.Closed)
      throw Error;
    
    this._notifyBackends(Command.Close);
  }
}

const requestAudioDeviceClient = async (constraints) => {
  const client = new AudioDeviceClient(constraints);
  await client.initialize();
  return client;
};

navigator.mediaDevices.requestAudioDeviceClient = requestAudioDeviceClient;

export { requestAudioDeviceClient, SET_LIBRARY_PATH };