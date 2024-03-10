# Language description and features

## IDL dialect

We use WebIDL language with several custom extension attributes documented below.

## Custom extended attributes

   * `Class` - if declaration in .d.ts to be produces as class or interface
   * `Component` - if given interfaces describes UI component
   * `CommonMethod` - if given property to be translated into builder function
   * `Optional` - if given attribute is optional
   * `CallSignature` - if given method is the call signature for .d.ts