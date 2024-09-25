import * as ts from "typescript"
import { Language } from "./util"

export interface Library<FileType> {
    language: Language
    files: FileType[]
    findFileByOriginalFilename(filename: string): FileType | undefined 
}

