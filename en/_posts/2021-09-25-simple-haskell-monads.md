---
layout: post
title: A simple problem in Haskell, using monads (Part 1/3)
excerpt: How to use <code class="highlighter-rouge">sequence</code> and <code class="highlighter-rouge">mapM</code> to make life easier.
lang: en
lang-id: simple-haskell-monads
---



I've been trying to learn Haskell recently,
so after reading some intro material 
I set up an account on [Exercism](https://www.exercism.org) and signed up
for the Haskell track to get some practice. One of the very first exercises
in the track is called
[Nucleotide Count](https://exercism.org/tracks/haskell/exercises/nucleotide-count)
and, while it seems very simple at first glance, I found it useful to
get an initial grasp of monads. I'll describe the (slightly modified) exercise
here and how to solve it in Haskell.


This article is the first of a 3-part series. It doesn't assume much prior
knowledge of Haskell (I'm very much a beginner at the moment), but  it's good to
know the basics if you want to follow along
(syntax, basic functions, etc...). You might also want to read
up on
[functors](http://learnyouahaskell.com/functors-applicative-functors-and-monoids),
if you don't know what they are, though it's not really necessary.

In **Part 1** of the series (this article), I'll explain how to solve the "Nucleotide Count" 
problem using monads, then in **Part 2**
I'll dive into the implementation of `mapM` and `sequence` and finally, in **Part
3**, I'll try to solve this same problem imperatively in C++ and Rust, for comparison.

## Problem Description

I don't know much about Biology, unfortunately... but anyway DNA is made up
for 4 molecules called "nucleotides", whose symbols are A, C, G and T. You are
given a string of these nucleotides (e.g. `"ACCTTTGCTATC"`) and need to return
a map with each nucleotide and the number of times it appears in the input
string, so for example:

```
Input: "ACCTTTCTGACAA"
Output: {A:4, C:3, G:1, T:4}
```

```
Input: ""
Output: {A:0, C:0, G:0, T:0}
```

The keys in the map are their own type (`Nucleotide`), not `Char`s.
Finally, if there are any invalid characters in the input string, you
should return the first one.

```
Input: "CCXATAGCABYZ"
Output: 'X'
```

Let's frame this in terms of Haskell code. We'll implement a function
called `nucleotideCounts`. Since we're returning either a character or a map,
the return type will be `Either Char (Map Nucleotide Int)`.

```haskell
module DNA (nucleotideCounts, Nucleotide(..)) where

import Data.Map (Map)

data Nucleotide = A | C | G | T deriving (Eq, Ord, Show)

nucleotideCounts :: String -> Either Char (Map Nucleotide Int)
nucleotideCounts s = -- TODO
```

## First Attempt

This seems like a pretty simple problem, right? At first glance, it is, but
for those like me who are new to functional programming, there are a few
insidious details to tackle, as we'll see. My first idea was to implement a function
`char2nuc`, that takes takes a character and returns `Either Char Nucleotide`.

```haskell
char2nuc :: Char -> Either Char Nucleotide
char2nuc 'A' = Right A
char2nuc 'C' = Right C
char2nuc 'G' = Right G
char2nuc 'T' = Right T
char2nuc x = Left x
```

The value constructor `Right` indicates a valid result, whereas `Left` means
that the input character was not a valid nucleotide (e.g. `char2nuc 'X' == Left
'X'`). Now what do we get if we map `char2nuc` onto a `String`?

```haskell
map char2nuc "ACTGTCAAAC"
```

What is the type of this expression? Let's take a look.

* `char2nuc :: Char -> Either Char Nucleotide`
* A `String` is really a `[Char]`
* `map :: (a -> b) -> [a] -> [b]`

If we specialize `map` with `a = Char` and `b = Either Char Nucleotide`, when we
map `char2nuc` onto a string our result type is `[b]`, or `[Either Char
Nucleotide]`.

Now what? How do you deal with a list of `Either Char Nucleotide` and reduce it
to the `Either Char (Map Nucleotide Int)` that we need? You *could* use `foldl`
and wrestle with types to get a working solution, but if you dive
a little bit into monads there is a much simpler way.


## The Magic of `sequence` and `mapM`

While trying to wrap my head around this problem, I came across the
[`sequence`](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html#v:sequence)
function.

```haskell
sequence :: (Traversable t, Monad m) => t (m a) -> m (t a)
```

In our case, `Traversable t` is just a list, so we can simplify the definition
like this.


```haskell
sequence :: (Monad m) => [m a] -> m [a]
```

Get it now? `sequence` takes a list of monads, collects them and returns a monad
of a list. 

Ok but... what is a monad?

I'm not going to give a full-blown explanation of what monads are, but, very
briefly, you can think of them as a kind of *box* or *context* containing some
value of a specific type. For example,
`Maybe` is a monad. `Maybe a` contains a value of type `a`, where `Just a` means that the
value is present and `Nothing` means it's absent. Let's stick to that and keep
it simple. (In addition, all monads must implement the `>>=`, `>>` and `return` functions,
but that's a story for another time).

So what happens if you apply the `sequence` function to a list of `Maybe a`?
If you have [GHCi](https://downloads.haskell.org/ghc/latest/docs/html/users_guide/ghci.html)
installed, give it a try.

```
> sequence [Just 1, Just 2, Just 3]
Just [1, 2, 3]

> sequence [Just 1, Nothing, Just 2]
Nothing

> sequence [Just 1, Nothing, Just 2, Nothing]
Nothing
```

How does this happen? If we substitute `Maybe Int` for `m a`, the `sequence`
function specializes to `sequence :: [Maybe Int] -> Maybe [Int]`. This means
that the returned value  is either `Just [Int]` or `Nothing`. Specifically, if all
the members of the list are `Just Int`, the function will return a `Just [Int]`. If
there is a single `Nothing` in the list, the returned value will be `Nothing`. This
seemed like magic to me at first, but we'll take a look at the implementation
later on.


In the nucleotide problem, we're not using `Maybe a` but `Either a b`. The
good thing is that [`Either a` is a monad](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html#t:Either). 
So what happens if we use, for example, `Either Char Int` in the `sequence` function? 
The type signature
specializes to `sequence :: [Either Char Int] -> Either Char [Int]`. Let's try this again
in GHCi.

```
> sequence [Right 1, Right 2, Right 3]
Right [1, 2, 3]

> sequence [Right 1, Left 'A', Right 2, Left 'B']
Left 'A'
```

Once again, if there are any `Left Char`s in the list, the first one is
returned. Do you see where this is going? In our nucleotide problem, after
mapping the `char2nuc` function onto a `String`, we got a return type of `[Either Char
Nucleotide]`. If we applied the `sequence` function to this, we would get
`Either Char [Nucleotide]`, that would give us either the first invalid
character or a list of `Nucleotide`s. Here's a quick example.

```
> sequence [Right A, Right A, Right T, Right C, Right G]
Right [A, A, T, C, G]

> sequence [Right A, Right A, Left 'X', Right C, Left 'Y']
Left 'X'
```

So to recap, assume our input string is called `dna`. We first map `char2nuc`
onto `dna` to obtain something of type `[Either Char Nucleotide]`. Then we apply
`sequence` to this to obtain a value of type `Either Char [Nucleotide]`. Let's
call this result `nucleotideList`.

```haskell
nucleotideList = sequence $ map char2nuc dna
```

Recall that we actually need something of type `Either Char (Map Nucleotide Int)`,
so we're not done yet, but we'll get there. Before that, it's worth mentioning
that there is an easier way to combine `map` and `sequence`, which is the 
[`mapM`](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html#v:mapM)
function.

```haskell
mapM :: (Traversable t, Monad m) => (a -> m b) -> t a -> m (t b)
```

Let's specialize the types for our problem.

```haskell
mapM :: (Char -> Either Char Nucleotide) -> [Char] -> Either Char [Nucleotide]
```

So `mapM` takes a function of type `Char -> Either Char Nucleotide` (like
`char2nuc`) and a `[Char]` (or `String`), maps one onto the other and then
essentially applies `sequence` to the result (the
[implementation](https://hackage.haskell.org/package/base-4.15.0.0/docs/src/Data-Traversable.html#mapM)
is slightly different, but to the same effect). We can use this to simplify our
transformation of the `dna` string above.

```haskell
nucleotideList = mapM char2nuc dna
```

## Final Touches

For the final step, we just need to find a way to convert our
`nucleotideList :: Either Char [Nucleotide]` into something of type
`Either Char (Map Nucleotide Int)`. Let's ignore the `Either Char` monad
for a second and think of how to turn a `[Nucleotide]` into a `Map Nucleotide
Int`. Let's implement a function called `count` (sorry for the inexpressive name).

```haskell
import Data.Map (Map, fromList, adjust)


count :: [Nucleotide] -> Map Nucleotide Int
count = foldr (adjust succ) basemap
    where basemap = fromList [(A, 0), (C, 0), (G, 0), (T, 0)]
```

`succ` here is the same as `(+1)` and [`adjust`](https://hackage.haskell.org/package/containers-0.6.5.1/docs/Data-Map-Internal.html#v:adjust)
updates a given key in a map by applying `succ` to it (i.e. increasing the value
by `1`). So what happens here is that we start with `basemap` and, for every
element of the input list of `Nucleotide`s, we update `basemap` with `adjust
succ`, which increases the value of that element in the map by `1`.


Now all we need to do is apply the `count` function to the "content" of
`nucleotideList`. This is pretty simple, we can use 
[`fmap`](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html#v:fmap)
(which is the same as `<$>`). Recall the type of `fmap`:

```haskell
fmap :: Functor f => (a -> b) -> f a -> f b
```

Or, in our case, since `Either a` is also a `Functor`:

```haskell
fmap :: ([Nucleotide] -> Map Nucleotide Int) -> Either Char [Nucleotide] ->
Either Char (Map Nucleotide Int)
```

So we could implement our top-level function `nucleotideCounts` like this.

```haskell
nucleotideCounts :: String -> Either Char (Map Nucleotide Int)
nucleotideCounts s = count <$> nucleotideList 
	where nucleotideList = mapM char2nuc s
```

Here's the full code (skipping the `nucleotideList` definition)

```haskell
module DNA (nucleotideCounts, Nucleotide(..)) where

import Data.Map (Map, fromList, adjust)

data Nucleotide = A | C | G | T deriving (Eq, Ord, Show)

char2nuc :: Char -> Either Char Nucleotide
char2nuc 'A' = Right A
char2nuc 'C' = Right C
char2nuc 'G' = Right G
char2nuc 'T' = Right T
char2nuc x = Left x

count :: [Nucleotide] -> Map Nucleotide Int
count = foldr (adjust succ) basemap
    where basemap = fromList [(A, 0), (C, 0), (G, 0), (T, 0)]

nucleotideCounts :: String -> Either Char (Map Nucleotide Int)
nucleotideCounts s = count <$> mapM char2nuc s
```

Now, you might be wondering: what happens if `mapM char2nuc s` returns a `Left
Char` and we apply `fmap count` to that? `count` doesn't expect a `Char`! Well,
applying `fmap` (or `<$>`) to `Left a` is the same as applying `fmap` to
`Nothing`: you get back what you started with. Try it out.

```
> fmap (*2) (Right 3)
Right 6

> fmap (*2) (Left 3)
Left 3
```

This might seem a bit like magic, but it's really just the way that
`Either a` implements `fmap`: the implementation is 
[here](https://hackage.haskell.org/package/base-4.15.0.0/docs/src/Data-Either.html#Either)
(search for `fmap`).


As I mentioned in the beginning, this article is the first of a 3-part series.
In Part 2, I'll try to demystify the magic behind `sequence` and `mapM` and in
Part 3 I'll compare solutions to this problem in C++ and Rust.


