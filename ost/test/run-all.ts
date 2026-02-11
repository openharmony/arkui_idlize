/**
 * Simple test runner that discovers and runs all test files.
 * Uses Node.js built-in modules only (no external dependencies).
 */

import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

function findTestFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function runTestFile(filePath: string): boolean {
  console.log(`\n=== Running ${filePath} ===`);
  try {
    execSync(`node --enable-source-maps "${filePath}"`, { stdio: 'inherit' });
    console.log(`✅ ${filePath} passed`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} failed`);
    return false;
  }
}

function main() {
  // Find compiled test files in build/test
  const testDir = resolve('.');

  if (!readdirSync(testDir, { withFileTypes: true }).length) {
    console.error('No test files found. Run npm run test:compile first.');
    process.exit(1);
  }

  const testFiles = findTestFiles(testDir);

  if (testFiles.length === 0) {
    console.error('No test files found. Run npm run test:compile first.');
    process.exit(1);
  }

  console.log(`Found ${testFiles.length} test file(s):`);
  testFiles.forEach(file => console.log(`  - ${file}`));

  let passed = 0;
  let failed = 0;

  for (const file of testFiles) {
    const success = runTestFile(file);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
