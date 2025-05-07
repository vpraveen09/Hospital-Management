<script setup>
import DxButton from "devextreme-vue/button";
import DxToolbar, { DxItem } from "devextreme-vue/toolbar";
import { useRouter, useRoute } from 'vue-router';
import { computed, ref, watch, onMounted } from 'vue';
import { usersStore } from "@/stores/users";
import { sessionStore } from "@/stores/session";
import { call } from 'frappe-ui';
import UserPanel from "./user-panel";
import ThemeSwitcher from './theme-switcher.vue';

const breadcrumbLabel = ref("Loading...");

// Props
const props = defineProps({
  menuToggleEnabled: Boolean,
  title: String,
  toggleMenuFunc: Function,
  logOutFunc: Function
});

const windowWidth = ref(window.innerWidth);


window.addEventListener("resize", () => {
  windowWidth.value = window.innerWidth;
});

// Router and Route
const router = useRouter();
const route = useRoute();

// Reactive email reference
const email = ref("");

// Session and User Store
const { logout } = sessionStore();
const { getUser } = usersStore();

// Computed user data
const user = computed(() => getUser() || {});

// Watch for user changes
watch(user, (newUser) => {
  if (newUser && newUser.first_name) {
    email.value = newUser;
  }
});
// const breadcrumbLabel = ref("Loading...");

const fetchShortcutLabel = async () => {
  // console.log("🔍 fetchShortcutLabel function called after onMounted");

  // const currentPath = window.location.pathname;
  // console.log("🌍 Current Path:", currentPath);

  const pathSegments = window.location.pathname.split("/").filter(Boolean);  // Remove empty elements
  const currentPath = `/${pathSegments.slice(0, 2).join("/")}`;

  try {
    const response = await call(
      "axe_product.api.doc.get_workspace_shortcuts", {
      current_path: currentPath
    });

    // console.log("📦 Frappe Response:", response);

    if (response && response.length > 0) {
      const matchedShortcut = response[0]
      // Find the shortcut that matches the current URL

      breadcrumbLabel.value = matchedShortcut.parent || "Unknown";
      // console.log("✅ Breadcrumb Label Set:", breadcrumbLabel.value);
    }
  } catch (error) {
    breadcrumbLabel.value = "Error";
  }
};

onMounted(async () => {
  // console.log("🚀 onMounted triggered!");
  // await nextTick(); // Ensures DOM is ready
  fetchShortcutLabel(); // Call the function properly
});
// User menu items
const userMenuItems = [
  // {
  //   text: "Profile",
  //   icon: "user",
  //   onClick: onProfileClick
  // },
  // {
  //   text: "Desk",
  //   icon: "box",
  //   onClick: onDeskClick,
  // },
  // {
  //   text: "Logout",
  //   icon: "runner",
  //   onClick: onLogoutClick
  // }
];

// Logout function
function onLogoutClick() {
  logout.submit();
}

// Navigate to Profile
function onProfileClick() {
//   router.push({
//     path: "/profile",
//     query: { redirect: route.path },
//   });
}

// Navigate to Desk
function onDeskClick() {
  window.location.href = "/app"
}

function onReceivingClick() {
  window.location.href = `/app/${breadcrumbLabel.value.toLowerCase()}`;
}

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean);
  const breadcrumbList = [];

  if (pathSegments.length > 0) {
    let pathAccumulator = '';

    // Iterate over each segment, adding it to the breadcrumb list
    pathSegments.forEach((segment, index) => {
      pathAccumulator += `/${segment}`;
      const matchedRoute = router.getRoutes().find((r) => r.path === pathAccumulator);

      breadcrumbList.push({
        text: matchedRoute?.meta?.breadcrumb || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: pathAccumulator,
      });
    });
  }

  // Responsive Breadcrumbs Logic
  const maxVisible = 1; // Number of visible breadcrumbs on small screens
  if (windowWidth.value < 768 && breadcrumbList.length > maxVisible) {
    const firstBreadcrumb = breadcrumbList[0]; // First breadcrumb (e.g., "Receiving")
    const lastBreadcrumb = breadcrumbList[breadcrumbList.length - 1]; // Last breadcrumb

    return [{ text: '...', path: '/' }, lastBreadcrumb];
  }

  return breadcrumbList;
});

</script>

<template>
  <header class="header-component">
    <dx-toolbar class="header-toolbar">
      <dx-item :visible="menuToggleEnabled" location="before" css-class="menu-button">
        <template #default>
          <!-- <img src="@/assets/logo.png" alt="Logo" class="menu-logo"/> -->
          <!-- <dx-button icon="menu" styling-mode="text" @click="toggleMenuFunc" /> -->
          <!-- <dx-button icon="/assets/axe_product/images/logo2.png" styling-mode="text" @click="toggleMenuFunc" /> -->
          <!-- <span class="logo-letter" @click="onDeskClick">A</span> -->
        </template>
      </dx-item>

      <dx-item location="before" css-class="breadcrumbs-container">
        <template #default>
          <!-- <img src="./assets/logo.png"> -->
          <div class="breadcrumbs">
            <!-- <span class="logo-letter" @click="onDeskClick">A</span> -->
            <img src="../assets/alogo.jpg" alt="Logo" class="menu-logo" @click="onDeskClick" />
            <span class="breadcrumb-separator">></span>
            <a href="#" @click="onReceivingClick">{{ breadcrumbLabel }}</a><span class="breadcrumb-separator">></span>
            <span v-for="(breadcrumb, index) in breadcrumbs" :key="index">

              <template v-if="breadcrumb.text === '...'">
                <span class="breadcrumb-placeholder">...</span>
              </template>
              <template v-else>
                <router-link :to="breadcrumb.path" :class="{ 'current-breadcrumb': index === breadcrumbs.length - 1 }">
                  {{ breadcrumb.text }}
                </router-link>
              </template>
              <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">></span>
            </span>
          </div>
        </template>
      </dx-item>

      <!-- <dx-item v-if="title" location="before" css-class="header-title dx-toolbar-label">
        <div>{{ title }}</div>
      </dx-item> -->

      <dx-item location="after">
        <dx-button class="theme-button" styling-mode="text" :icon="'optionsgear'" />
      </dx-item>

      <!-- <dx-item location="after">
        <div><theme-switcher /></div>
      </dx-item> -->

      <dx-item location="after">
           </dx-item>
      <dx-item location="after" locate-in-menu="auto" menu-item-template="menuUserItem">
        <template #default>
          <user-panel />

        </template>
      </dx-item>

      <template #menuUserItem>
        <user-panel />

      </template>
    </dx-toolbar>
  </header>
</template>

<style lang="scss">
@import "../dx-styles.scss";

.header-component {
  flex: 0 0 auto;
  z-index: 1;
  border-bottom: 1px solid var(--base-border-color);
}

.breadcrumbs-container {
  margin-right: 20px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
}

.menu-logo {
  width: 28px;
  height: auto;
  // cursor: pointer;
  // margin-right: 10px;
}

.breadcrumbs a {
  text-decoration: none;
  color: var(--nav-bar-color) !important;
  font-size:15px;
  letter-spacing: 0.02em;
  font-weight:500;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  font-size: medium;
  margin: 0 8px;
}

.breadcrumbs .current-breadcrumb {
  letter-spacing: 0.02em;
  font-weight: 500;
  color: #7c7c7c !important;
}

.breadcrumb-placeholder {
  color: var(--base-header-row-color);
  cursor: default;
}

.dx-toolbar .dx-toolbar-items-container {
  background-color: var(--base-bg);
  height: 48px !important;
}

.header-title .dx-item-content {
  padding: 0;
  margin: 0;
}

@media (max-width: 768px) {
  .breadcrumbs {
    font-size: 12px;
    flex-wrap: wrap;
  }

  .menu-logo {
    width: 30px;
    margin-right: 5px;
  }

  // .dx-toolbar .dx-toolbar-item.dx-toolbar-button.menu-button {
  //   width: 52px;
  // }
}
</style>
