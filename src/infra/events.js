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

// Various event-related identifiers and commands

// The type of Agents: Controller(main thread), Consumer(worklet),
// Producer(worker)
const Agent = {
  Controller: 'controller',
  Consumer: 'consumer',
  Producer: 'producer',
};

// The state of an Agent
const State = {
  Pending: 'pending',
  StandBy: 'standby',
  Running: 'running',
  Closed: 'closed',
};

// The command from Controller to Agents
const Command = {
  Initialize: 'initialize',
  LoadScript: 'loadscript',
  Start: 'start',
  Stop: 'stop',
  Close: 'close',
};
