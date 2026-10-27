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
  // Note: We're using createMemoryHistory() here for compatibility
  //       with the Playground. In a real application you'd usually
  //       use createWebHistory() or createWebHashHistory() instead,
  //       tying the route to the browser URL. See the documentation
  //       for more information about history modes.
  history: createWebHistory(),
  routes,
});

export default router;
