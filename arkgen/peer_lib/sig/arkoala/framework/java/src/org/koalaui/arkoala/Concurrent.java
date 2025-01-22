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

import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.BlockingQueue;
import java.util.ArrayList;
import java.util.Random;
import java.util.function.Consumer;
import java.util.function.Function;

class Node {
    int kind;
    int id;
    static AtomicInteger currentId = new AtomicInteger(1);
    ArrayList<Node> children = new ArrayList<Node>(0);
    Node(int kind, int id) {
        this.id = id == 0 ? Node.currentId.getAndIncrement() : id;
        this.kind = kind;
    }
    static Node create(int kind) {
        return new Node(kind, 0);
    }
    static Node createWithCost(int kind, long cost) {
        payCost(cost);
        return new Node(kind, 0);
    }
    void insertChildAfter(Node child, Node sibling) {
        if (sibling == null) {
            this.children.add(child);
        } else {
            for (int i = 0; i < children.size(); i++) {
                if (children.get(i) == sibling) {
                    this.children.add(i, child);
                    break;
                }
            }
        }
    }
    void insertChildAfterWithCost(Node child, Node sibling, long cost) {
        payCost(cost);
        insertChildAfter(child, sibling);
    }

    void removeChild(Node child) {
        this.children.remove(child);
    }
    void removeChildWithCost(Node child, long cost) {
        payCost(cost);
        removeChild(child);
    }

    void dump() {
        dumpWithIndent(0);
    }
    private void dumpWithIndent(int indent) {
        for (int i = 0; i < indent; i++) {
            System.out.print("  ");
        }
        System.out.println("->" + this.kind + " [" + this.id + "]");
        for (Node child : children) {
            child.dumpWithIndent(indent + 1);
        }
    }

    static volatile long sink = 0;
    static void payCost(long count) {
        long store = 17;
        for (long i = 0; i < count * 1000; i++) {
            store += i * 79 % 31;
        }
        sink += store;
    }
}

interface WorkerTask<T> {
    WorkerResult<T> run(Worker worker);
}

class WorkerResult<T> {
    static WorkerResult<Object> Empty = new WorkerResult<Object>(null);

    T result;
    WorkerResult(T result) {
        this.result = result;
    }
    T get() {
        return this.result;
    }
}

class CreateTreeTask implements WorkerTask<Node> {
    Function<Integer, Node> builder;
    int breadth;
    int depth;
    CreateTreeTask(Function<Integer, Node> builder, int breadth, int depth) {
        this.builder = builder;
        this.breadth = breadth;
        this.depth = depth;
    }
    public WorkerResult<Node> run(Worker worker) {
        return new WorkerResult<Node>(makeLayer(breadth, depth));
    }
    Node makeLayer(int breadth, int depth) {
        Node layer = builder.apply(depth);
        if (depth > 1) {
            for (int i = 0; i < breadth; i++) {
                Node child = makeLayer(breadth, depth - 1);
                layer.insertChildAfterWithCost(child, null, 10);
            }
        }
        return layer;
    }
}

class StopTask implements WorkerTask<Object> {
    public WorkerResult<Object> run(Worker worker) {
        worker.stop();
        return WorkerResult.Empty;
    }
}

interface ResultConsumer {
    public void provide(WorkerResult<Object> result);
}

class Worker implements Runnable {
    final BlockingQueue<WorkerTask<Object>> queue = new LinkedBlockingDeque<WorkerTask<Object>>();
    volatile boolean stopped = false;
    ResultConsumer consumer;
    Random random;
    Worker(int index, ResultConsumer consumer) {
        this.random = new Random(index * 239);
        this.consumer = consumer;
    }
    public void run() {
          try {
            while (!stopped) {
                consumer.provide(queue.take().run(this));
            }
        } catch (InterruptedException e) {}
    }
    public void stop() {
        this.stopped = true;
    }
    public void add(WorkerTask<Object> task) {
        this.queue.add(task);
    }
}

public class Concurrent implements ResultConsumer {
    public static void main(String[] args) {
        new Concurrent(6, 7, 4).start();
    }
    int breadth;
    int depth;
    int numWorkers;
    Worker[] workers;
    final BlockingQueue<WorkerResult<Object>> queue = new LinkedBlockingDeque<WorkerResult<Object>>();

    Concurrent(int breadth, int depth, int numWorkers) {
        this.breadth = breadth;
        this.depth = depth;
        this.numWorkers = numWorkers;
        this.workers = new Worker[numWorkers];
        for (int i = 0; i < numWorkers; i++) {
            Worker worker = new Worker(i, this);
            this.workers[i] = worker;
            new Thread(worker).start();
        }
    }

    <T> void map(Function<Integer, WorkerTask<T>> supplier, int count) {
        for (int i = 0; i < count; i++) {
            this.workers[i % numWorkers].add((WorkerTask<Object>)supplier.apply(i));
        }
    }

    <T> void reduce(Consumer<ArrayList<WorkerResult<T>>> consumer, int count) {
        var result = new ArrayList<WorkerResult<T>>(count);
        for (int i = 0; i < count; i++) {
            try {
                result.add((WorkerResult<T>)this.queue.take());
            } catch (InterruptedException e) {}
        }
        consumer.accept(result);
    }

    void start() {
        Node root = Node.create(1);
        mapReduce("create", breadth,
            (index) -> new CreateTreeTask((id) -> Node.createWithCost(2 + id, 100), breadth, depth - 1),
            (result) -> {
                for (var r : result)
                    root.insertChildAfterWithCost(r.get(), null, 10);
            }
        );
        // root.dump();
        System.out.println(Node.currentId.get() + " nodes created");
        mapReduce("stop", numWorkers,
            (index) -> new StopTask(),
            (result) -> {}
        );
    }

    <T> void mapReduce(
        String name,
        int count,
        Function<Integer, WorkerTask<T>> supplier,
        Consumer<ArrayList<WorkerResult<T>>> consumer
     ) {
        long start = System.nanoTime();
        map(supplier, count);
        reduce(consumer, count);
        long end = System.nanoTime();
        System.out.println(name + ": " + (end - start) / 1000 + "us");
    }

    public void provide(WorkerResult<Object> result) {
        this.queue.add(result);
    }
}
