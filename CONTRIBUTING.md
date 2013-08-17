If you want to contribute for a **bug** or an **enhancement**, please do it on `master`.
`master` is our **stable** branch where releases and fixes land.

If you want to contribute for a **new feature**, please do it on `develop`.
`develop` is our **mainline** where the next release is prepared.

Here is the workflow overview:

- Fork the repository.
- Clone it.
- Checkout the right branch.
- Add your awesome contribution.
- Test!
- Push to **Github**.
- Open a pull request to the right branch.

## Always run tests

This project tries to be as **test driven** as possible.
So your contribution should always be covered by associated *functional test(s)*.
This ensure that what you are actually adding work as expected and do not break anything.
We use [Mocha] to run the tests and [Chai] as the assertion library.

Before pushing anything to **Github**, please ensure that all tests are passing.

From the root of the project you can run tests like this:
```bash
npm test
```

[Mocha]: http://visionmedia.github.io/mocha/
[Chai]: http://chaijs.com/

## Keeping your repo in sync

Please **rebase** instead of **merging**.
This is just to avoid having a lot of merge commits polluting the history of the project.

```bash
# this adds our repo as another remote, only the first time
git remote add h5bp git://github.com/whoever/whatever.git

# fetches all branches from h5bp repo, only the first time
git fetch h5bp

# make sure your have checkout the right branch
git checkout [master|develop]

# rebase h5bp/master
git rebase h5bp/master
```

If you are not comfortable with rebasing, please take a look at http://git-scm.com/book/en/Git-Branching-Rebasing
or ask us some help :)

## Squash your commits

At the end of your pull request review, you may have several commits in it.
Please squash all your commits into one with a clear message.
This is to have a clear history in the project when each commit is relevant to a **feature**, **enhancement** or **bug**.

If you are not comfortable with squashing commits, please take a look at http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html
or ask us some help again :)

# Thanks!
