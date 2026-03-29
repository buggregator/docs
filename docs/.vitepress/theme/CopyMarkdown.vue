<script setup lang="ts">
import { ref } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()
const copied = ref(false)

async function copyMarkdown() {
  const mdPath = page.value.relativePath
  const url = `${window.location.origin}/${mdPath}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${url}`)
    const text = await res.text()
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy markdown:', e)
  }
}
</script>

<template>
  <button class="copy-md-btn" :class="{ copied }" @click="copyMarkdown" :title="copied ? 'Copied!' : 'Copy page as Markdown'">
    <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>{{ copied ? 'Copied!' : 'Copy as Markdown' }}</span>
  </button>
</template>

<style scoped>
.copy-md-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}

.copy-md-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-md-btn.copied {
  border-color: var(--vp-c-green-2);
  color: var(--vp-c-green-1);
}
</style>
