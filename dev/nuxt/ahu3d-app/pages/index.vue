<template>
  <div ref="threeContainer"></div>
</template>

<script>
import { Scene, ModelLoader } from '~/../../../';

export default {
  mounted() {
    this.sceneHelper = new Scene();
    this.$refs.threeContainer.appendChild(this.sceneHelper.renderer.domElement);

    const modelLoader = new ModelLoader(this.sceneHelper); 
    modelLoader.loadComponent(this.sceneHelper.library['Fan']);
  }
}
</script>

<style>
  body {
    margin:0;
    background:#111;
  }
</style>
