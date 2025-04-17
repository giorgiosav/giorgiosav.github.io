+++
title = "I switched from Jekyll to Zola"
description = "... to escape Dependency Hell"
+++

I'm no longer using [Jekyll](https://jekyllrb.com/) to build this website. I just switched to
[Zola](https://www.getzola.org/). I didn't dislike Jekyll or anything, but
every time I tried to build my website after some period of inactivity
I would get this:

```
   Liquid Exception: undefined method 'tainted?' for an instance of String in /_layouts/post.html
[...]
/path/to/liquid/variable.rb:124:in 'Liquid:Variable#taint_check': undefined method 'tainted?' for an instance of String (NoMethodError)

        return unless obj.tainted?
```


Uhm... what?

I'm not familiar with Ruby and its ecosystem and, while I'd be happy to learn, it's
not really my top priority right now. So, when this happened, I would spend some time looking for the
correct incantation, updating the right dependencies until I could finally build
my website again... only to see some other variation of this message a few months
later.

I never had the time to figure out what was wrong with my setup and, the last time this happened to me,
there was no magical incantation that would fix the issue. I even tried reinstalling Jekyll and
Ruby, messing with the lock file, but nothing. I was knee-deep in Dependency Hell and decided to bail.

Zola is a simple alternative to Jekyll with almost no dependencies. Syntax highlighting comes out of the
box. You can create feeds just by setting an option in the configuration file. And what I find really
cool is that it comes with multilingual support! I managed to actually reduce the size of my code base
simply by deleting all the template boilerplate code I had in place to support multiple languages.

The other thing I like about Zola is that, for now, it has fewer idiosyncrasies and is easier to learn.
There are fewer top-level directories with magical names: your templates don't need to be split between
`_layouts` and `_includes`, for example. There's no `_data` directory, no `site` variable that you need to remember.
Everything is a bit more compact and, for my simple requirements, I appreciate that. There are of course
some missing features, but nothing essential. So far, the only thing I was mildly bothered about was that
I couldn't prettify links in the `{year}/{month}/{day}/{title}` format, but then I got over it. Who looks
at the URL format anyway?

Deploying on Github Pages is also really easy. There's [a guide](https://www.getzola.org/documentation/deployment/github-pages/)
on their website, but you don't even need to go that far. Just create a branch called
`gh-pages` and check in all build files under `docs/`. Then in the repository settings,
select to deploy from the `docs` folder in `gh-pages` and that's it. You can update the
`gh-pages` branch manually, or create a [git hook](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
to update it automatically on each commit.

The migration from Jekyll to Zola was a little involved, but as I said, I ended up with a smaller
code base to maintain, so I'm pretty happy with the switch for now. The only thing I wish Zola had,
but that no static site generator that I know of has, is built-in support for math rendering. But
that's a story for [another time](@/blog/2025-04-17-math-web.md).

