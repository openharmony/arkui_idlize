const log = `
toSizePtr
fromSizePtr
fromSizePtr
toSizePtr
fromSizePtr
toSizePtr
toWindowSizePtr
fromWindowSizePtr
toAbilityInfoPtr
fromAbilityInfoPtr
toMultiAppModePtr
fromMultiAppModePtr
toModuleMetadataPtr
fromModuleMetadataPtr
toApplicationInfoPtr
fromApplicationInfoPtr
toExtensionAbilityInfoPtr
fromExtensionAbilityInfoPtr
toDataItemPtr
fromDataItemPtr
toDependencyPtr
fromDependencyPtr
toHapModuleInfoPtr
fromHapModuleInfoPtr
toPreloadItemPtr
fromPreloadItemPtr
toRouterItemPtr
fromRouterItemPtr
toMetadataPtr
fromMetadataPtr
toSkillPtr
fromSkillPtr
toSkillUriPtr
fromSkillUriPtr
toUiObserverNavigationInfoPtr
fromUiObserverNavigationInfoPtr
toUiObserverNavDestinationInfoPtr
fromUiObserverNavDestinationInfoPtr
toWindowSystemBarStylePtr
fromWindowSystemBarStylePtr
`

function trim(line) {
    const prefixes = ['to', 'from']
    for (const pref of prefixes) {
        if (line.startsWith(pref)) {
            return line.substring(pref.length)
        }
    }
    return line
}
function trimFull(line) {
    const trimmedPrefix = trim(line)
    return trimmedPrefix.endsWith('Ptr')
        ? trimmedPrefix.substring(0, trimmedPrefix.length - 3)
        : trimmedPrefix
}

function stageA() {
    const lines = log.split('\n')
        .map(x => x.trim())
        .filter(x => x)

    const visited = new Set()
    const unique = lines.flatMap(line => {
        if (visited.has(line)) {
            return []
        }
        visited.add(line)
        return [line]
    })
    unique.sort((a, b) => {

        return trim(a).localeCompare(trim(b))
    })
    unique.forEach(line => {
        console.log(line)
    })

    console.log(';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;')

    const names = new Set()
    unique.forEach(line => {
        names.add(trimFull(line))
    })

    console.error(names)

}
stageA()


function stageB(records) {
    records.forEach(record => {
        const [name, type] = record
        let text = `
export function to${name}Ptr(value:${type}):KPointer {
    return 123
}
export function from${name}Ptr(ptr:KPointer):${type} {
    const x:Object = {}
    return x as ${type}
}`
        console.log(text)
    })
}
stageB([
    ['AbilityInfo', 'AbilityInfo'],
    ['ApplicationInfo', 'ApplicationInfo'],
    ['DataItem', 'DataItem'],
    ['Dependency', 'Dependency'],
    ['ExtensionAbilityInfo', 'ExtensionAbilityInfo'],
    ['HapModuleInfo', 'HapModuleInfo'],
    ['Metadata', 'Metadata'],
    ['ModuleMetadata', 'ModuleMetadata'],
    ['MultiAppMode', 'MultiAppMode'],
    ['PreloadItem', 'PreloadItem'],
    ['RouterItem', 'RouterItem'],
    ['Size', 'Size'],
    ['Skill', 'Skill'],
    ['SkillUri', 'SkillUri'],
    ['UiObserverNavDestinationInfo', 'uiObserver.NavDestinationInfo'],
    ['UiObserverNavigationInfo', 'uiObserver.NavigationInfo'],
    ['WindowSize', 'WindowSize'],
    ['WindowSystemBarStyle', 'window.SystemBarStyle'],
])