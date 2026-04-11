<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const query = ref('')
const results = ref<SearchHit[]>([])
const isLoading = ref(false)
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const resultsRef = ref<HTMLElement | null>(null)

interface SearchHit {
  url: string
  title: string
  breadcrumbs: string[]
  contentHighlight: string
  htmlContent: string
  contentType: string
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const open = () => { isOpen.value = true; nextTick(() => inputRef.value?.focus()) }
const close = () => { isOpen.value = false; query.value = ''; results.value = []; selectedIndex.value = 0 }

const search = async (q: string) => {
  if (!q.trim()) { results.value = []; return }
  isLoading.value = true
  try {
    const params = new URLSearchParams({
      q,
      query_by: 'hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3,content',
      include_fields: 'url,content,content_type,html_content,hierarchy.lvl0,hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3',
      highlight_full_fields: 'content,hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3',
      highlight_start_tag: '<mark>',
      highlight_end_tag: '</mark>',
      per_page: '20',
      prioritize_exact_match: 'false',
    })
    const res = await fetch(`/api/search?${params}`)
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    results.value = (data.hits || []).map((hit: any) => {
      const doc = hit.document
      const hl = hit.highlights || []

      // Build highlighted breadcrumbs from highlights (with <mark>)
      const getHl = (field: string) => hl.find((h: any) => h.field === field)?.snippet || ''
      const contentHl = getHl('content')

      // Build breadcrumbs: use highlighted version if available, else plain
      const crumbs: string[] = []
      const lvl0 = doc['hierarchy.lvl0']
      if (lvl0 && lvl0 !== 'Buggregator docs') crumbs.push(lvl0)
      if (doc['hierarchy.lvl1']) crumbs.push(getHl('hierarchy.lvl1') || doc['hierarchy.lvl1'])
      if (doc['hierarchy.lvl2']) crumbs.push(getHl('hierarchy.lvl2') || doc['hierarchy.lvl2'])
      if (doc['hierarchy.lvl3']) crumbs.push(getHl('hierarchy.lvl3') || doc['hierarchy.lvl3'])

      // Title: deepest heading level
      const title = doc['hierarchy.lvl3'] || doc['hierarchy.lvl2'] || doc['hierarchy.lvl1'] || lvl0 || ''

      return {
        url: doc.url || '',
        title,
        breadcrumbs: crumbs,
        contentHighlight: contentHl,
        htmlContent: doc.html_content || '',
        contentType: doc.content_type || 'text',
      }
    })
    selectedIndex.value = 0
  } catch (err) { console.error('[Search]', err); results.value = [] }
  finally { isLoading.value = false }
}

/**
 * Highlight search terms in HTML content.
 * Wraps matching terms in text nodes with <mark> tags.
 */
function highlightHtml(html: string, q: string): string {
  if (!q.trim() || !html) return html
  const terms = q.trim().split(/\s+/).filter(t => t.length > 1)
  if (!terms.length) return html
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  // Only highlight in text nodes — avoid breaking HTML tags
  return html.replace(/>([^<]+)</g, (match, text) => {
    return '>' + text.replace(pattern, '<mark>$1</mark>') + '<'
  })
}

const onInput = () => { if (debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(() => search(query.value), 200) }

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1); scrollTo() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex.value = Math.max(selectedIndex.value - 1, 0); scrollTo() }
  else if (e.key === 'Enter' && results.value[selectedIndex.value]) { e.preventDefault(); go(results.value[selectedIndex.value].url) }
  else if (e.key === 'Escape') close()
}

const scrollTo = () => nextTick(() => resultsRef.value?.querySelector(`[data-index="${selectedIndex.value}"]`)?.scrollIntoView({ block: 'nearest' }))

const go = (url: string) => { close(); window.location.href = url }

const handleGlobalKey = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement
  if (el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return
  if ((e.key?.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') { e.preventDefault(); open() }
}

onMounted(() => window.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', handleGlobalKey))
</script>

<template>
  <div class="ts-search-wrapper">
  <!-- Trigger -->
  <button class="ts-search-btn" aria-label="Search" @click="open">
    <svg class="ts-search-btn__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
      <circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
    </svg>
    <span class="ts-search-btn__text">Search</span>
    <span class="ts-search-btn__keys"><kbd>⌘</kbd><kbd>K</kbd></span>
  </button>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="ts-fade">
      <div v-if="isOpen" class="ts-overlay" @click.self="close">
        <div class="ts-modal">
          <div class="ts-header">
            <svg class="ts-header__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
            </svg>
            <input ref="inputRef" v-model="query" class="ts-header__input" type="text" placeholder="Search documentation..." autocomplete="off" @input="onInput" @keydown="onKeydown" />
            <button class="ts-header__close" @click="close"><kbd>esc</kbd></button>
          </div>
          <div ref="resultsRef" class="ts-results">
            <div v-if="isLoading && !results.length" class="ts-empty">Searching...</div>
            <div v-else-if="query && !results.length && !isLoading" class="ts-empty">No results for "{{ query }}"</div>
            <div v-else-if="!query" class="ts-empty">Type to search documentation</div>
            <a v-for="(hit, i) in results" :key="hit.url + i" :href="hit.url" class="ts-hit" :class="{ 'ts-hit--sel': i === selectedIndex }" :data-index="i" @click.prevent="go(hit.url)" @mouseenter="selectedIndex = i">

              <!-- Breadcrumbs path -->
              <div class="ts-hit__crumbs">
                <span class="ts-hit__icon">#</span>
                <template v-for="(c, ci) in hit.breadcrumbs" :key="ci">
                  <span v-if="ci > 0" class="ts-hit__sep">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                  </span>
                  <span class="ts-hit__crumb" v-html="c" />
                </template>
              </div>

              <!-- Rich HTML excerpt -->
              <div v-if="hit.htmlContent" class="ts-hit__excerpt" :class="{ 'ts-hit__excerpt--code': hit.contentType === 'code' }">
                <div class="ts-hit__excerpt-inner vp-doc" v-html="highlightHtml(hit.htmlContent, query)" />
                <div class="ts-hit__excerpt-fade" />
              </div>

              <!-- Fallback: Typesense highlighted snippet -->
              <div v-else-if="hit.contentHighlight" class="ts-hit__content" v-html="hit.contentHighlight" />
            </a>
          </div>
          <div class="ts-footer">
            <span class="ts-footer__hint"><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span class="ts-footer__hint"><kbd>↵</kbd> open</span>
            <span class="ts-footer__hint"><kbd>esc</kbd> close</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  </div>
</template>

<style>
/* Wrapper — matches VPNavBarSearch layout */
.ts-search-wrapper {
  display: flex;
  align-items: center;
}

@media (min-width: 768px) {
  .ts-search-wrapper {
    flex-grow: 1;
    padding-left: 24px;
  }
}

@media (min-width: 960px) {
  .ts-search-wrapper {
    padding-left: 32px;
  }
}

/* Button */
.ts-search-btn {
  display: flex; align-items: center; gap: 6px; padding: 0 10px; height: 36px;
  border-radius: 8px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-3); font-size: 13px; cursor: pointer; transition: border-color 0.2s;
}
.ts-search-btn:hover { border-color: var(--vp-c-brand-1); }
.ts-search-btn__icon { width: 15px; height: 15px; flex-shrink: 0; }
.ts-search-btn__text { font-size: 13px; }
.ts-search-btn__keys { display: none; }
@media (min-width: 768px) { .ts-search-btn__keys { display: flex; align-items: center; gap: 2px; margin-left: 8px; } }
.ts-search-btn__keys kbd {
  font-size: 11px; padding: 1px 4px; border-radius: 3px;
  border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-3); font-family: inherit; background: none;
}

/* Overlay */
.ts-overlay {
  position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center; padding-top: 8vh;
}
.ts-modal {
  width: 100%; max-width: 750px; max-height: 82vh; margin: 0 16px;
  background: var(--vp-c-bg-soft, #1e293b); border: 1px solid var(--vp-c-divider);
  border-radius: 12px; display: flex; flex-direction: column;
  box-shadow: 0 25px 60px -12px rgba(0,0,0,0.5);
}

/* Header */
.ts-header {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider); flex-shrink: 0;
}
.ts-header__icon { width: 18px; height: 18px; color: var(--vp-c-brand-1); flex-shrink: 0; }
.ts-header__input { flex: 1; background: none; border: none; outline: none; font-size: 15px; color: var(--vp-c-text-1); font-family: inherit; }
.ts-header__input::placeholder { color: var(--vp-c-text-3); }
.ts-header__close { flex-shrink: 0; cursor: pointer; background: none; border: none; }
.ts-header__close kbd { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-3); font-family: inherit; }

/* Results */
.ts-results { flex: 1; overflow-y: auto; padding: 8px; }
.ts-empty { padding: 32px 16px; text-align: center; color: var(--vp-c-text-3); font-size: 14px; }

/* Hit */
.ts-hit {
  display: block; padding: 10px 14px; border-radius: 8px; cursor: pointer;
  text-decoration: none; color: inherit; border: 2px solid transparent; transition: all 0.1s;
  margin-bottom: 4px;
}
.ts-hit:hover, .ts-hit--sel {
  background: var(--vp-c-bg-alt); border-color: var(--vp-c-brand-1);
}

/* Breadcrumbs */
.ts-hit__crumbs {
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  font-size: 13px; color: var(--vp-c-text-2); margin-bottom: 6px;
  line-height: 1.4;
}
.ts-hit__icon {
  color: var(--vp-c-brand-1); font-weight: 600; opacity: 0.6; margin-right: 2px;
}
.ts-hit--sel .ts-hit__icon { opacity: 1; }
.ts-hit__sep {
  color: var(--vp-c-text-3); display: flex; align-items: center; opacity: 0.5;
}
.ts-hit__crumb {
  white-space: nowrap;
}
.ts-hit__crumb:last-child {
  font-weight: 600; color: var(--vp-c-text-1);
}
.ts-hit__crumbs mark {
  background: rgba(99,102,241,0.25); color: var(--vp-c-brand-1); padding: 1px 2px; border-radius: 2px;
}

/* Plain text content (fallback) */
.ts-hit__content {
  font-size: 13px; line-height: 1.6; color: var(--vp-c-text-2);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
}
.ts-hit__content mark {
  background: rgba(99,102,241,0.25); color: var(--vp-c-brand-1); padding: 1px 2px; border-radius: 2px;
}

/* Rich HTML excerpt */
.ts-hit__excerpt {
  position: relative;
  max-height: 100px;
  overflow: hidden;
  pointer-events: none;
  transition: max-height 0.15s ease;
}

.ts-hit--sel .ts-hit__excerpt {
  max-height: 180px;
}

.ts-hit__excerpt-inner {
  font-size: 0.8rem !important;
  line-height: 1.5 !important;
  color: var(--vp-c-text-2);
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.ts-hit--sel .ts-hit__excerpt-inner {
  opacity: 1;
}

/* Highlight matches in excerpts */
.ts-hit__excerpt-inner mark {
  background: rgba(99,102,241,0.3) !important;
  color: var(--vp-c-brand-1) !important;
  padding: 1px 3px;
  border-radius: 2px;
}

/* Code blocks in excerpts */
.ts-hit__excerpt-inner pre {
  margin: 0 !important;
  padding: 8px 12px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
  overflow: hidden !important;
  background: var(--vp-code-block-bg, rgba(0,0,0,0.3)) !important;
}

.ts-hit__excerpt-inner code {
  font-family: var(--vp-font-family-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace) !important;
  font-size: 12px !important;
}

/* Inline code in text results */
.ts-hit__excerpt-inner :not(pre) > code {
  background: var(--vp-code-block-bg, rgba(0,0,0,0.2)) !important;
  padding: 2px 5px !important;
  border-radius: 3px !important;
}

.ts-hit__excerpt-inner p {
  margin: 0 !important;
}

.ts-hit__excerpt-inner ul,
.ts-hit__excerpt-inner ol {
  margin: 0 !important;
  padding-left: 1.2em !important;
}

.ts-hit__excerpt-inner li {
  font-size: 0.8rem !important;
  line-height: 1.5 !important;
}

.ts-hit__excerpt-inner a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.ts-hit__excerpt-inner table {
  font-size: 0.75rem !important;
  border-collapse: collapse;
  width: 100%;
}

.ts-hit__excerpt-inner th,
.ts-hit__excerpt-inner td {
  padding: 4px 8px !important;
  border: 1px solid var(--vp-c-divider);
}

/* Code excerpt extra styling */
.ts-hit__excerpt--code .ts-hit__excerpt-inner {
  opacity: 0.7;
}

.ts-hit--sel .ts-hit__excerpt--code .ts-hit__excerpt-inner {
  opacity: 1;
}

/* Fade gradient at bottom */
.ts-hit__excerpt-fade {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 24px;
  background: linear-gradient(transparent, var(--vp-c-bg-soft, #1e293b));
  pointer-events: none;
}

.ts-hit:hover .ts-hit__excerpt-fade,
.ts-hit--sel .ts-hit__excerpt-fade {
  background: linear-gradient(transparent, var(--vp-c-bg-alt));
}

/* Footer */
.ts-footer {
  display: flex; align-items: center; gap: 16px; padding: 10px 16px;
  border-top: 1px solid var(--vp-c-divider); flex-shrink: 0;
}
.ts-footer__hint { font-size: 12px; color: var(--vp-c-text-3); }
.ts-footer__hint kbd { font-size: 11px; padding: 1px 4px; border-radius: 3px; background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-3); font-family: inherit; margin-right: 2px; }

/* Transition */
.ts-fade-enter-active { transition: opacity 0.15s ease; }
.ts-fade-leave-active { transition: opacity 0.1s ease; }
.ts-fade-enter-from, .ts-fade-leave-to { opacity: 0; }
</style>
