# Introduction — Contributing to Buggregator

We enthusiastically invite you to contribute to Buggregator Server! Whether you've uncovered a bug, have innovative
feature suggestions, or wish to contribute in any other capacity, we warmly welcome your participation. Simply open an
issue or submit a pull request on our GitHub repository to get started.

We use the [help wanted](https://github.com/buggregator/server/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%2)
label to categorize all issues that would benefit from your help in the repository.

### Why Should Developers Contribute to Open Source?

Open source contributions, such as to Buggregator Server, present a unique and rewarding opportunity, especially for
junior developers.

Here are a few reasons why you should consider contributing:

1. **Experiment with New Technologies:** Open source projects can expose you to technologies and frameworks you might
   not encounter in your daily job. It's an excellent opportunity to learn and try out new things.
2. **Expand Your Network:** Collaborating on open source projects connects you with a global community of developers.
   You can learn from their experiences, and they can learn from yours.
3. **Improve Your Résumé:** Potential employers often value open source contributions. They demonstrate initiative,
   technical competency, and the ability to work collaboratively
4. **Learn Best Practices:** Code reviews and feedback in open source projects are valuable learning tools. They expose
   you to different perspectives and ways to improve your code.
5. **Create Impact:** Your contributions can help others and make a meaningful impact on the project. The feeling of
   seeing your code being used by others is immensely satisfying.

**Remember, every great developer was once a beginner. Contributing to open source projects is a step in your journey to
becoming a better developer. So, don't hesitate to jump in and start contributing!**

**We appreciate any contributions to help make Buggregator better!***

## Backend part

### Server requirements

1. PHP 8.1

### Installation

1. Clone repository `git clone https://github.com/buggregator/server.git`
2. Install backend dependencies `composer install`
3. Download RoadRunner binary `vendor/bin/rr get-binary`
4. Install Centrifugo server `cd bin && ./get-binaries.sh`
5. Run RoadRunner server `./rr serve`

## Frontend part

1. Clone repository `git clone https://github.com/buggregator/fronend.git`
2. Install dependencies `yarn install`
3. Run NodeJS server `yarn dev`
4. Open http://localhost:3000

You can also run Storybook `yarn sb` to see all components in isolation with mocked data.

---

### Now you can start developing your own features and share them with the community!