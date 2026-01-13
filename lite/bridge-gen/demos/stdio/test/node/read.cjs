const { fopen, fclose, fread, malloc, free, str, setb } = require('../../bundled/npm')

function main() {

    const chunk = malloc(1024n)
    const fd = fopen("test/simple.file", "r")
    if (fd === 0n) {
        console.error("CAN NOT OPEN FILE!")
        return
    }
    const size = fread(chunk, 1n, 1024n, fd)
    setb(chunk, size, 0);
    console.log("READ: ", size)
    console.log(str(chunk))
    fclose(fd)
    free(chunk)
}
main()
