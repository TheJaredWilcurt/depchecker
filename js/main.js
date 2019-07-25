console.clear();
const semver = require('semver');

// nw.Window.get().showDevTools();

const app = new Vue({
    el: '#app',
    data: {
        updatesChecked: false,
        packages: [],
        packagejson: '',
        totalDistance: null,
        breakingChanges: null
    },
    methods: {
        reset: function () {
            this.updatesChecked = false;
            this.totalDistance = null;
            this.breakingChanges = null;
        },
        validatePackage: function () {
            this.reset();

            let packageJSON = '';
            try {
                packageJSON = JSON.parse(this.packagejson);
            } catch (err) {
                return;
            }

            this.cleanPackageJSON(packageJSON);
        },
        cleanPackageJSON: function (packageJSON) {
            this.packages = [];

            if (packageJSON && packageJSON.dependencies) {
                this.cleanDependencies(packageJSON.dependencies, 'dependencies');
            }
            if (packageJSON && packageJSON.devDependencies) {
                this.cleanDependencies(packageJSON.devDependencies, 'devDependencies');
            }
        },
        cleanDependencies: function (dependencies, type) {
            for (let key in dependencies) {
                if (dependencies[key].startsWith('http') || dependencies[key].startsWith('git')) {
                    delete dependencies[key];
                } else {
                    let version = dependencies[key];
                    version = version.replace('~', '');
                    version = version.replace('^', '');
                    let packageData = {
                        'name': key,
                        'version': version,
                        'type': type,
                        'latest': '',
                        'distance': null,
                        'broken': null
                    };
                    this.packages.push(packageData);
                }
            }
        },
        openLink: function (url) {
            if (typeof(nw) === 'object') {
                nw.Shell.openExternal(url);
            } else {
                window.open(url, '_blank');
            }
        },
        countHowFarBehind: function (package, versions) {
            let existingVersion = package.version;
            let matchFound = false;
            let distance = 0;

            for (let key in versions) {
                let version = versions[key].version;
                if (matchFound) {
                    distance = distance + 1;
                } else if (existingVersion === version) {
                    matchFound = true;
                }
            }

            package.distance = distance;
        },
        countBreakingChanges: function (package, latest) {
            // '1.2.3' => 1
            let originalMajor = semver.major(package.version)
            // '4.5.6' => 4
            let latestMajor = semver.major(latest);

            // 4 - 1 = 3
            let diff = latestMajor - originalMajor;
            package.broken = diff;

            this.breakingChanges = this.breakingChanges + diff;
        },
        checkIfLatest: function (package, latest) {
            let existingVersion = package.version;
            if (latest === existingVersion) {
                package.broken = 0;
                package.distance = 0;
            }
        },
        updateTotalDistance: function () {
            let total = 0;
            this.packages.forEach(function (package) {
                if (typeof(package.distance) === 'number') {
                    total = total + package.distance;
                }
            });
            this.totalDistance = total;
        },
        checkAllForUpdates: function () {
            this.packages.forEach(function (package) {
                this.checkForUpdates(package);
            }.bind(this));
            this.updatesChecked = true;
        },
        checkForUpdates: function (package) {
            axios.get('http://registry.npmjs.org/' + package.name)
                .then((response) => {
                    let latest = response['dist-tags'].latest;
                    package.latest = latest;
                    this.countHowFarBehind(package, response.versions);
                    this.countBreakingChanges(package, latest);
                    this.checkIfLatest(package, latest);
                    this.updateTotalDistance();
                })
                .catch((err) => {
                    package.networkError = err;
                });
        },
        packageClass: function (package) {
            if (package.broken) {
                return 'danger';
            }
            if (package.distance) {
                return 'warning';
            }
        }
    }
});
