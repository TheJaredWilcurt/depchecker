<template>
  <div>

    <h1>Projects</h1>

    <div class="projects">
      <template v-if="projects.length > 0">
        <div
          v-for="(project, projectIndex) in projects"
          :key="'project' + projectIndex"
          class="row"
        >
          <div class="col-10 project">
            <span class="name">
              {{ project.name }}
            </span>
            <button class="path btn btn-info" @click="projectClicked(projectIndex)">
              {{ project.filePath }}
            </button>
          </div>
          <div class="col-2 d-flex justify-content-end align-items-center">
            <button
              class="btn btn-danger"
              @click="removeProject(projectIndex)"
            >
              X
            </button>
          </div>
        </div>
      </template>
    </div>

    <div class="row">
      <div class="col-12 mt-2 text-right">
        <label class="btn btn-primary">
          <input
            v-model="packageSelection"
            id="package-selection"
            type="file"
            accept=".json"
            class="d-none"
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
  props: {
    projects: {
      type: Array,
      required: true,
      validator: function (projects) {
        let valid = true;
        if (!projects.length) {
          return valid;
        }
        projects.forEach(function (project) {
          if (!project.filePath || !project.name) {
            valid = false;
          }
        });
        return valid;
      }
    }
  },
  data: function () {
    return {
      packageSelection: null
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
          let project = {
            filePath: this.packageSelection,
            name: path.basename(path.dirname(this.packageSelection))
          };
          this.$emit('add-project', project);
        }
      }
    },
    removeProject: function (index) {
      this.$emit('remove-project', index);
    },
    projectClicked: function (index) {
      this.$emit('project-clicked', index);
    }
  }
}
</script>

<style scoped>
  .projects {
    max-height: 180px;
    overflow: auto;
  }
  .projects .row {
    margin-right: 0px;
    margin-left: 0px;
  }
  .projects .row > div {
    padding-right: 0px;
    padding-left: 0px;
  }
  .project {
    display: flex;
    align-items: center;
  }
  .project:hover .name,
  .project .path {
      display: none;
  }
  .project .name,
  .project:hover .path {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
  }
  .project .name {
    text-transform: capitalize;
  }
  .project .path {
    text-transform: inherit;
  }
</style>
