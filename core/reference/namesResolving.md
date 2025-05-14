### Data Model

Let's briefly examine the composition of entities that have a clear relation to the topic

- (goal) named entities
- (reference) named reference
- (structuring) namespace
- (structuring) package
- (projection) import, 3 forms
   - importing child elements from a specified namespace under their own names (e.g., 'import foo.bar;')
   - alias for a namespace (e.g., 'import foo.bar as barAlias;' // here foo.bar refers to the namespace)
   - alias for a named entity (e.g., 'import foo.bar as barAlias;' // here foo.bar refers to some target named entity, such as an interface)
- (projection) alias (typedef)

By a named entity, we understand something on which a named reference can be built. In the current topic, such entities will be IDLInterface, IDLEnum/IDLEnumMember, and IDLTypedef (as well as constants, but that's an aside and won't be considered further). Technically, the target of a named reference can also include namespaces, free methods/attributes/constants, or methods/attributes/constants of an interface, as well as some other IR entities, since they can rely on the existing "name," but these are not our cases. At the IR level, it is worth noting that the mechanism for naming through IDLNamedNode is not only applied to the current topic; it also ensures name storage in some other aspects, such as for naming primitives, which is also not our current case.

By a named reference, we mean a mention of the name of some target named entity, formatted literally at the source text level and having the meaning of using the target entity at the point of mention. It is also worth paying attention to IDLNamedNode, which, when used in a reference to store the name of the target entity, can mislead the reader during a cursory review, since "the name in the reference" essentially represents the opposite direction of naming, but in the data schema, it is presented in a way that mimics direct naming.

Namespaces represent simply named containers for entities, and working with them at the naming level is done through additional qualification of the name, for example, "ns1.iface1." Namespaces can be nested, in which case the qualification is correspondingly strengthened, for example, "nsOuter.ns1.iface1."

In the context of the current topic, semantically (but not in terms of IR), a package is equivalent to a set of nested namespaces, the innermost of which serves as a container for the content of the file marked by the package.

The import directive has three forms: the first projects the contents of the specified container into the current namespace, the second creates an alias for the namespace, and the third creates an alias for the entity.

An alias (typedef) is analogous to the third form of import; the difference is that imports, in most cases, will resolve transitively almost always, while typedefs will sometimes halt at certain points. Another difference is that a typedef has a name and can thus serve as a target for a named reference, while an import cannot.

Here, briefly, are the main characters. Let's review them again, now from the perspective of the practitioner: Target entities - Interface/Enumeration/Alias/... - can be used by practitioners to build Named references. For structuring purposes, they can use Namespaces and Packages. For reducing fully qualified names, they can use projections in the form of Imports and Aliases.

### Algorithm for Calculating Named References

 (Note on design) We will say that a name is fully qualified if, for the current set of source material, the calculation of that name does not depend on the context (although in the current incarnation this situation does not apply, the design effectively lacks support for full qualification of names in an absolute sense since the language does not provide a root marker; technically, we are forced to consider all names as partially qualified even if the context becomes invariant).

Thus, names whose calculation depends on the context will be called partially qualified (taking into account the remarks from the previous position - formally, we will only work with such names).

The arguments for the calculation of the name are:

1. The qualified name itself as a set of string segments
2. The context as a Namespace entity (or any of its child elements recursively, from which one can unambiguously reach the Namespace by following the parent direction)
3. The set of source material expressed in IR

We will call the auxiliary constructs:

1. The starting point, equal to the context entity or any of its parents, including intermediate segments of the encompassing package (from it, we will impose name segments deeper into the IR tree)
2. The transitive segment of the name (this is not the last segment of the qualified name; during the calculation, it must overlap with the transitive entity) and
3. The name of the target entity (this is the last segment; during the calculation, it must overlap with the target named entity)
4. The transitive entity of IR (Namespace or part of the package name, Enumeration (for its members), Interface (for constants) - during the calculation, an intermediate segment of the name will be imposed on this entity)
5. The target entity of IR (Interface or another named entity - during the calculation, the final segment of the name will be imposed on it)

We will consider the name successfully calculated for the current context if:

1. A starting point has been found, relative to which
2. It was possible to impose the path of transitive name segments on the corresponding child elements from the starting point recursively down the subtree
3. And the same goes for the target name and target entity; it's just a terminator and not transit

If multiple starting points are found, we take the one closest to the context. Or alternatively: we will enumerate the starting points from the context and beyond, upon finding a suitable one - we will record success and the other points will simply not be considered.

In other words, the calculation algorithm consists of two types of passes,

- one (let’s call it the upward pass) iterates the starting point from the context and upwards in the parent direction until it reaches the root,
- the second (let’s call it the downward pass) is activated for each starting point, attempting to impose the name segments on the names of child entities recursively
- If both the transitive part and the target have successfully overlapped - we stop iterating the starting point and record the ultimate success

This algorithm is placed in the file resolveNamedNode.ts.

The entry point is in the function resolveNamedNode, which contains the upward pass - iterating the starting point, including iterating through both namespaces and segments of the encompassing package.

The imposition of name segments in the subtree from the starting point is located in the function resolveDownFromNode. Also, incorporated here is the projection of first-form imports, which is quite trivial and not considered further.

The enumeration of the root is placed in the function resolveDownFromRoot.

### Integration in PeerLibrary

Focus on methods resolveTypeReference, resolveNamedNode, resolveImport

- The resolveTypeReference method currently has the following main functions:
   - it is the entry point of the resolver for application use, through which the application layer activates the resolve
   - caching resolution results to speed up program performance under stable (unchanging in ways that affect the resolution result) IR conditions
   - optional support for iterating through Aliases (typedef, second type imports)
- resolveNamedNode
   - forcing non-IR entities from synthetic, predefined, std
   - proxying the resolve to the algorithm described above by providing the necessary arguments
   - fallback to overall divine resolution
- resolveImport - a minor helper for purposes of iterating through second/third form imports