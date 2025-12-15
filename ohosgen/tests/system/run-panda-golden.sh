#!/bin/bash

cur_test_case=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE=$SCRIPT_DIR/__temp__/$cur_test_case/output.txt
DIFF_FILE=$SCRIPT_DIR/__temp__/$cur_test_case/diff.txt

mkdir -p $(dirname $OUT_FILE)

bash $SCRIPT_DIR/run-panda.sh $cur_test_case > $OUT_FILE 2>&1 || {
    cat $OUT_FILE
    echo "TEST $cur_test_case FAILED: runtime error. See $OUT_FILE"
    exit 1
}
diff $SCRIPT_DIR/$cur_test_case/expected_output.txt $OUT_FILE > $DIFF_FILE || {
    cat $DIFF_FILE
    echo "TEST $cur_test_case FAILED: unexpected output. See $DIFF_FILE"
    exit 1
}
echo "TEST $cur_test_case SUCCESS"
