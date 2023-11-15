import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "A VitePress Site",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: 'Home', link: '/'},
            {text: 'Docs', link: '/intro'}
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    {
                        text: 'What is Buggregator?',
                        link: '/intro',
                    },
                    {
                        text: 'Getting Started',
                        link: '/getting-started',
                    },
                    {
                        text: 'Contributing',
                        link: '/contributing',
                    },
                ]
            },

            {
                text: 'Configuration',
                items: [
                    {text: 'Sentry', link: '/config/sentry'},
                    {text: 'VarDumper', link: '/config/var-dumper'},
                    {text: 'XHProf', link: '/config/xhprof'},
                    {text: 'Monolog', link: '/config/monolog'},
                    {text: 'Ray', link: '/config/ray'},
                    {text: 'Inspector', link: '/config/inspector'},
                ]
            }
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/buggregator/server'},
            {icon: 'discord', link: 'https://discord.gg/FTpBM7xU'},
            {icon: 'twitter', link: 'https://twitter.com/buggregator'},
        ]
    }
})
