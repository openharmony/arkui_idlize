
export interface ApplicationInfo {

    readonly name: string;

    readonly description: string;

    readonly descriptionId: number;

    readonly enabled: boolean;

    readonly label: string;

    readonly labelId: number;

    readonly icon: string;

    readonly iconId: number;

    readonly process: string;

    readonly permissions: Array<string>;

    readonly codePath: string;

    // readonly metadata: Map<string, Array<Metadata>>;

    readonly metadataArray: Array<ModuleMetadata>;

    readonly removable: boolean;

    readonly accessTokenId: number;

    readonly uid: number;

    // readonly iconResource: Resource;

    // readonly labelResource: Resource;

    // readonly descriptionResource: Resource;

    readonly appDistributionType: string;

    readonly appProvisionType: string;

    readonly systemApp: boolean;

    // readonly bundleType: bundleManager.BundleType;

    readonly debug: boolean;

    readonly dataUnclearable: boolean;

    readonly nativeLibraryPath: string;

    readonly multiAppMode: MultiAppMode;

    readonly appIndex: number;

    readonly installSource: string;

    readonly releaseType: string;

    readonly cloudFileSyncEnabled: boolean;

    readonly flags?: number;
}

export interface ModuleMetadata {

    readonly moduleName: string;

    // readonly metadata: Array<Metadata>;
}

export interface MultiAppMode {

    // readonly multiAppModeType: bundleManager.MultiAppModeType;

    readonly maxCount: number;
}

export interface PreinstalledApplicationInfo {

    readonly bundleName: string;

    readonly moduleName: string;

    readonly iconId: number;

    readonly labelId: number;
}
