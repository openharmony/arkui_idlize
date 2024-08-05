# Language description and features

## IDL dialect

We use WebIDL language with several custom extension attributes documented below.

## Custom extended attributes

   * `CallSignature` - if given method is the call signature for .d.ts
   * `CommonMethod` - if given property to be translated into builder function
   * `Component` - if given interfaces describes UI component, component name in value
   * `ComponentInterface` - if given interfaces describes UI component interface
   * `Documentation` - documentation for given entity in value
   * `DtsName` - original name in case it is not allowed in IDL, e.g. is an IDL keyword
   * `Entity = Class | Interface | Literal | NamedTuple | Tuple` - what to produce from and IDL interface declaration
   * `Import` - complete TS import expression for inline imports
   * `IndexSignature` - marker for index signature methods
   * `Optional` - if given attribute is optional
   * `Qualifier` - prefix for a reference type, such as a namespace
   * `TypeArguments` - concrete types used as values for type parameters
   * `TypeParameters` - type parameters for a parameterized type
   * `VerbatimDts` - code to add "as-is" to produced .d.ts, for language-specific features, avoid when possible
   * `Export` - if given node has `export` modifier
   * `Accessor = Getter | Setter` - if given node is accessor
   * `Protected` - if given attribute is protected
   * `Namespace` - namespace name for given node
   * `Interfaces`
   * `GlobalScope`
   * `Deprecated`
