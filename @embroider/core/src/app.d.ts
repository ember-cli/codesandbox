import { OutputPaths } from './wait-for-trees';
import Package, { V2AddonPackage } from './package';
import { Asset } from './asset';
import Options from './options';
import { TransformOptions } from '@babel/core';
import { TemplateCompilerPlugins } from '.';
import { Resolver } from './resolver';
export declare type EmberENV = unknown;
export interface AppAdapter<TreeNames> {
    readonly activeAddonDescendants: V2AddonPackage[];
    appJSSrcDir(treePaths: OutputPaths<TreeNames>): string;
    assets(treePaths: OutputPaths<TreeNames>): Asset[];
    autoRun(): boolean;
    mainModule(): string;
    mainModuleConfig(): unknown;
    modulePrefix(): string;
    rootURL(): string;
    templateCompilerPath(): string;
    templateResolver(): Resolver;
    htmlbarsPlugins(): TemplateCompilerPlugins;
    babelConfig(): TransformOptions;
    babelMajorVersion(): 6 | 7;
    extraImports(): {
        absPath: string;
        target: string;
        runtimeName?: string;
    }[];
    emberENV(): EmberENV;
    strictV2Format(): boolean;
}
export declare class AppBuilder<TreeNames> {
    private root;
    private app;
    private adapter;
    private options;
    private assets;
    constructor(root: string, app: Package, adapter: AppAdapter<TreeNames>, options: Required<Options>);
    private scriptPriority;
    private impliedAssets;
    private impliedAddonAssets;
    private babelConfig;
    private adjustImportsPlugin;
    private insertEmberApp;
    private appDiffer;
    private updateAppJS;
    private prepareAsset;
    private prepareAssets;
    private assetIsValid;
    private updateOnDiskAsset;
    private updateInMemoryAsset;
    private updateBuiltEmberAsset;
    private updateConcatenatedAsset;
    private updateAssets;
    private gatherAssets;
    build(inputPaths: OutputPaths<TreeNames>): Promise<void>;
    private templateCompiler;
    private addTemplateCompiler;
    private addBabelConfig;
    private shouldSplitRoute;
    private splitRoute;
    private appJSAsset;
    private readonly modulePrefix;
    private importPaths;
    private routeEntrypoint;
    private testJSEntrypoint;
    private gatherImplicitModules;
}
