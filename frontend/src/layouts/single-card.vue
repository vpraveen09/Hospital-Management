<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DxScrollView from 'devextreme-vue/scroll-view';

const route = useRoute();

const title = ref(route.meta.title);
const description = ref("");

watch(() => route.path, () => {
  title.value = route.meta.title;
  description.value = route.meta.description;
});
</script>


<template>
  <dx-scroll-view height="100%" width="100%" class="with-footer single-card">
     <div class="dx-card content">
      <div class="header">
        <div class="title">{{title}}</div>
        <div class="description">{{description}}</div>
      </div>
      <slot />
    </div>
  </dx-scroll-view>
</template>

<style lang="scss">
.single-card {
  width: 100%;
  height: 100%;

  .dx-card {
    width: 330px;
    margin: auto auto;
    padding: 40px;
    flex-grow: 0;

    .screen-x-small & {
      width: 100%;
      height: 100%;
      border-radius: 0;
      box-shadow: none;
      margin: 0;
      border: 0;
      flex-grow: 1;
    }

    .header {
      margin-bottom: 30px;

      .title {
        color: var(--base-text-color);
        line-height: 28px;
        font-weight: 500;
        font-size: 24px;
      }

      .description {
        color: var(--base-text-color-alpha-7);
        line-height: 18px;
      }
    }
  }
}
</style>
