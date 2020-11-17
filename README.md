# DepChecker

### Check how far behind your dependencies are in your project.

Desktop app to help update your package.json.

**Features:**

* Drag n Drop or navigate to select a `package.json` file
* remembers last opened `package.json`
* Checks the versions for each package and how many releases have occurred since your current version
* Tells you how far behind you are in total releases
* Highlights if there are breaking changes
* Links you to the npm page of each project so you can read breaking changes notes
* Lets you modify the `package.json` to change dependency versions
* If you create a `"MainifestComments": []` section in the package.json and add in strings that start with "Pinned x" the "x" dependency will be added to the "skipped" section. Example:

```json
{
  "name": "example",
  "version": "0.0.1",
  "ManifestComments": [
    "Pinned jest to 24.9.0. 25.1.0+ is broken on Windows. Waiting for issue #9459 to be resolved.",
    "Pinned vuepress-plugin-live to 1.4.2 because 1.5.3 broke the following examples in the docs:",
    [
      "http://localhost:8080/components/Async.html#call-promise-using-refs",
      "http://localhost:8080/components/Dialog.html#prevent-scrolling",
      "http://localhost:8080/components/Drawer.html#styled-examples"
    ]
  ],
  "dependencies": {},
  "devDependencies": {
    "eslint": "^7.4.0",
    "jest": "24.9.0",
    "vuepress": "^1.5.0",
    "vuepress-plugin-live": "1.4.2"
  }
}
```

<p align="center"><img src="screenshot.png" alt="Screenshot of DepChecker running"></p>

1. **CLONE** the repo (so you can pull updates periodically as the app is improved)
1. `npm install`
1. `npm start`

https one-liner
```sh
git clone https://github.com/TheJaredWilcurt/depchecker.git && cd depchecker && npm install && npm start
```
ssh one-liner
```sh
git clone git@github.com:TheJaredWilcurt/depchecker.git && cd depchecker && npm install && npm start
```


* * *


**Known bugs:**

* Version diffing is pretty rudimentary. For example using `x` in a version number (`1.3.x`) will be ignored and the numbers will be off.

* * *

Made with Vue.js and NW.js.

* * *

**Alternatives:**

* You can use the built in `npm outdated`
