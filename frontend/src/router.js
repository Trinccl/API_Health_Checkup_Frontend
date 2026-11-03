import { createWebHistory, createRouter } from "vue-router";

import Dashboard from "./Dashboard.vue";
import ApiDetails from "./ApiDetails.vue";
import LoginPage from "./LoginPage.vue";
import RegisterPage from "./RegisterPage.vue";

const routes = [
  { path: "/dashboard", component: Dashboard },
  { path: "/dashboard/:id", component: ApiDetails },
  { path: "/", component: LoginPage },
  { path: "/register", component: RegisterPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
