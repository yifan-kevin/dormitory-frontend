<template>
  <div class="layout-shell" @keydown.esc="closeNavigation">
    <button v-if="navigationOpen" type="button" class="navigation-backdrop" tabindex="-1" aria-label="关闭导航" @click="closeNavigation"></button>
    <aside id="workspace-navigation" class="layout-aside" :class="{ 'is-open': navigationOpen }">
      <Aside @navigate="closeNavigation" />
    </aside>
    <section class="layout-workspace">
      <Header :navigation-open="navigationOpen" @toggle-navigation="toggleNavigation" />
      <main id="main-content" class="layout-content">
        <router-view />
      </main>
    </section>
    <AssistantMini v-if="showAssistantMini" />
  </div>
</template>

<script>
import Aside from "@/components/Aside";
import Header from "@/components/Header";
import AssistantMini from "@/components/AssistantMini.vue";

export default {
  name: "Layout",
  components: { Aside, Header, AssistantMini },
  data() { return { navigationOpen: false }; },
  computed: {
    showAssistantMini() { return this.$route.path !== "/aiAssistant"; }
  },
  watch: {
    "$route.path"() { this.closeNavigation(); }
  },
  methods: {
    toggleNavigation() {
      this.navigationOpen = !this.navigationOpen;
      if (this.navigationOpen) this.$nextTick(() => this.$el.querySelector(".aside-close")?.focus());
    },
    closeNavigation() {
      if (!this.navigationOpen) return;
      this.navigationOpen = false;
      this.$nextTick(() => this.$el.querySelector(".header-navigation-toggle")?.focus());
    }
  }
};
</script>

<style scoped>
.layout-shell { display: flex; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; background: var(--background-color); }
.layout-aside { flex: 0 0 240px; width: 240px; min-height: 0; background: var(--navigation-color); }
.layout-workspace { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
.layout-content { flex: 1; min-height: 0; min-width: 0; width: 100%; overflow-y: auto; overflow-x: hidden; padding: 28px clamp(24px, 2.5vw, 40px) 70px; scrollbar-width: thin; }
.layout-content > :deep(.page-shell) { max-width: 1440px; margin: 0 auto; }
.navigation-backdrop { display: none; }
@media (max-width: 1100px) {
  .layout-aside { flex-basis: 218px; width: 218px; }
  .layout-content { padding: 24px 22px 64px; }
}
@media (max-width: 768px) {
  .layout-aside { position: fixed; inset: 0 auto 0 0; z-index: 2001; width: 250px; height: 100%; visibility: hidden; transform: translateX(-100%); transition: transform .18s ease, visibility .18s; box-shadow: 8px 0 24px rgba(27, 39, 31, .06); }
  .layout-aside.is-open { visibility: visible; transform: translateX(0); }
  .navigation-backdrop { display: block; position: fixed; inset: 0; z-index: 2000; border: 0; background: rgba(27, 39, 31, .3); }
  .layout-content { padding: 22px 16px 70px; }
}
</style>
