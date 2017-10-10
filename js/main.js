console.clear();
var app = new Vue({
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

            if (packageJSON && packageJSON.dependencies) {
                this.cleanDependencies(packageJSON.dependencies, 'dependencies');
            }
            if (packageJSON && packageJSON.devDependencies) {
                this.cleanDependencies(packageJSON.devDependencies, 'devDependencies');
            }
        },
        cleanDependencies: function (dependencies, type) {
            for (var key in dependencies) {
                if (dependencies[key].startsWith('http') || dependencies[key].startsWith('git')) {
                    delete dependencies[key];
                } else {
                    var version = dependencies[key];
                    version = version.replace('~', '');
                    version = version.replace('^', '');
                    var packageData = {
                        'name': key,
                        'version': version,
                        'type': type,
                        'latest': '',
                        'distance': null
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
        coundBreakingChanges: function (version, latest) {
            version = version.split('.')[0];
            version = parseInt(version);

            latest = latest.split('.')[0];
            latest = parseInt(latest);

            var diff = latest - version;
            this.breakingChanges = this.breakingChanges + diff;
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
        updateTotalDistance: function () {
            var total = 0;
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
            $.ajax({
                'type': 'GET',
                'url': 'http://registry.npmjs.org/' + package.name,
            })
            .done(function (response) {
                var latest = response['dist-tags'].latest;
                package.latest = latest;
                this.countHowFarBehind(package, response.versions);
                this.coundBreakingChanges(package.version, latest);
                this.updateTotalDistance();
            }.bind(this));
        }
    }
});
