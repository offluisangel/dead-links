# Publishing to npm

## Prerequisites

- npm account at [npmjs.com](https://www.npmjs.com)
- Logged in to npm CLI

## Step by Step

### 1. Check if name is available

```bash
npm view dead-links
```

- If `npm ERR! 404`, the name is available
- If it shows a package, you'll need a different name or a scoped package

### 2. Build

```bash
pnpm run build
```

This creates the `dist/` folder with the compiled code.

### 3. Update version

```bash
npm version patch  # 0.1.0 -> 0.1.1 (bug fixes)
# or
npm version minor  # 0.1.0 -> 0.2.0 (new features)
# or
npm version major  # 0.1.0 -> 1.0.0 (breaking changes)
```

### 4. Login to npm (if not already)

```bash
npm login
```

### 5. Publish

```bash
npm publish
```

### 6. Verify

```bash
npm view dead-links
```

You should see your package listed.

## Using the CLI

After publishing, anyone can run:

```bash
npx dead-links scan --vault ./my-vault
```

Or install globally:

```bash
npm install -g dead-links
dead-links scan --vault ./my-vault
```

## If the name is taken

Change the package name in `package.json`:

```json
{
  "name": "@yourusername/dead-links"
}
```

Then publish:

```bash
npm publish --access public
```

Usage:

```bash
npx @yourusername/dead-links scan --vault ./my-vault
```

## Updating

```bash
# Make changes
git add .
git commit -m "Description of changes"

# Bump version
npm version patch

# Publish
npm publish
```

## GitHub Release

After publishing to npm, create a GitHub release:

1. Go to your repo on GitHub
2. Click "Releases" → "Draft a new release"
3. Tag version (e.g., `v1.0.0`)
4. Title: `Release v1.0.0`
5. Copy the changelog for this version
6. Publish release

See `docs/github-release-notes.md` for the release notes template.