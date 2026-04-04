<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import CopyMarkdown from './CopyMarkdown.vue'
import DocSearch from './DocSearch.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <DocSearch />
    </template>
    <template #doc-before>
      <div class="doc-copy-row">
        <CopyMarkdown />
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.doc-copy-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
</style>
