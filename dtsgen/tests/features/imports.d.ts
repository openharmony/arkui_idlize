import DefalutExportInterface from "./default_export_interface"
import ChangedName from "./default_export_interface"
import NameWithoutUsage from "./default_export_interface"
import { Resource as _Resource } from "./resource"
import { Resource } from "./resource"
import { Namespace } from "./default_export_namespace"
import DefaultNamespace from "./default_export_namespace"

declare function foo(value: DefalutExportInterface): void
declare function foo(value: ChangedName): void

declare function boo(value: Namespace.InterfaceInsideNamespace): void
declare function goo(value: DefaultNamespace.InterfaceInsideNamespace): void