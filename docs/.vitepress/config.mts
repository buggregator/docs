import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "Buggregator docs",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: 'Docs', link: '/'},
        ],

        sidebar: [
            {
                text: 'What is Buggregator?',
                link: '/',
            },
            {
                text: 'Getting Started',
                link: '/getting-started',
            },
            {
                text: 'Contributing',
                items: [
                    {
                        text: 'Architecture',
                        link: '/contributing/architecture',
                    },
                    {
                        text: 'Server',
                        link: '/contributing/server',
                    },
                    {
                        text: 'Frontend',
                        link: '/contributing/frontend',
                    },
                ]
            },

            {
                text: 'Configuration',
                items: [
                    {text: 'XHProf', link: '/config/xhprof'},
                    {text: 'VarDumper', link: '/config/var-dumper'},
                    {text: 'Ray', link: '/config/ray'},
                    {text: 'Sentry', link: '/config/sentry'},
                    {text: 'SMTP server', link: '/config/smtp'},
                    {text: 'Monolog', link: '/config/monolog'},
                    {text: 'Inspector', link: '/config/inspector'},
                    {text: 'Http Dumps', link: '/config/http-dumps'},
                ]
            }
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/buggregator/server'},
            {icon: 'discord', link: 'https://discord.gg/vDsCD3EKUB'},
            {icon: 'twitter', link: 'https://twitter.com/buggregator'},
        ]
    }
})
