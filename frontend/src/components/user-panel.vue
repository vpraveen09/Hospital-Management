<script setup>
import { DxButton } from 'devextreme-vue';
// import {,DxDropDownButton, DxList} from 'devextreme-vue';
// Props
const props = defineProps({
  menuItems: Array,
  menuMode: String,
});
</script>

<template>
  <div class="user-panel">
    <dx-button  stylingMode="text"
      :icon="'user'" :showArrowIcon="false"
      :elementAttr="{
        class: 'user-button'
      }"
       @click="() => {}"
       />
    <!-- <dx-list width="130" /> -->
  </div>
</template>

<style lang="scss">
.app .header-toolbar .user-panel .user-button.dx-button img.dx-icon {
  width: auto;

  .dx-theme-generic & {
    max-height: 32px;
  }
}

.user-panel {
  display: flex;
  padding-right:112px;
  flex-direction: column;

  .user-button.dx-button {
    margin-left: 5px;

    img.dx-icon {
      border-radius: 50%;
      margin: 0;
      width: auto;
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
      border: 1px solid var(--dx-color-border);
      object-fit: cover;
      object-position: top;
      background: rgb(255, 255, 255);
      background-clip: padding-box;
    }



    .dx-buttongroup {
      vertical-align: middle;

      .dx-button.dx-button-has-icon:not(.dx-button-has-text) {
        .dx-button-content {
          padding: 0;
        }

        &.dx-state-hover,
        &.dx-state-focused {
          background-color: transparent;

          img.dx-icon {
            border-color: var(--dx-color-primary);
          }
        }
      }
    }
  }
}
</style>
