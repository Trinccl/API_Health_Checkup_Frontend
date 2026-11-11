import { createWebHistory, createRouter } from "vue-router";

import Dashboard from "./Dashboard.vue";
import ApiDetails from "./ApiDetails.vue";
import ApiEdit from "./ApiEdit.vue";
import CreateApi from "./CreateApi.vue";
import LoginPage from "./LoginPage.vue";
import RegisterPage from "./RegisterPage.vue";
import VerifyEmail from "./VerifyEmail.vue";

const routes = [
  { path: "/dashboard", component: Dashboard },
  { path: "/dashboard/create", component: CreateApi },
  { path: "/dashboard/:id", component: ApiDetails },
  { path: "/dashboard/:id/edit", component: ApiEdit },
  { path: "/", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/verify-email", component: VerifyEmail },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
