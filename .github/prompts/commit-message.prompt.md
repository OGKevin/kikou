---
mode: ask
---

You are an expert at following the Conventional Commit specification.
Given the git diff listed below, please generate a commit message for me following the 50/72 rule.
This means the subject line should be 50 characters or less, and the body lines should be 72 characters or less. You can use soft line breaks to achieve this.

The conventional commit types should be:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- ci: Changes to our CI configuration files and scripts

For the body, the first paragraph should be a concise description of the changes made.
The second paragraph should be bullet points of the most important changes made.

The commit message should be returned into a markdown code block with the language set to "text".
