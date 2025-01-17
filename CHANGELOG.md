# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0]
### Added
- Convert this library to TypeScript ([#27](https://github.com/MetaMask/swappable-obj-proxy/pull/27))
  - You should now be able to use this library in a TypeScript codebase without having to provide your own types.

## [2.0.0]
### Added
- Re-release of this package
  - This package was previously released under [`swappable-obj-proxy`](https://www.npmjs.com/package/swappable-obj-proxy) (latest version: 1.1.0). We've begun the version history of `@metamask/swappable-obj-proxy` at 2.0.0 in order to prevent any confusion. Past releases of `swappable-obj-proxy` are not explicitly recorded, but can be traced through the [commit history](https://github.com/MetaMask/swappable-obj-proxy/commits/main). All entries after this line are new additions since the previous release.
- Support proxying instances of class that reference private fields ([#10](https://github.com/MetaMask/swappable-obj-proxy/pull/10))
- Add type definitions for TypeScript projects ([#13](https://github.com/MetaMask/swappable-obj-proxy/pull/13))

[Unreleased]: https://github.com/MetaMask/swappable-obj-proxy/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/MetaMask/swappable-obj-proxy/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/MetaMask/swappable-obj-proxy/releases/tag/v2.0.0
