// Test file for throw Error breaking
function test() {
    if (condition1) {
        if (condition2) {
            if (condition3) {
                // This line is 135 characters with REAL 16-space indent (4 levels * 4 spaces)
throw new Error( 'One of the branches for minFontSizeTmpBuf_BufU has to be chosen through deserialisation. .........' )
            }
        }
    }
}

