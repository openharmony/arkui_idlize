# Format Fixtures Testing

This document describes the formatting test system using fixture files.

## Structure

```
tests/fixtures/
├── input/          # Input files for tests
│   ├── ts/         # TypeScript files
│   ├── ets/        # ArkTS/ETS files
│   └── cpp/        # C++ files
├── expected/       # Expected formatting results (version controlled)
│   ├── ts/
│   ├── ets/
│   └── cpp/
└── output/         # Actual results (generated, in .gitignore)
    ├── ts/
    ├── ets/
    └── cpp/
```

## Workflow

### 1. Adding New Test Files

Add a file to the appropriate `input/` subdirectory:

```bash
# Example: add a new ETS file
cp my-test-file.ets tests/fixtures/input/ets/
```

### 2. Running Tests

```bash
npm test
```

On first run:
- Tests read files from `input/`
- Format them via Orchestrator
- Save results to `output/`
- If `expected/` file doesn't exist — print warning (test doesn't fail)
- If `expected/` file exists — compare with `output/` (test fails on mismatch)

### 3. Reviewing Results

Review formatted files in `output/`:

```bash
# View a single file
cat tests/fixtures/output/ets/my-test-file.ets

# Compare with original
diff tests/fixtures/input/ets/my-test-file.ets \
     tests/fixtures/output/ets/my-test-file.ets

# Compare with expected (if already exists)
diff tests/fixtures/expected/ets/my-test-file.ets \
     tests/fixtures/output/ets/my-test-file.ets
```

### 4. Updating Expected Files

If formatting results are correct, copy them to `expected/`:

```bash
./tests/scripts/update-expected.sh
```

The script will:
- Ask for confirmation
- Copy all files from `output/` to `expected/`
- Display the number of files copied

**Alternative:** manual copy for individual files:

```bash
cp tests/fixtures/output/ets/my-test-file.ets \
   tests/fixtures/expected/ets/my-test-file.ets
```

### 5. Committing Changes

Add new/updated files to git:

```bash
git add tests/fixtures/input/ets/my-test-file.ets
git add tests/fixtures/expected/ets/my-test-file.ets
git commit -s -m "test: add formatting fixture for my-test-file.ets"
```

## Debugging

### Tests Fail with Differences

1. Check the diff:
   ```bash
   diff tests/fixtures/output/ets/file.ets tests/fixtures/expected/ets/file.ets
   ```

2. Action options:
   - **If output is correct:** update expected via `update-expected.sh`
   - **If output is wrong:** fix the formatting logic
   - **If both variants are needed:** might be a regression

### Cleaning Output Directory

Output is automatically cleaned before each test run.

Manual cleanup:
```bash
rm -rf tests/fixtures/output
```

## Examples

### Add New TypeScript Test

```bash
# 1. Create input file
echo "const x=1;const y=2;" > tests/fixtures/input/ts/simple-vars.ts

# 2. Run tests
npm test

# 3. Check result
cat tests/fixtures/output/ts/simple-vars.ts

# 4. If correct - update expected
./tests/scripts/update-expected.sh

# 5. Commit
git add tests/fixtures/input/ts/simple-vars.ts
git add tests/fixtures/expected/ts/simple-vars.ts
git commit -s -m "test: add simple-vars formatting fixture"
```

### Update Expected After Formatter Changes

```bash
# 1. Run tests (will fail with differences)
npm test

# 2. Verify new output is correct
diff tests/fixtures/expected/ets/file.ets tests/fixtures/output/ets/file.ets

# 3. Update all expected
./tests/scripts/update-expected.sh

# 4. Run tests again (should pass)
npm test

# 5. Commit updated expected
git add tests/fixtures/expected/
git commit -s -m "test: update expected fixtures after formatter improvement"
```

