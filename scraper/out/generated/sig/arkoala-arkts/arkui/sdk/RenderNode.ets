/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Size, Vector2, Frame, Vector3, Matrix4, Edges, Corners, ShapeMask, ShapeClip, LengthMetricsUnit, DrawContext } from "./Graphics"
import { BorderStyle } from "./component/enums"
export declare class RenderNode {
    constructor()
    set backgroundColor(val:number);
    get backgroundColor():number;
    set clipToFrame(val:boolean);
    get clipToFrame():boolean;
    set opacity(val:number);
    get opacity():number;
    set size(val:Size);
    get size():Size;
    set position(val:Vector2);
    get position():Vector2;
    set frame(val:Frame);
    get frame():Frame;
    set pivot(val:Vector2);
    get pivot():Vector2;
    set scale(val:Vector2);
    get scale():Vector2;
    set translation(val:Vector2);
    get translation():Vector2;
    set rotation(val:Vector3);
    get rotation():Vector3;
    set transform(val:Matrix4);
    get transform():Matrix4;
    set shadowColor(val:number);
    get shadowColor():number;
    set shadowOffset(val:Vector2);
    get shadowOffset():Vector2;
    set label(val:string);
    get label():string;
    set shadowAlpha(val:number);
    get shadowAlpha():number;
    set shadowElevation(val:number);
    get shadowElevation():number;
    set shadowRadius(val:number);
    get shadowRadius():number;
    set borderStyle(val:Edges<BorderStyle>);
    get borderStyle():Edges<BorderStyle>;
    set borderWidth(val:Edges<number>);
    get borderWidth():Edges<number>;
    set borderColor(val:Edges<number>);
    get borderColor():Edges<number>;
    set borderRadius(val:Corners<number>);
    get borderRadius():Corners<number>;
    set shapeMask(val:ShapeMask);
    get shapeMask():ShapeMask;
    set shapeClip(val:ShapeClip);
    get shapeClip():ShapeClip;
    set markNodeGroup(val:boolean);
    get markNodeGroup():boolean;
    set lengthMetricsUnit(val:LengthMetricsUnit);
    get lengthMetricsUnit():LengthMetricsUnit;
    appendChild(node: RenderNode): void
    insertChildAfter(child: RenderNode, sibling: RenderNode | undefined): void
    removeChild(node: RenderNode): void
    clearChildren(): void
    getChild(index: number): RenderNode | undefined
    getFirstChild(): RenderNode | undefined
    getNextSibling(): RenderNode | undefined
    getPreviousSibling(): RenderNode | undefined
    draw(context: DrawContext): void
    invalidate(): void
    dispose(): void
}
