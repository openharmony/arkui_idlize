
# Actions
+ Modify packages
+ Delete stdlib.idl
+ Modify config to unique names

# Problems

**problem**
Can not expand FQN for ButtonConfiguration /home/huawei/Desktop/idlize/interfaces/interfaces/arkui-extra/arkui-contentmodifier.idl:1

**solution**
Disable generics in arkgen?

**problem**
Can not resolve Partial

**solution**
Replace Partial for Object

**problem**
Error: Trying to monomorphize entry AsyncCallback that accepts 2 type parameters with 1 type arguments

**solution**
Change AsyncCallback signature

**problem**
Error: Expected check to be exhaustive. node: CommonShapeMethod

**solution**
make CommonShapeMethod is not component
