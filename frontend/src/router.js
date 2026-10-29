import { createWebHistory, createRouter } from "vue-router";

import RegisterLoginPage from "./RegisterLoginPage.vue";
import Dashboard from "./Dashboard.vue";
import ApiDetails from "./ApiDetails.vue";

const routes = [
  { path: "/", component: RegisterLoginPage },
  { path: "/dashboard", component: Dashboard },
  { path: "/dashboard/:id", component: ApiDetails },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
