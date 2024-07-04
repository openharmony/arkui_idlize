## List of most common OpenHarmony CI CodeChecker issues

### 1. Using magic numbers
Note that numbers 0 and 1 are allowed to be inlined.
#### Examples:  
```c++
case 5: { // Green
    return Color(0xff00ff00);
}
case 6: { // Grey
    return Color(0xffc0c0c0);
}
case 7: { // Orange
    return Color(0xffffa500);
}
```

```c++
auto modifier = GeneratedModifier::GetGeneratedNodeModifiers()->getBlankModifier();
Opt_Type_BlankInterface__setBlankOptions_Arg0 min;
std::string unit = "vp";
if (minUnit == 0) unit = "px";
if (minUnit == 2) unit = "fp";
if (minUnit == 3) unit = "%";
if (minUnit == 4) unit = "lp";
```

```c++
if (suffixPtr[0] == 'f' && suffixPtr[1] == 'p')
{
    result->unit = 2;
}
```

#### Containing files:
```
frameworks/core/interfaces/arkoala/utility/convertor.h
frameworks/core/interfaces/arkoala/utility/generated/convertors_generated.h
frameworks/core/interfaces/arkoala/implementation/button_modifier.cpp
frameworks/core/interfaces/arkoala/utility/utils.cpp
```

#### Solution
Use ```constexpr int TWO = 2``` or enums instead.


### 2. Using ```abort()``` function

#### Containing files:
```c++
.....
else if (space->value.selector == 1 /* NUMBER */) {
    return std::make_tuple(convertNumber(&space->value.value1), 1);
} else {
    abort();
}
```

```
frameworks/core/interfaces/arkoala/utility/convertor.h
frameworks/core/interfaces/arkoala/utility/generated/convertors_generated.h
frameworks/core/interfaces/arkoala/utility/utils.cpp
```

### 3. Line length is more than 120 characters
Any file including all generated modifiers and
```
frameworks/core/interfaces/arkoala/generated/interface/arkoala_api_generated.h

```

### 4. The left brace should follow the ```typedef``` statement
#### Example:
```c++
typedef struct GENERATED_Ark_NodeEvent
{
```

should be
```c++
typedef struct GENERATED_Ark_NodeEvent {
```

Found in ```frameworks/core/interfaces/arkoala/generated/interface/arkoala_api_generated.h```

#### More to come...


