import { fopen, fclose, fread, malloc, free, str, setb, getCWD } from 'stdio'

export function main() {
    console.log("HELLO");
    console.log(getCWD());
    const chunk = malloc(1024)
    const fd = fopen("../simple.file", "r")
    if (fd === 0) {
        console.error("CAN NOT OPEN FILE!")
        return
    }
    const size = fread(chunk, 1, 1024, fd)
    setb(chunk, size, 0);
    console.log("READ: ", size)
    console.log(str(chunk))
    fclose(fd)
    free(chunk)
}
