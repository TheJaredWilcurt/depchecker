console.clear();

Vue.config.devtools = true;
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
        showSkipped: false,
        saved: false
    },
    methods: {
        reset: function () {
            this.updatesChecked = false;
        },
        getCommonFileLocation: function () {
            return (
                window.nw &&
                window.localStorage &&
                window.localStorage.commonFile
            );
        },
        setCommonFileLocation: function (evt) {
            var file = evt.target.files[0].path;
            window.localStorage.commonFile = file;
            this.loadCommonFile();
        },
        loadCommonFile: function () {
            let commonFile = this.getCommonFileLocation();
            if (commonFile) {
                this.packagejson = String(window.nw.require('fs').readFileSync(commonFile));
                this.validatePackage();
            }

            this.checkAllForUpdates();
        },
        applyToManifest: function () {
            let error = false;
            let commonFile = this.getCommonFileLocation();
            let indentation = 2;
            let originalPackageJSON = '{}';
            let data = '';

            try {
                originalPackageJSON = String(window.nw.require('fs').readFileSync(commonFile));

                // {\n    "name":
                if (originalPackageJSON[5] === ' ') {
                    indentation = 4;
                }

                originalPackageJSON = JSON.parse(originalPackageJSON);
            } catch (err) {
                alert('Failed to read or JSON.parse original package.json');
                console.log(err);
                error = true;
            }

            if (!error) {
                this.selectedFilteredPackages.forEach(function (package) {
                    originalPackageJSON[package.type][package.name] = '^' + package.latest;
                });

                data = JSON.stringify(originalPackageJSON, null, indentation);
            }

            try {
                if (!error && data) {
                    window.nw.require('fs').writeFileSync(commonFile, data + '\n');
                }
            } catch (err) {
                alert('Error saving file');
                console.log(err);
                error = true;
            }

            if (!error) {
                this.saved = true;
                setTimeout(() => {
                    this.saved = false;
                    this.loadCommonFile();
                }, 4000);
            }
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
                if (
                    comment &&
                    typeof(comment) === 'string' &&
                    comment.startsWith('Pinned ')
                ) {
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
                        broken: null,
                        selected: false
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

            var allowed = ['.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            var sdkAlphaBeta = existingVersion.split('').filter(function (character) {
              return !allowed.includes(character);
            });

            if (latest === existingVersion || sdkAlphaBeta.length) {
                package.broken = 0;
                package.distance = 0;
            }
        },
        checkAllForUpdates: function () {
            if (this.packages.length) {
                this.packages.forEach(function (package) {
                    this.checkForUpdates(package);
                }.bind(this));
            }
            this.updatesChecked = true;
        },
        checkForUpdates: function (package) {
            $.ajax({
                type: 'GET',
                url: 'http://registry.npmjs.org/' + package.name,
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
        },
        togglePackageSelected: function (index, evt) {
            let packageName = this.filteredPackages[index].name;
            let found = this.packages.findIndex(function (package) {
                return package.name === packageName;
            });
            this.packages[found].selected = evt.target.checked;
        },
        toggleAllVisible: function (evt) {
            let selected = evt.target.checked;
            this.packages.forEach((package) => {
                let good = package.distance === 0;
                let skipped = this.packagesToSkip.includes(package.name);

                if (
                    (this.showGood && good) ||
                    (this.showBroke && package.broken && !skipped) ||
                    (this.showBehind && package.distance && !package.broken && !skipped) ||
                    (this.showSkipped && skipped)
                ) {
                    if (good || skipped) {
                        package.selected = false;
                    } else {
                        package.selected = selected;
                    }
                }
            });
        }
    },
    computed: {
        filteredPackages: function () {
            var packages = [];
            this.packages.forEach((package) => {
                var skipped = this.packagesToSkip.includes(package.name);
                if (
                    (this.showGood && package.distance === 0) ||
                    (this.showBroke && package.broken && !skipped) ||
                    (this.showBehind && package.distance && !package.broken && !skipped) ||
                    (this.showSkipped && skipped)
                ) {
                    packages.push(package);
                }
            });
            return packages;
        },
        selectedFilteredPackages: function () {
            return this.filteredPackages.filter(function (package) {
                return package.selected;
            });
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
        },
        markdown: function () {
            if (
                this.packages.lenght &&
                this.totalBreakingChanges === 0 &&
                this.totalDistance === 0 &&
                (
                    this.showGood ||
                    this.showBroke ||
                    this.showBehind ||
                    this.showSkipped
                )
            ) {
                return '# All dependencies are up to date. Lookin\' good 👍';
            }

            let breakingChanges = '';
            let behindBy = '';
            let skipped = '';
            let table = '';

            if (this.totalBreakingChanges == 1) {
                breakingChanges = '# There has been **[1](# \'1\')** breaking change.';
            } else if (this.totalBreakingChanges) {
                breakingChanges = '# There have been **[' + this.totalBreakingChanges + '](# \'' + this.totalBreakingChanges + '\')** breaking changes.';
            }

            if (this.totalDistance == 1) {
                behindBy = '## Your project is **[1](# \'1\')** version behind being completely up-to-date.';
            } else if (this.totalDistance) {
                behindBy = '## Your project is **[' + this.totalDistance + '](# \'' + this.totalDistance + '\')** versions behind being completely up-to-date.';
            }

            if (!this.showSkipped) {
                if (this.packagesToSkip.length === 1) {
                    skipped = '### 1 package skipped, per ManifestComments.';
                } else if (this.packagesToSkip.length) {
                    skipped = '### ' + this.packagesToSkip.length + ' packages skipped, per ManifestComments.';
                }
            }

            if (this.packages.length) {
                let header = [
                    'Status',
                    'Package',
                    'Version',
                    'Type',
                    'Latest',
                    'Behind by',
                    'Breaking',
                ];
                let align = new Array(header.length).fill(':--');
                let rows = [];

                this.filteredPackages.forEach(function (package) {
                    let status = '&#10004;'; // ✔
                    if (package.broken) {
                        status = '&#128165;'; // 💥
                    } else if (package.distance) {
                        status = '&#9888;'; // ⚠
                    }

                    let packageLink = '[' + package.name + '](https://www.npmjs.com/package/' + package.name +')';

                    let row = [
                        status,
                        packageLink,
                        package.version,
                        package.type,
                        package.latest,
                        package.distance,
                        package.broken
                    ].join(' | ');

                    rows.push(row);
                });

                if (rows.length) {
                    table = [
                        header.join(' | '),
                        align.join(' | '),
                        rows.join('\n')
                    ].join('\n');
                }
            }

            let credits = 'Auto-Generated with [DepChecker](https://github.com/TheJaredWilcurt/depchecker).'

            let markdown = [
                breakingChanges,
                behindBy,
                skipped,
                table,
                credits
            ].join('\n\n');

            return markdown.trim();
        }
    },
    created: function () {
        this.loadCommonFile();
    }
});
