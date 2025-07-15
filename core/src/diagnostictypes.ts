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

/**
 * Diagnostic message severity.
 * LSP note: Corresponds directly.
 */
export type MessageSeverity =  "fatal" | "error" | "warning" | "information" | "hint"

/**
 * Diagnostic message severity values.
 */
export let MessageSeverityList: MessageSeverity[] =  ["fatal", "error", "warning", "information", "hint"]

/**
 * Message that reports specific error/warning, contains multiple parts and fixes.
 * LSP note:
 * DiagnosticMessage is designed to be easily convertible to LSP data structures.
 * The main fields and first DiagnosticComponent can be mapped to LSP Diagnostic.
 * Rest of `parts` - to `relatedInformation` in it.
 * Fields like `fixes` - to other LSP API.
 */
export interface DiagnosticMessage {
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
     * Main and clarifying components of the diagnostic with locations.
     */
    parts: DiagnosticComponent[]
    /**
     * List of diffs that can be applied to source files to fix the problem reported in diagnostic. Optional.
     */
    fixes?: DiagnosticDiffComponent[]
}

/**
 * Component of diagnostic message related to specific file/location.
 */
export interface DiagnosticComponent {
    /**
     * Location (document path and optional range)
     */
    location: Location
    /**
     * Message related to specific character range or the document as a whole.
     */
    message: string
}

/**
 * Location, consisting of document path and optional range
 */
export interface Location {
	/**
	 * Path to correspondent document.
	 */
    documentPath: string
    /**
     * Character range in that document, optional.
     */
    range?: Range
    /**
     * Document content for pretty formatted output, optional.
     */
    lines?: string[]
}

/**
 * Location, consisting two inclusive in-document positions.
 */
export interface Range {
    /**
	 * Start position (inclusive).
	 */
    start: Position

    /**
	 * End position (exclusive).
	 */
    end: Position
}

export function commonRange(range1: Range, range2: Range): Range {
    let start = minPosition(range1.start, range2.start)
    let end = maxPosition(range1.end, range2.end)
    return {start, end}
}

/**
 * Position in a document.
 * LSP note: In LSP positions are zero-based (that needs conversion) and UTF-16 by default.
 */
export interface Position {
	/**
	 * Line position in a document (one-based).
	 */
	line: number;

	/**
	 * Character offset on a line in a document (one-based) in UTF-16 code points.
	 */
	character: number;
}

export function comparePositions(a: Position, b: Position): number {
    if (a.line < b.line) {
        return -1
    }
    if (a.line > b.line) {
        return 1
    }
    if (a.character < b.character) {
        return -1
    }
    if (a.character > b.character) {
        return 1
    }
    return 0
}

export function minPosition(a: Position, b: Position): Position {
    return comparePositions(a, b) == -1 ? a : b
}

export function maxPosition(a: Position, b: Position): Position {
    return comparePositions(a, b) == 1 ? a : b
}

/**
 * Diff component of diagnostic message related to specific file/location.
 */
export interface DiagnosticDiffComponent {
    /**
     * Location (document path and optional range)
     */
    location: Location
    /**
     * Replacement content. Can be omitted for the "whole document" case, meaning that document needs to be deleted.
     */
    replacement?: string
}

/**
 * Receiver of diagnostic messages.
 */
export interface DiagnosticReceiver {
    push(message: DiagnosticMessage): void
}

/**
 * Collection of diagnostic messages with calculated statistics.
 */
export class DiagnosticResults implements DiagnosticReceiver {
    entries: DiagnosticMessage[] = []
    totals: Record<MessageSeverity, number> = {"fatal": 0, "error": 0, "warning": 0, "information": 0, "hint": 0}

    push(message: DiagnosticMessage): void {
        this.entries.push(message)
        this.totals[message.severity] += 1
    }

    get hasErrors(): boolean {
        return this.totals.fatal != 0 || this.totals.error != 0
    }
}

/**
 * Exception for delivering prepared DiagnosticMessage through processing
 */
export class DiagnosticException extends Error {
    diagnosticMessage: DiagnosticMessage
    constructor(diagnosticMessage: DiagnosticMessage, cause?: any) {
        super()
        this.message = diagnosticMessage.parts[0].message
        this.diagnosticMessage = diagnosticMessage
        this.cause = cause
    }
}
