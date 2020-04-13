console.clear();

// nw.Window.get().showDevTools();

var app = new Vue({
    el: '#app',
    data: {
        updatesChecked: false,
        packages: [],
        packagesToSkip: [],
        packagejson: '',
        showGood: false,
        showBroke: true,
        showBehind: true,
        showSkipped: false
    },
    methods: {
        reset: function () {
            this.updatesChecked = false;
            this.breakingChanges = null;
        },
        validatePackage: function () {
            this.reset();

            var packageJSON = '';
            try {
                packageJSON = JSON.parse(this.packagejson);
            } catch (err) {
                return;
            }

            this.cleanPackageJSON(packageJSON);
        },
        cleanPackageJSON: function (packageJSON) {
            this.packages = [];
            this.packagesToSkip = [];

            if (packageJSON && packageJSON.ManifestComments) {
                this.findPackagesToSkip(packageJSON.ManifestComments);
            }

            if (packageJSON && packageJSON.dependencies) {
                this.cleanDependencies(packageJSON.dependencies, 'dependencies');
            }
            if (packageJSON && packageJSON.devDependencies) {
                this.cleanDependencies(packageJSON.devDependencies, 'devDependencies');
            }
        },
        findPackagesToSkip: function (ManifestComments) {
            ManifestComments.forEach((comment) => {
                if (comment.startsWith('Pinned ')) {
                    var package = comment.split(' ')[1];
                    this.packagesToSkip.push(package);
                }
            });
        },
        cleanDependencies: function (dependencies, type) {
            for (var key in dependencies) {
                if (
                    dependencies[key].startsWith('http') ||
                    dependencies[key].startsWith('git')
                ) {
                    delete dependencies[key];
                } else {
                    var version = dependencies[key];
                    version = version.replace('~', '');
                    version = version.replace('^', '');
                    var packageData = {
                        name: key,
                        version: version,
                        type: type,
                        latest: '',
                        distance: null,
                        broken: null
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
            var existingVersion = package.version;
            var matchFound = false;
            var distance = 0;

            for (var key in versions) {
                var version = versions[key].version;
                if (matchFound) {
                    distance = distance + 1;
                } else if (existingVersion === version) {
                    matchFound = true;
                }
            }

            package.distance = distance;
        },
        countBreakingChanges: function (package, latest) {
            var version = package.version.split('.')[0];
            version = parseInt(version);

            latest = latest.split('.')[0];
            latest = parseInt(latest);

            var diff = latest - version;
            package.broken = diff;
        },
        checkIfLatest: function (package, latest) {
            var existingVersion = package.version;
            if (latest === existingVersion) {
                package.broken = 0;
                package.distance = 0;
            }
        },
        checkAllForUpdates: function () {
            this.packages.forEach(function (package) {
                this.checkForUpdates(package);
            }.bind(this));
            this.updatesChecked = true;
        },
        checkForUpdates: function (package) {
            $.ajax({
                'type': 'GET',
                'url': 'http://registry.npmjs.org/' + package.name,
            })
            .done(function (response) {
                var latest = response['dist-tags'].latest;
                package.latest = latest;
                this.countHowFarBehind(package, response.versions);
                this.countBreakingChanges(package, latest);
                this.checkIfLatest(package, latest);
            }.bind(this));
        },
        packageClass: function (package) {
            if (package.broken) {
                return 'danger';
            }
            if (package.distance) {
                return 'warning';
            }
        }
    },
    computed: {
        filteredPackages: function () {
            var packages = [];
            this.packages.forEach((package) => {
                var skipped = this.packagesToSkip.includes(package.name);
                if (
                    (package.distance === 0 && this.showGood) ||
                    (package.broken && this.showBroke && !skipped) ||
                    (package.distance && this.showBehind && this.showBroke && !skipped) ||
                    (skipped && this.showSkipped)
                ) {
                    packages.push(package);
                }
            });
            return packages;
        },
        totalDistance: function () {
            var total = 0;
            this.filteredPackages.forEach(function (package) {
                if (typeof(package.distance) === 'number') {
                    total = total + package.distance;
                }
            });
            return total;
        },
        totalBreakingChanges: function () {
            var total = 0;
            this.filteredPackages.forEach(function (package) {
                total = total + package.broken;
            });
            return total;
        }
    }
});
