import DefaultTheme from 'vitepress/theme'
import './docsearch-dark.css'
import Layout from './Layout.vue'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {

    }
}
