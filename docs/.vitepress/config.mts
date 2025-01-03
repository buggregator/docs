import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    ignoreDeadLinks: true,
    title: "Buggregator docs",
    description: "Buggregator docs",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        search: {
            provider: 'local'
        },

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
                text: 'Trap',
                items: [
                    {
                        text: 'What is Trap?',
                        link: '/trap/what-is-trap',
                    },
                    {
                        text: 'Getting Started',
                        link: '/trap/getting-started',
                    }
                ]
            },

            {
                text: 'Integrations',
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
            },

            {
                text: 'Configuration',
                items: [
                    {text: 'RoadRunner', link: '/config/roadrunner'},
                    {text: 'Projects', link: '/config/projects'},
                    {text: 'Webhooks', link: '/config/webhooks'},
                    {text: 'Single Sign On (SSO)', link: '/config/sso'},
                    {text: 'External Database', link: '/config/external-db'},
                    {text: 'Metrics', link: '/config/metrics'},
                ]
            },

            {
                text: 'Cookbook',
                items: [
                    {text: 'Dev environment using docker', link: '/cookbook/docker-install'},
                    {text: 'Dev environment', link: '/cookbook/manual-install'},
                ]
            },

            {
                text: 'Contributing',
                items: [
                    {
                        text: 'Getting Started',
                        link: '/contributing',
                    },
                    {
                        text: 'Server',
                        link: '/contributing/server',
                    },
                    {
                        text: 'Frontend',
                        link: '/contributing/frontend',
                    },
                    {
                        text: 'Documentation',
                        link: '/contributing/docs',
                    },
                ]
            },
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/buggregator/server'},
            {icon: 'discord', link: 'https://discord.gg/vDsCD3EKUB'},
            {icon: 'twitter', link: 'https://twitter.com/buggregator'},
        ]
    }
})
