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

import { MessageSeverity, DiagnosticMessage, Location, DiagnosticResult, DiagnosticException } from "./diagnostictypes"

/**
 * Index for DiagnosticMessageKind by code
 */
export let messageByCode = new Map<number, DiagnosticMessageKind>()

/**
 * Template for registering different kinds of messages
 */
export class DiagnosticMessageKind {
	/**
	 * Severity of the diagnostic.
	 */
    severity: MessageSeverity
	/**
	 * Unsigned integer code of the diagnostic.
	 */
    code: number
	/**
	 * Description of the diagnostic.
	 */
    codeDescription: string
	/**
	 * An URI to open with more information about the diagnostic.
	 */
    codeURI?: string
    /**
     * Template for main part
     */
    mainMessageTemplate: string
    /**
     * Template for additional parts
     */
    additionalMessageTemplate: string

    constructor(severity: MessageSeverity, code: number, codeDescription: string, mainMessageTemplate?: string, additionalMessageTemplate?: string) {
        this.severity = severity
        this.code = code
        this.codeDescription = codeDescription
        // No cases of codeUri for now, can be embedded into codeDescription later if needed
        this.mainMessageTemplate = mainMessageTemplate ?? codeDescription
        this.additionalMessageTemplate = additionalMessageTemplate ?? "See"
        if (messageByCode.has(code)) {
            throw new Error(`Duplicate message code ${code}`)
        }
        messageByCode.set(code, this)
    }

    generateDiagnosticMessage(locations: Location[], mainMessage?: string, additionalMessage?: string): DiagnosticMessage {
        let msg: DiagnosticMessage = {
            severity: this.severity,
            code: this.code,
            codeDescription: this.codeDescription,
            codeURI: this.codeURI,
            parts: []
        }
        let first = true
        for (let l of locations) {
            msg.parts.push({location: l, message: first ? (mainMessage ?? this.mainMessageTemplate) : (additionalMessage ?? this.additionalMessageTemplate)})
            first = false
        }
        return msg
    }

    pushDiagnosticMessage(diagnosticResult: DiagnosticResult, locations: Location[], mainMessage?: string, additionalMessage?: string): void {
        diagnosticResult.push(this.generateDiagnosticMessage(locations, mainMessage, additionalMessage))
    }

    throwDiagnosticMessage(locations: Location[], mainMessage?: string, additionalMessage?: string): void {
        throw new DiagnosticException(this.generateDiagnosticMessage(locations, mainMessage, additionalMessage))
    }
}

export let UnknownError = new DiagnosticMessageKind("fatal", 0, "Unknown error")

export let LoadingError = new DiagnosticMessageKind("fatal", 100, "Loading error")
export let ParsingError = new DiagnosticMessageKind("fatal", 101, "Parsing error")
export let ProcessingError = new DiagnosticMessageKind("fatal", 102, "Processing error")

export let UnresolvedReference = new DiagnosticMessageKind("error", 200, "Unresolved reference")
export let DuplicateIdentifier = new DiagnosticMessageKind("error", 201, "Duplicate identifier", undefined, "Duplicate of")
export let InconsistentEnum = new DiagnosticMessageKind("error", 202, "Enum includes both string and number values", undefined, "Incompatible with")

// export let PackageNotFound = new DiagnosticMessageKind("error", 105, "Package not found")
// export let IdentifierNotFound = new DiagnosticMessageKind("error", 106, "Identifier not found")
