/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as arkts from "@koalaui/libarkts"
import * as fs from "fs"
import * as path from "path"

export class PlotVisitor extends arkts.AbstractVisitor {
    currentFile: string = ""
    currentDeps: string[] = []
    deps = new Map<string, string[]>()
    names = new Map<string, string>()
    lastNameIndex = 1
    constructor(private baseDir: string) {
        super()
    }
    visitor(node: arkts.arkts.AstNode, options?: any): arkts.arkts.AstNode {
        if (arkts.isETSModule(node)) {
            this.currentFile = node.program?.absoluteName!
            this.currentDeps = []
            this.deps.set(this.translate(path.relative(this.baseDir, this.currentFile)), this.currentDeps)
            return this.visitEachChild(node)
        }
        if (arkts.isImportDeclaration(node)) {
            this.recordDepenency(this.currentFile, node.source!.toString)
        }
        return node
    }

    private translate(from: string): string {
        return from
            .replace("@internal/component/ets/", "arkui/component/")
            .replace("@internal/global/", "api/global/")
            .replace(/^global/, "api/global")

    }

    private recordDepenency(from: string, to: string) {
        const toAbsPath = path.join(path.dirname(from), `${to}.d.ets`)
        const toRel = this.translate(path.relative(this.baseDir, toAbsPath))
        // console.log(`${fromRel} -> ${toRel}`)
        this.currentDeps.push(toRel)
    }

    condense(input: Map<string, string[]>): Map<string, string[]> {
        // Step 1: First DFS to get finishing times
        const visited = new Set<string>();
        const stack: string[] = [];

        const dfs1 = (node: string) => {
            if (visited.has(node)) return;
            visited.add(node);

            const neighbors = input.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs1(neighbor);
                }
            }
            stack.push(node);
        };

        // Perform first DFS on all nodes
        for (const node of input.keys()) {
            if (!visited.has(node)) {
                dfs1(node);
            }
        }

        // Step 2: Build reversed graph
        const reversedGraph = new Map<string, string[]>();

        for (const [node, neighbors] of input.entries()) {
            if (!reversedGraph.has(node)) {
                reversedGraph.set(node, []);
            }

            for (const neighbor of neighbors) {
                if (!reversedGraph.has(neighbor)) {
                    reversedGraph.set(neighbor, []);
                }
                reversedGraph.get(neighbor)!.push(node);
            }
        }

        // Step 3: Second DFS on reversed graph in order of finishing times
        const visited2 = new Set<string>();
        const components: string[][] = [];

        const dfs2 = (node: string, component: string[]) => {
            if (visited2.has(node)) return;
            visited2.add(node);
            component.push(node);

            const neighbors = reversedGraph.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited2.has(neighbor)) {
                    dfs2(neighbor, component);
                }
            }
        };

        // Process nodes in reverse order of finishing times
        while (stack.length > 0) {
            const node = stack.pop()!;
            if (!visited2.has(node)) {
                const component: string[] = [];
                dfs2(node, component);
                components.push(component);
            }
        }

        // Step 4: Build condensed graph
        const nodeToComponent = new Map<string, string>();
        const result = new Map<string, string[]>();

        // Map each node to its component representative
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const representative = component[0]; // Use first node as representative

            for (const node of component) {
                nodeToComponent.set(node, representative);
            }

            // Initialize empty dependencies for the component
            result.set(representative, []);
        }

        // Build edges between components
        for (const [node, neighbors] of input.entries()) {
            const fromComponent = nodeToComponent.get(node)!;

            for (const neighbor of neighbors) {
                const toComponent = nodeToComponent.get(neighbor)!;

                // Add edge only if it's between different components
                if (fromComponent !== toComponent) {
                    const currentDeps = result.get(fromComponent)!;
                    if (!currentDeps.includes(toComponent)) {
                        currentDeps.push(toComponent);
                    }
                }
            }
        }

        return result;
    }
    dump(outFile: string) {
        const lines = []
        lines.push('digraph Deps {')
        this.deps.forEach((imports, file) => {
            imports.forEach(it => {
                lines.push(`"${this.name(file)}" -> "${this.name(it)}";`)
            })
        })
        lines.push('}')
        fs.writeFileSync(outFile, lines.join('\n'))
        const linesLog: string[] = []
        const inputs = new Map<string, string[]>()
        const outputs = new Map<string, string[]>()
        this.deps.forEach((imports, file) => {
            imports.forEach(it => {
                let i1 = inputs.get(file)
                if (!i1) {
                    i1 = []
                    inputs.set(file, i1)
                }
                i1.push(it)
                let i2 = outputs.get(it)
                if (!i2) {
                    i2 = []
                    outputs.set(it, i2)
                }
                i2.push(file)
            })
        })
        const byInputs = Array.from(inputs.keys()).sort((a, b) => (inputs.get(b)?.length ?? 0) - (inputs.get(a)?.length ?? 0))
        const byOutputs = Array.from(outputs.keys()).sort((a, b) => (outputs.get(b)?.length ?? 0) - (outputs.get(a)?.length ?? 0))
        byInputs.forEach(it => {
            linesLog.push(`${this.name(it)}: ${it} has ${inputs.get(it)?.length} deps`)
        })
        byOutputs.forEach(it => {
            linesLog.push(`${this.name(it)}: ${it} is dep of ${outputs.get(it)?.length}`)
        })
        const condensed = this.condense(this.deps)
        condensed.forEach((value, key) => {
            linesLog.push(`${key} -> ${value.join(',')}`)
        })
        fs.writeFileSync(`${outFile}.log`, linesLog.join('\n'))
    }
    name(orig: string): string {
        const name = this.names.get(orig)
        if (name) return name
        this.lastNameIndex++
        this.names.set(orig, this.lastNameIndex.toString())
        return this.lastNameIndex.toString()
    }
}