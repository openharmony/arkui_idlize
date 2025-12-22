/*
 * Test runner registration script for codecheck-fixer
 * Configures ts-node to run TypeScript tests with Mocha
 */

const tsNode = require("ts-node")
const path = require("path")

tsNode.register({
    files: true,
    // If uncommented, running tests doesn't perform type checks.
    // transpileOnly: true,
    project: path.resolve("tests", "tsconfig.json")
})

