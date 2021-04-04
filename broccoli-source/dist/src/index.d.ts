import { FeatureSet, SourceNodeInfo, InputNode, SourceNode } from 'broccoli-node-api';
import { ConstructorOptions, MapSeriesIterator } from './interfaces';
declare class Directory implements SourceNode {
    private _directoryPath;
    private _watched;
    private _name;
    private _annotation?;
    private _instantiationError;
    __broccoliFeatures__: FeatureSet;
    constructor(directoryPath: string, watched: boolean | string, options?: ConstructorOptions);
    __broccoliGetInfo__(builderFeatures?: FeatureSet): SourceNodeInfo;
    read(readTree: MapSeriesIterator<InputNode>): string | SourceNode | import("broccoli-node-api").TransformNode | Promise<InputNode>;
    cleanup(): void;
}
declare class WatchedDir extends Directory {
    /**
     * Create a Broccoli node referring to a directory on disk.
     * The Broccoli watcher used by broccoli serve will watch the directory
     * and all subdirectories, and trigger a rebuild whenever something changes.
     *
     * @param directoryPath
     * A path to a directory, either absolute, or relative to the working directory.
     * @param options.annotation
     * A human-readable description for this node.
     * @param options.name
     * A human-readable name for this node.
     */
    constructor(directoryPath: string, options?: ConstructorOptions);
}
declare class UnwatchedDir extends Directory {
    /**
     * Create a Broccoli node referring to a directory on disk.
     * The Broccoli watcher used by broccoli serve will not watch the directory
     * or any subdirectories, and will not trigger a rebuild whenever something changes.
     *
     * @param directoryPath
     * A path to a directory, absolute or relative, to the working directory.
     * @param options.annotation
     * A human-readable description for this node.
     * @param options.name
     * A human-readable name for this node.
     */
    constructor(directoryPath: string, options?: ConstructorOptions);
}
declare const _default: {
    Directory: typeof Directory;
    WatchedDir: typeof WatchedDir;
    UnwatchedDir: typeof UnwatchedDir;
};
export = _default;
//# sourceMappingURL=index.d.ts.map