import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

function resolveAliasPath(specifier) {
  const relativePath = specifier.slice(2);
  const basePath = path.resolve(process.cwd(), relativePath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = resolveAliasPath(specifier);
      if (resolvedPath) {
        return nextResolve(pathToFileURL(resolvedPath).href, context);
      }
    }

    return nextResolve(specifier, context);
  },
});
