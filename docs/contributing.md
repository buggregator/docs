# Introduction — Contributing to Buggregator

We're excited to invite you to contribute to the project! Your involvement is crucial, whether it's reporting bugs,
suggesting new features, or any other form of contribution. To get started,
simply [create an issue](https://github.com/buggregator/server/issues) or submit a pull request on our GitHub
repository.

In our repository, we categorize issues that are open for community contribution using
the [`for contributors`](https://github.com/buggregator/server/issues?q=is%3Aissue+is%3Aopen+label%3A%22for+contributors%22)
label. This makes it easier for you to find ways to participate.

Additionally, we use labels such as `c:easy`, `c:medium`, and `c:difficult` to indicate the complexity level of issues,
helping you choose tasks that match your skill level.

### The Benefits of Contributing to Open Source for Developers

Contributing to open source projects offers a wealth of benefits, particularly for junior developers.

**Here's why you should consider getting involved:**

1. **Learning Through Practical Experience:** Open source projects provide a platform to work with new technologies and
   frameworks that you might not encounter in your regular job. It's a fantastic way to broaden your technical horizons.
2. **Building a Professional Network:** By participating in open source, you connect with a global community of
   developers. This network is invaluable for exchanging knowledge, learning from others' experiences, and sharing your
   own insights.
3. **Enhancing Your Résumé:** Contributions to open source are often highly regarded by employers. They showcase your
   proactive nature, technical skills, and ability to collaborate effectively in a team.
4. **Gaining Insight into Best Practices:** Engaging with open source projects exposes you to code reviews and feedback
   from various developers. This experience is crucial for understanding diverse coding styles and improving your own
   coding practices.
5. **Making a Real-World Impact:** Your contributions can significantly influence the project and its users. The
   satisfaction of seeing your code being used and appreciated by others is incredibly rewarding.

**Remember, every expert was once a beginner. Contributing to open source is a valuable step in your development
journey. So, dive in and start making your mark!**

**We appreciate any contributions to help make Buggregator better!**

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