export default class Context extends BaseContext {
  cacheDir: string;
  tempDir: string;
  filesDir: string;
  databaseDir: string;
  preferencesDir: string;
  bundleCodeDir: string;
  distributedFilesDir: string;
  resourceDir: string;
  cloudFileDir: string;
  processName: string;

  createBundleContext(bundleName: string): Context;
  createModuleContext(moduleName: string): Context;
  getGroupDir(dataGroupID: string): Promise<string>;
  createDisplayContext(displayId: number): Context;
}
