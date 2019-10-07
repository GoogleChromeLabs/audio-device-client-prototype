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

/* global sampleRate setDeviceCallback:true */

const frequency = 440.0;
const delta = 1 / sampleRate;
let now = 0.0;

const process = (input, output) => {
  for (let i = 0; i < output[0].length; ++i) {
    const value = Math.sin(2 * Math.PI * frequency * now);
    output[0][i] = value;
    now += delta;
  }
};

setDeviceCallback(process);
