# Language description and features

## IDL dialect

We use WebIDL language with several custom extension attributes documented below.

## Custom extended attributes

   * `Accessor = Getter | Setter` - if given node is accessor
   * `CallSignature` - if given method is the call signature for .d.ts
   * `CommonMethod` - if given property to be translated into builder function
   * `Component` - if given interfaces describes UI component, component name in value
   * `ComponentInterface` - if given interfaces describes UI component interface
   * `Deprecated` - if node is part of deprecated api
   * `Documentation` - documentation for given entity in value
   * `DtsName` - original name in case it is not allowed in IDL, e.g. is an IDL keyword
   * `Entity = Class | Interface | Literal | NamedTuple | Tuple` - what to produce from and IDL interface declaration
   * `Export` - if given node has `export` modifier
   * `GlobalScope`
   * `Import` - complete TS import expression for inline imports
   * `IndexSignature` - marker for index signature methods
   * `Interfaces` - name of implemented interface
   * `InterfaceTypeArguments` - concrete types used as values for implemented interface type parameters
   * `Namespace` - namespace name for given node
   * `Optional` - if given attribute is optional
   * `Qualifier` - prefix for a reference type, such as a namespace
   * `ParentTypeArguments` - concrete types used as values for extended class type parameters
   * `Protected` - if given attribute is protected
   * `TypeParameters` - type parameters for a parameterized type
   * `TypeArguments` - concrete types used as values for type parameters
   * `VerbatimDts` - code to add "as-is" to produced .d.ts, for language-specific features, avoid when possible
