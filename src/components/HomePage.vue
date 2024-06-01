<script setup>
import ForkMeOnGitHub from './ForkMeOnGitHub.vue';

</script>

<template>
    <div>
      <ForkMeOnGitHub/>
      <h1>基于 Threejs 的 3D 魔方设计与实现</h1>
      <nav>
        <router-link to="/rubiks-cube-01">魔方建模</router-link> | 
        <router-link to="/rubiks-cube-02">魔方控制</router-link> |
        <router-link to="/rubiks-cube-03">魔方还原</router-link>
      </nav>
    </div>
  </template>