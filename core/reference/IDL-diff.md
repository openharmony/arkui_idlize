# Language description and features

## IDL dialect

We use WebIDL language with several custom extension attributes documented below and some grammar extensions.

## Grammar extensions

  * `package "org.ohos.subsystem"` - describes package where interface belongs to, mapped to package name for languages with the package system
  and used by `import`
  * `import "org.ohos.subsystem.Component"` - described import from another interface definition
  * JS type names are allowed as IDL entity names.
  * The `async` marker support for Operation.
  * The domain of the Operation Parameter name is extended to allow keywords.
  * The domain of the Record key is extended to allow any type, not only `XXXString`.
  * The ability to mark the base entity of the Interface/etc with Extended Attributes.
  * The ability to mark the return type of the Operation with Extended Attributes.
  * `version 1.2.3-dev456` - semantic-versioning-like meta information for namespaces/global

## Custom extended attributes

   * `Accessor = Getter | Setter` - if given node is accessor
   * `CallSignature` - if given method is the call signature for .d.ts
   * `CommonMethod` - if given property to be translated into builder function
   * `Component` - if given interfaces describes UI component, component name in value
   * `ComponentInterface` - if given interfaces describes UI component interface
   * `Deprecated` - if node is part of deprecated api
   * `Documentation` - documentation for given entity in value
   * `DtsName` - original name in case it is not allowed in IDL, e.g. is an IDL keyword
   * `DtsTag` - function/method tag-parameter as a string-triplet "index|name|value" or as just a single "value" if index is zero and name is `type`
   * `Entity = Class | Interface | Literal | NamedTuple | Tuple` - what to produce from and IDL interface declaration
   * `Import` - complete TS import expression for inline imports
   * `IndexSignature` - marker for index signature methods
   * `Interfaces` - name of implemented interface
   * `InterfaceTypeArguments` - concrete types used as values for implemented interface type parameters
   * `Namespace` - namespace name for given node
   * `Optional` - if given attribute is optional
   * `ParentTypeArguments` - concrete types used as values for extended class type parameters
   * `Protected` - if given attribute is protected
   * `Throws` - indicates that function may throw an exception
   * `TSType` - name of standard TypeScript type for given IDL type
   * `TypeParameters` - type parameters for a parameterized type
   * `TypeArguments` - concrete types used as values for type parameters
   * `VerbatimDts` - code to add "as-is" to produced .d.ts, for language-specific features, avoid when possible
