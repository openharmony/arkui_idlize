Ark_NodeHandle CreateNode(%CPP_PREFIX%Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags);

namespace ApiImpl {
  Ark_NodeHandle GetNodeByViewStack();
  void DisposeNode(Ark_NodeHandle node);
  Ark_Int32 AddChild(Ark_NodeHandle parent, Ark_NodeHandle child);
  void RemoveChild(Ark_NodeHandle parent, Ark_NodeHandle child);
  Ark_Int32 InsertChildAfter(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling);
  Ark_Int32 InsertChildBefore(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling);
  Ark_Int32 InsertChildAt(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_Int32 position);
  void ApplyModifierFinish(Ark_NodeHandle node);
  void MarkDirty(Ark_NodeHandle node, Ark_UInt32 flag);
  Ark_Boolean IsBuilderNode(Ark_NodeHandle node);
  Ark_Float32 ConvertLengthMetricsUnit(Ark_Float32 value, Ark_Int32 originUnit, Ark_Int32 targetUnit);
} // namespace OHOS::Ace::NG::ApiImpl