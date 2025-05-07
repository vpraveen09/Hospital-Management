import auth from "./auth";
import { createRouter, createWebHistory } from "vue-router";
import { userResource } from '@/stores/user'
import { sessionStore } from '@/stores/session'

import Profile from "./views/profile-page";
import Tasks from "./views/tasks-page";
import defaultLayout from "./layouts/side-nav-outer-toolbar";
import simpleLayout from "./layouts/single-card";
import customersListView from "./views/customersListView.vue";
// import inboundInquery from "./views/receiving/inboundInquiry/inbound-inquiry.vue";

// import checkIn from "./views/receiving/material_checkin/check-in.vue";
// import createOrder from "./views/receiving/inboundInquiry/inbound-inquiry-order-create.vue";
// import inbounInquiryOrderUpdate from "./views/receiving/inboundInquiry/inboun-inquiry-order-update.vue";
// import truckCheckIn from "./views/receiving/truck-check-in.vue";

// // purchase order
// import purchase_order_home from "./views/purchase_order/purchase_order_home.vue";
// import purchase_order_create from "./views/purchase_order/purchase_order_create.vue";
// import purchase_order_update from "./views/purchase_order/purchase_order_update.vue";
import patientList from "./views/patient/patientList.vue";
import PatientForm from "./views/patient/patientForm.vue";

function loadView(view) {
  return () => import(/* webpackChunkName: "login" */ `./views/${view}.vue`)
}

const router = new createRouter({
  routes: [
    {
      path: '/',
      redirect: { name: 'patient-list' },
      name: 'dashboard',
    },
    // {
    //   path: '/profile',
    //   name: "profile",
    //   meta: {
    //     requiresAuth: true,
    //     layout: defaultLayout
    //   },
    //   component: Profile
    // },
    // {
    //   path: "/tasks",
    //   name: "tasks",
    //   meta: {
    //     requiresAuth: true,
    //     layout: defaultLayout
    //   },
    //   component: Tasks
    // },
    // {
    //   path: "/customers",
    //   name: "customers",
    //   meta: {
    //     requiresAuth: true,
    //     layout: defaultLayout
    //   },
    //   component: customersListView
    // },
    {
      path: '/patient-list',
      name: 'patient-list',
      meta: {
        requiresAuth: true,
        layout: defaultLayout,
        breadcrumb: 'Patient-List'
      },
      component: patientList,
    },
	{
		path: '/patient-form',
		name: 'patient-form',
		meta: {
		  requiresAuth: true,
		  layout: defaultLayout,
		  breadcrumb: 'patient-form'
		},
		component: PatientForm,
	},
// 	{
// 		path: '/inbound-inquiry/update',
// 		name: 'updateOrder',
// 		meta: {
// 		  requiresAuth: true,
// 		  layout: defaultLayout,
// 		  breadcrumb: 'Update'
// 		},
// 		component: inbounInquiryOrderUpdate,
// 	},
// 	{
// 		path: '/inbound-inquiry/truck-check-in',
// 		name: 'truckCheckin',
// 		meta: {
// 		  requiresAuth: true,
// 		  layout: defaultLayout,
// 		  breadcrumb: 'TruckCheckin'
// 		},
// 		component: truckCheckIn,
// 	},
//     {
//       path: "/login-form",
//       name: "login-form",
//       meta: {
//         requiresAuth: false,
//         layout: simpleLayout,
//         title: "Sign In"
//       },
//       component: loadView("login-form")
//     },
//     {
//       path: "/reset-password",
//       name: "reset-password",
//       meta: {
//         requiresAuth: false,
//         layout: simpleLayout,
//         title: "Reset Password",
//         description: "Please enter the email address that you used to register, and we will send you a link to reset your password via Email."
//       },
//       component: loadView("reset-password-form")
//     },
//     {
//       path: "/create-account",
//       name: "create-account",
//       meta: {
//         requiresAuth: false,
//         layout: simpleLayout,
//         title: "Sign Up"
//       },
//       component: loadView("create-account-form"),
//     },
//     {
//       path: "/change-password/:recoveryCode",
//       name: "change-password",
//       meta: {
//         requiresAuth: false,
//         layout: simpleLayout,
//         title: "Change Password"
//       },
//       component: loadView("change-password-form")
//     },
//     {
//       path: '/inbound-inquiry',
//       name: 'inbound-inquiry',
//       meta: {
//         requiresAuth: true,
//         layout: defaultLayout,
//         breadcrumb: 'Inbound Inquiry'
//       },
//       component: inboundInquery,  // your component that contains the tabs
//     },
//     {
//       path: '/purchase-order',
//       name: 'purchase-order',
//       meta: {
//         requiresAuth: true,
//         layout: defaultLayout,
//         breadcrumb: 'Purchase Order',
//         title:"Purchase Order"
//       },
//       component: purchase_order_home,
//     },
//     {
//       path: '/purchase-order/create',
//       name: 'purchase-order-create',
//       meta: {
//         // requiresAuth: true,
//         layout: defaultLayout,
//         // breadcrumb: 'General'
//          title:'Purchase Order Create'
//       },
//       component: purchase_order_create,
//     },
//     {
//       path: '/purchase-order/update',
//       name: 'purchase-order-update',
//       meta: {
//         // requiresAuth: true,
//         layout: defaultLayout,
//         // breadcrumb: 'General'
//          title:'Purchase Order Update'
//       },
//       component: purchase_order_update,
//     }

  ],
  history: createWebHistory('/')
});


// router.beforeEach(async (to, from, next) => {
//   const { isLoggedIn } = sessionStore()

//   console.log("isLoggedIn", isLoggedIn);


//   isLoggedIn && (await userResource.promise)

//   if (from.meta?.scrollPos) {
//     from.meta.scrollPos.top = document.querySelector('#list-rows')?.scrollTop
//   }

//   if (to.name === 'dashboard' && isLoggedIn) {
//     next({ name: 'home' })
//   } else if (!isLoggedIn) {
//     window.location.href = '/login?redirect-to=/axe_product'
//   }
//   else {
//     next()
//   }
// })

export default router;
