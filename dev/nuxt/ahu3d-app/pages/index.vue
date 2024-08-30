<template>
  <div id="threeContainer"></div>
</template>

<script>
import { Ahu3D } from '~/../../../';

export default {
  mounted() {
    this.ahu3d = new Ahu3D();
    this.ahu3d.attachScene('#threeContainer');

    this.ahu3d.loadLibraryFromApp();
    this.ahu3d.loadComponent(this.ahu3d.library['Fan']);
  }
}
</script>

<style>
  body {
    margin:0;
    background:#111;
  }
</style>
