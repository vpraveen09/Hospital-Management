<script setup>
import DxDrawer from "devextreme-vue/drawer";
import DxScrollView from "devextreme-vue/scroll-view";

import menuItems from "../app-navigation";
import HeaderToolbar from "../components/header-toolbar";
import SideNavMenu from "../components/side-nav-menu";
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';

// Props
const props = defineProps({
  title: String,
  isXSmall: Boolean,
  isLarge: Boolean
});

// Route
const route = useRoute();

// Refs
const scrollViewRef = ref(null);
// const menuOpened = ref(props.isLarge);
const menuOpened = ref(false);
const menuTemporaryOpened = ref(false);

// Methods
function toggleMenu(e) {
  const pointerEvent = e.event;
  pointerEvent.stopPropagation();
  if (menuOpened.value) {
    menuTemporaryOpened.value = false;
  }
  menuOpened.value = !menuOpened.value;
}

function handleSideBarClick() {
  if (menuOpened.value === false) {
    menuTemporaryOpened.value = true;
  }
  menuOpened.value = true;
}

// Computed
const drawerOptions = computed(() => {
  const shaderEnabled = !props.isLarge;

  return {
    menuMode: props.isLarge ? "shrink" : "overlap",
    menuRevealMode: props.isXSmall ? "slide" : "expand",
    minMenuSize: props.isXSmall ? 0 : 60,
    maxMenuSize: props.isXSmall ? 250 : undefined,
    closeOnOutsideClick: shaderEnabled,
    shaderEnabled
  };
});

// Watchers
watch(
  () => props.isLarge,
  () => {
    if (!menuTemporaryOpened.value) {
      menuOpened.value = props.isLarge;
    }
  }
);

watch(
  () => route.path,
  () => {
    if (menuTemporaryOpened.value || !props.isLarge) {
      menuOpened.value = false;
      menuTemporaryOpened.value = false;
    }
    scrollViewRef.value.instance.scrollTo(0);
  }
);
</script>

<template>
  <div class="side-nav-outer-toolbar">
    <header-toolbar
      class="layout-header"
      :menu-toggle-enabled="true"
      :toggle-menu-func="toggleMenu"
      :title="title"
    />
    <dx-drawer
      class="layout-body"
      position="before"
      template="menuTemplate"
      :opened-state-mode="drawerOptions.menuMode"
      :reveal-mode="drawerOptions.menuRevealMode"
      :min-size=0
      :max-size=0
      :shading="drawerOptions.shaderEnabled"
    >
      <dx-scroll-view ref="scrollViewRef" class="with-footer">
        <div class="content">
          <slot />
        </div>
        <slot name="footer" />
      </dx-scroll-view>
      <template #menuTemplate>
        <side-nav-menu
          :compact-mode="!menuOpened"
          @click="handleSideBarClick"
        />
      </template>
    </dx-drawer>
  </div>
</template>

<style lang="scss">
.side-nav-outer-toolbar {
  flex-direction: column;
  display: flex;
  height: 100%;
  width: 100%;
}

.layout-header {
  z-index: 1505;
}

</style>
