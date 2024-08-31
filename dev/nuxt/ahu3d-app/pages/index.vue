<template>
  <div id="sceneContainer"></div>
</template>

<script>
import { Ahu3D } from '~/../../../';

export default {
  async mounted() {
    // Create an Ahu3D instance.
    const ahu3d = new Ahu3D();

    // Attach a 3d scene to the page, passing an html id an an argument.
    // Example HTML: <div id="sceneContainer"></div>
    ahu3d.attachScene("#sceneContainer");

    // Set your custom configuration for loading component assets.
    const assetConfigs = {
      "assetsPath": "/assets/",
      "componentList": ["Fan", "Damper" /** Continuing list here **/]
    }

    // Load in your component assets into memory, passing in assetConfigs(required) as an argument.
    await ahu3d.loadLibraryFromApp(assetConfigs);

    // Instantiate your component meshes into the page's 3d scene.
    const fan = await ahu3d.loadComponent("Fan");
    fan.position.x -= 0.5;

    const damper = await ahu3d.loadComponent("Damper");
    damper.position.x += 0.5;

    fan.setAnimation(5);
    damper.setTargetTransforms(2);
  }
}
</script>

<style>
  body {
    margin:0;
    background:#111;
  }
</style>
