/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare enum GesturePriority {

  NORMAL = 0,
  PRIORITY = 1,
}

declare enum GestureMask {

  Normal,
  IgnoreInternal,
}

interface GestureInterface<T> {

  tag(tag: string): T;

  allowedTypes(value: Array<SourceTool>): T;
}

declare class GestureHandler<T> implements GestureInterface<T> {

  tag(tag: string): T;

  allowedTypes(types: Array<SourceTool>): T;
}


interface FingerInfo {

  id: number;
  globalX: number;
  globalY: number;
  localX: number;
  localY: number;
  displayX: number;
  displayY: number;
}

interface BaseGestureEvent extends BaseEvent {

  fingerList: FingerInfo[];
}


declare enum GestureJudgeResult {

  CONTINUE = 0,
  REJECT = 1,
}

class EventTargetInfo {
  getId(): string;
}

declare class GestureRecognizer {

  getTag(): string;

  getType(): GestureControl.GestureType;

  isBuiltIn(): boolean;

  setEnabled(isEnabled: boolean): void;

  isEnabled(): boolean;

  getState(): GestureRecognizerState;

  getEventTargetInfo(): EventTargetInfo;
}
