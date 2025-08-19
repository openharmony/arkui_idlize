/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

package org.koalaui.arkoala;

import java.util.function.Consumer;

public class IncrementalNode {
    private boolean _disposed = false;
    private IncrementalNode _child;
    private IncrementalNode _prev;
    private IncrementalNode _next;
    private IncrementalNode _parent;
    private IncrementalNode _incremental;

    /**
     * This callback is called when a child node is added to this parent.
     */
    protected Consumer<IncrementalNode> onChildInserted;

    /**
     * This callback is called when a child node is removed from this parent.
     */
    protected Consumer<IncrementalNode> onChildRemoved;

    /**
     * This kind can be used to distinguish nodes.
     * @see isKind
     */
    public final int kind;

    /**
     * @param kind - the kind of this instance
     * @see PrimeNumbers
     */
    IncrementalNode(int kind) {
        this.kind = kind;
    }

    /**
     * Use this method instead of standard instanceof for the sake of speed and reliability.
     * @param kind - a kind of this or parent instance to check against
     * @returns `true` if this node is an instance of the expected kind
     * @see PrimeNumbers
     */
    public boolean isKind(int kind) {
        return this.kind % kind == 0;
    }

    /**
     * @returns `true` if this node should no longer be used
     */
    public boolean disposed() {
        return _disposed;
    }

    /**
     * This method is called to remove this node from the hierarchy.
     */
    public void dispose() {
        if (_disposed) return;
        var prev = _prev;
        var next = _next;
        var parent = _parent;
        _disposed = true;
        _child = null;
        if (prev != null) {
            _prev = null;
            prev._next = next;
        }
        if (next != null) {
            _next = null;
            next._prev = prev;
        }
        if (parent != null) {
            _parent = null;
            if (parent._child == this) {
                parent._child = next;
            }

            if (parent.onChildRemoved != null) {
                parent.onChildRemoved.accept(this);
            }
        }
    }

    /**
     * @returns a parent node if it is exist
     */
    public IncrementalNode parent() {
        return _parent;
    }

    /**
     * @returns text representation of the node
     */
    public String toString() {
        return String.format("%s: %d", getClass().getName(), kind);
    }

    /**
     * @returns text representation of a tree hierarchy starting from this node
     */
    public String toHierarchy() {
        String str = "";
        for (var node = _parent; node != null; node = node._parent) {
            str += "  ";
        }
        str += toString();
        for (var node = _child; node != null; node = node._next) {
            str += "\n" + node.toHierarchy();
        }
        return str;
    }

    /**
     * @returns the first child node contained in this node if it is exist
     */
    public IncrementalNode firstChild() {
        return _child;
    }

    /**
     * @returns the next sibling of this node if it is exist
     */
    public IncrementalNode nextSibling() {
        return _next;
    }

    /**
     * @returns the previous sibling of this node if it is exist
     */
    public IncrementalNode previousSibling() {
        return _prev;
    }

    /**
     * This method is called by the state manager
     * when the incremental update should skip several unchanged child nodes.
     * @param count - a number of child nodes to skip during the incremental update
     * @internal
     */
    public void incrementalUpdateSkip(int count) {
        if (count > 0) {
            var prev = _incremental;
            var next = prev != null ? prev._next : _child;
            while (1 < count--) {
                if (next == null) throw new Error("child node is expected here");
                next = next._next;
            }
            _incremental = next;
        }
        else throw new Error(String.format("unexpected count of child nodes to skip: %d", count));
    }

    /**
     * This method is called by the state manager
     * when the incremental update of all children of this node is completed.
     * @internal
     */
    public void incrementalUpdateDone(IncrementalNode parent) {
        if (_disposed) throw new Error("child node is already disposed");
        _incremental = null;
        if (parent != null) {
            var prev = parent._incremental;
            var next = prev != null ? prev._next : parent._child;
            if (_parent != null) {
                if (_parent != parent) throw new Error("child node belongs to another parent");
                if (this != next) throw new Error("child node is not expected here");
                parent._incremental = this;
            } else {
                parent._incremental = this;
                _prev = prev;
                _next = next;
                _parent = parent;
                if (next != null) next._prev = this;
                if (prev != null) prev._next = this;
                else parent._child = this;

                if (parent.onChildInserted != null) {
                    parent.onChildInserted.accept(this);
                }
            }
        }
    }
}
