import DefalutExportInterface from "./default_export_interface"
import ChangedName from "./default_export_interface"
import NameWithoutUsage from "./default_export_interface"
import { Resource as _Resource } from "./resource"
import { Resource } from "./resource"
import { Namespace } from "./default_export_namespace"
import DefaultNamespace from "./default_export_namespace"

function foo(value: DefalutExportInterface): void
function foo(value: ChangedName): void

function boo(value: Namespace.InterfaceInsideNamespace): void
function goo(value: DefaultNamespace.InterfaceInsideNamespace): void