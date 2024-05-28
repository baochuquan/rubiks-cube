import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import RubiksCube01 from '../components/RubiksCube01.vue';
import RubiksCube02 from '../components/RubiksCube02.vue';
import RubiksCube03 from '../components/RubiksCube03.vue';

const routes = [
    {
        path: "/",
        component: HomePage
    },
    {
        path: "/rubiks-cube-01",
        component: RubiksCube01
    },
    {
        path: "/rubiks-cube-02",
        component: RubiksCube02
    },
    {
        path: '/rubiks-cube-03',
        component: RubiksCube03
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

export default router;