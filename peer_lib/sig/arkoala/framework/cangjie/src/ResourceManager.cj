/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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
package idlize

import std.binary.*
import std.math.*
import std.collection.*

type ResourceId = Int32

interface ResourceInfo {
    mut prop resource: Object
    mut prop holdersCount: Int32
}

public class ResourceHolder {
    private static var nextResourceId: ResourceId = 100 
    private var resources: HashMap<ResourceId, ResourceInfo> = HashMap<ResourceId, ResourceInfo>()
    private static var _instance: ?ResourceHolder = Option.None
    static func instance(): ResourceHolder {
        let resourceHolder = match(ResourceHolder._instance) {
            case Some(resourceHolder) => resourceHolder
            case _ => ResourceHolder()
        }
        return resourceHolder
    }

    public func hold(resourceId: ResourceId) {
        match(this.resources.get(resourceId)) {
            case Some(resource) => resource.holdersCount++
            case _ => throw Exception("Resource ${resourceId} does not exists, can not hold")
        }
    }

    public func release(resourceId: ResourceId) {
        let resource = match(this.resources.get(resourceId)) {
            case Some(resource) => resource
            case _ => throw Exception("Resource ${resourceId} does not exists, can not hold")
        }
        resource.holdersCount--
        if (resource.holdersCount <= 0) {
            this.resources.remove(resourceId)
        }
    }

    public func registerAndHold(resource: Object): ResourceId {
        let resourceId = ResourceHolder.nextResourceId + 1
        // this.resources.set(resourceId, {
        //     resource: resource,
        //     holdersCount: 1,
        // })
        return resourceId
    }

    public func get(resourceId: ResourceId): Object {
        match(this.resources.get(resourceId)) {
            case Some(resource) => return resource.resource
            case _ => throw Exception("Resource ${resourceId} does not exists")
        }
    }
}
