# Language description and features

## IDL dialect

We use WebIDL language with several custom extension attributes documented below.

## Custom extended attributes

   * `Class` - if declaration in .d.ts to be produces as class or interface
   * `Component` - if given interfaces describes UI component, component name in value
   * `ComponentInterface` - if given interfaces describes UI component interface
   * `CommonMethod` - if given property to be translated into builder function
   * `Optional` - if given attribute is optional
   * `CallSignature` - if given method is the call signature for .d.ts
   * `Documentation` - documentation for given entity in value
   * `IndexSignature` - marker for index signature methods
   * `VerbatimDts` - code to add "as-is" to produced .d.ts, for language-specific features, avoid if can
