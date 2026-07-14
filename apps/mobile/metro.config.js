// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo (pnpm workspace): watch the workspace root and let Metro resolve
// against both the app's and the root's node_modules.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm's default node_modules layout is symlink-based (real files live
// under node_modules/.pnpm/...); Metro needs this on to follow them instead
// of treating each symlink target as outside the project and resolving a
// second, conflicting copy of React (which breaks hooks: "Invalid hook
// call").
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
