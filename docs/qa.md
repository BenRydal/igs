### Question

```
This package doesn't seem to be present in your lockfile; run "yarn install" to update the lockfile
    at $x.getCandidates (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:205:8149)
    at Bd.getCandidates (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:141:1311)
    at /Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:210:8334
    at Yy (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:140:53922)
    at xe (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:210:8314)
    at async Promise.allSettled (index 0)
    at async Uc (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:140:53250)
    at async /Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:210:9065
    at async Qi.startProgressPromise (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:140:137290)
    at async St.resolveEverything (/Users/bshapiro/.cache/node/corepack/yarn/4.0.1/yarn.js:210:7063)
```

### Solution

For MacOS, we need to remove

```
rm -rf ~/.yarn/berry/metadata/npm
```

on Windows, this solution may look like this:

```
C:\Users<your-user>\AppData\Local\Yarn\Berry\metadata\npm

```

Resource:

Original GitHub Post: https://github.com/yarnpkg/berry/issues/5989#issuecomment-1846996967
