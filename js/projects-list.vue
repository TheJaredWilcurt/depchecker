<template>
  <div>

    <h1>Projects</h1>

    <template v-if="projects.length > 0">
      <div
        v-for="(project, projectIndex) in projects"
        :key="'project' + projectIndex"
        class="row"
      >
        <div
          :title="project.filePath"
          class="col-xs-10"
        >
          {{ project.name }}
        </div>
        <div class="col-xs-2">
          <button
            class="btn btn-danger"
            @click="removeProject(projectIndex)"
          >
            X
          </button>
        </div>
      </div>
    </template>

    <div class="row">
      <div class="col-xs-12 text-right">
        <label class="btn btn-primary">
          <input
            v-model="packageSelection"
            id="package-selection"
            type="file"
            accept=".json"
            class="hide"
            @change="addProject"
          />
          Add a package.json
        </label>
      </div>
    </div>

  </div>
</template>

<script>
const path = window.nw.require('path');
module.exports = {
  name: 'ProjectsList',
  data: function () {
    return {
      packageSelection: null,
      projects: []
    };
  },
  methods: {
    addProject: function () {
      if (this.packageSelection && path.basename(this.packageSelection) === 'package.json') {
        let alreadyAdded = false;
        this.projects.forEach((project) => {
          if (project.filePath === this.packageSelection) {
            alreadyAdded = true;
          }
        });

        if (!alreadyAdded) {
          this.projects.push({
            filePath: this.packageSelection,
            name: path.basename(path.dirname(this.packageSelection))
          });
        }
      }
    },
    removeProject: function (index) {
      this.projects.splice(index, 1);
    }
  }
}
</script>
