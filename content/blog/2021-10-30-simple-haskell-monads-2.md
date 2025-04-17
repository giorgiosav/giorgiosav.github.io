+++
title = "A simple problem in Haskell, using monads (Part 2/3)"
description = "How the magic of <code>sequence</code> and <code>mapM</code> works."
+++

This article is number 2 in a 3-part series. If you haven't read the first one,
you can find it [here]({% link en/_posts/2021-09-25-simple-haskell-monads.md %}).

In Part 1, we looked at a few examples of the
[`sequence`](https://hackage.haskell.org/package/base-4.15.0.0/docs/Prelude.html#v:sequence)
function to transform a list of monads into a monad of a list.

```
> sequence [Just 1, Just 2, Just 3]
Just [1, 2, 3]

> sequence [Just 1, Nothing, Just 2]
Nothing

> sequence [Just 1, Nothing, Just 2, Nothing]
Nothing
```

A more impressive example is when you look at the `Either a` monad.


```
> sequence [Right 1, Right 2, Right 3]
Right [1, 2, 3]

> sequence [Right 1, Left 'A', Right 2, Left 'B']
Left 'A'
```

The type of `sequence` in this case is `[Either a b] -> Either a [b]`, so
the returned value, as we can see, is either `Left a` or `[b]`. On top of that,
the function returns the first occurrence of a `Left a` value, if it finds any.
Coming from an imperative background, this seemed a bit like magic to me at
first, so let's dive into the source code to see what happens behind the scenes.

The [source code](https://hackage.haskell.org/package/base-4.15.0.0/docs/src/Data-Traversable.html)
for `sequence` is not very easy to follow, so let's walk through it here
(simplifying slightly). If you don't know what **typeclasses** are, you can read
up on them [here](https://www.haskell.org/tutorial/classes.html), or
[here](http://learnyouahaskell.com/making-our-own-types-and-typeclasses#typeclasses-102).
Essentially, you can think of them as interfaces in object-oriented languages,
or traits in, e.g., Scala and Rust.

```haskell
class (Functor t, Foldable t) => Traversable t where
    traverse :: Applicative f => (a -> f b) -> t a -> f (t b)
    traverse f = sequenceA . fmap f

    sequenceA :: Applicative f => t (f a) -> f (t a)
    sequenceA = traverse id

    mapM :: Monad m => (a -> m b) -> t a -> m (t b)
    mapM = traverse

    sequence :: Monad m => t (m a) -> m (t a)
    sequence = sequenceA


instance Traversable [] where
    traverse f = List.foldr cons_f (pure [])
        where cons_f x ys = liftA2 (:) (f x) ys
```

So what's happening here? The code first defines the
[`Traversable`](https://hackage.haskell.org/package/base-4.16.0.0/docs/Prelude.html#t:Traversable)
typeclass with the following functions:

- `traverse`
- `sequenceA`
- `mapM`
- `sequence`

However, because these functions are defined in terms of each other, any
instance of `Traversable` only needs to implement either `traverse` or
`sequenceA` (which will override the default implementation).

The `Traversable []` instance only implements `traverse`. While the
implementation seems really small and simple, there is a lot going on, so let's
cover some basics first.

## The `Functor` typeclass

The [`Functor`](https://hackage.haskell.org/package/Cabal-3.6.2.0/docs/Distribution-Compat-Prelude-Internal.html#t:Functor)
typeclass essentially provides the `fmap` function.

```haskell
fmap :: (a -> b) -> f a -> f b
```

`f a` and `f b` are two "wrapped" values -- let's look at an example in GHCi where `f =
Either a`.

```
> fmap (*2) (Right 3)
Right 6

> fmap (*2) (Left 3)
Left 3
```

So `fmap` applies the first argument (a function) to the "content" of its second
argument. Why does it behave differently with `Right 3` and `Left 3` though? We
can find the answer in the
[`Functor` implementation for `Either a`](https://hackage.haskell.org/package/base-4.16.0.0/docs/src/Data.Either.html#line-135).


```haskell
instance Functor (Either a) where
    fmap _ (Left x) = Left x
    fmap f (Right y) = Right (f y)
```

No matter what you apply to a `Left a` value, you will always get back the same
`Left a`. This makes sense, because `Left` is conventionally a constructor for
error types: it means something went wrong.

## The `Applicative` typeclass

The [`Applicative`](https://hackage.haskell.org/package/base-4.16.0.0/docs/Prelude.html#t:Applicative)
typeclass provides the `(<*>)`, `pure` and `liftA2` functions, as well as a few others
which we won't go into. Let's take a look at the 
[source code](https://hackage.haskell.org/package/base-4.16.0.0/docs/src/GHC.Base.html#Applicative).

```haskell
class Functor f => Applicative f where
    pure :: a -> f a

    (<*>) :: f (a -> b) -> f a -> f b
    (<*>) = liftA2 id

    liftA2 :: (a -> b -> c) -> f a -> f b -> f c
    liftA2 f x = (<*>) (fmap f x)

    -- [...]
```

Again, because `(<*>)` and `liftA2` are defined in terms of each other,
instances of `Applicative` are only required to implement one of them (along
with `pure`, which is not implemented in the typeclass). Also recall that the
`id` function just returns whatever argument you give to it, so for example `id
(Right 3)` will return `Right 3`.

Let's take a look at how `liftA2` and `(<*>)` work in GHCi.

```
> import Control.Applicative

> liftA2 (:) (Right 1) (Right [2, 3])
Right [1, 2, 3]

> Right (*2) <*> Right 3
Right 6
```

So `liftA2` takes a binary function (such as `(:)`) and applies it to the "contents" of its next
2 arguments. `(<*>)` instead is like `fmap`, but it takes a function that is
wrapped into some `Functor` type (`Either a` in this example).

Now consider this: what happens if we use `Left a` values in the examples above?

```
> import Control.Applicative

> liftA2 (:) (Left 1) (Right [2, 3])
Left 1

> liftA2 (:) (Right 1) (Left 2)
Left 2

> Right (*2) <*> Left 3
Left 3
```

Once again, `Left a` values are left unchanged, and we can see why this happens
by looking at
[how `Either a` implements `Applicative`](https://hackage.haskell.org/package/base-4.16.0.0/docs/src/Data.Either.html#line-151).


```haskell
instance Applicative (Either e) where
    pure          = Right
    Left  e <*> _ = Left e
    Right f <*> r = fmap f r
```

If the first argument is `Left a`, the `(<*>)` function returns it unchanged. If
instead
the second one is `Left a`, then the `fmap` function is called, which also returns it unchanged.
One important thing to note is that, if both arguments are `Left a`, then the
**first one** will be returned. As we'll see later, this is what enables
`sequence` and `mapM` to return the first incorrect element, if any.

```haskell
> liftA2 (:) (Left 3) (Left 4)
Left 3
```


## Back to `Traversable`

We saw at the beginning of the article that both `sequence` and `mapM` are
provided by the `Traversable` typeclass and are implemented in terms of the
`traverse` function.

```haskell
instance Traversable [] where
    traverse f = List.foldr cons_f (pure [])
        where cons_f x ys = liftA2 (:) (f x) ys
```

Recall the type of `traverse` for a list:

```haskell
traverse :: Applicative f => (a -> f b) -> [a] -> f [b]
```

Let's again take an example in which `f = Either e` (sorry for changing the
letter).

```haskell
traverse :: (a -> Either e b) -> [a] -> Either e [b]
```

So what happens in the implementation of `traverse`? Let's take a look at the
first line.

```haskell
traverse f = List.foldr cons_f (pure [])
```

[`foldr`](https://hackage.haskell.org/package/base-4.16.0.0/docs/Data-List.html#v:foldr) 
is your typical reduce operation: it takes a function (`cons_f`), an
accumulator (`pure []`) and a list and accumulates all the elements.

```haskell
> foldr (+) 0 [1, 2, 3, 4] -- 1 + 2 + 3 + 4
10

> foldr (*) 1 $ take 5 [1..] -- 5! == 1 * 2 * 3 * 4 * 5
120
```

As for `pure []`, we saw in the implementation of `Applicative` for `Either e`
that it must return `Right []` (since `traverse` returns `Either e [b]` in this
example). Can you guess now what `cons_f` does? It has to perform a cons
operation (`(:)`) between the input list (`[a]`) and the contents of the
accumulator. Let's take a better look at the code

```haskell
cons_f x ys = liftA2 (:) (f x) ys
```
By looking at the signature of `traverse`, we can derive the types of the
inputs, which are not specified in the `where` clause.

```haskell
f  :: a -> Either e b
x  :: a
ys :: Either e [b]
```

So `cons_f` takes an element of the input list (`x`), "lifts" it to `(f x) ::
Either e b`, then appends it to the accumulator. The use of `liftA2` ensures, as
we saw previously, that if either `f x` or `ys` is of type `Left e`, then the
result will also be `Left e`. Let's take a look at an example of this.


```haskell
import Data.Char(digitToInt)

f :: Char -> Either Char Int
f x
    | x `elem` "0123456789" = Right (digitToInt x)
    | otherwise             = Left x


cons_f :: Char -> Either Char [Int] -> Either Char [Int]
cons_f x ys = liftA2 (:) (f x) ys
```

`f` here takes a `Char` and transforms it into a `Right Int` if it's between 0 and 9,
otherwise it returns the unmodified input wrapped as a `Left Char`. If we
experiment with these functions in GHCi, we should expect the following
behavior.

```haskell
> f '3'
Right 3

> f 'x'
Left 'x'

> cons_f '3' (Right [5, 4])
Right [3, 5, 4]

> cons_f 'x' (Right [5, 4])
Left 'x'

> cons_f '3' (Left 'x')
Left 'x'

> cons_f 'x' (Left 'y')
Left 'x'
```

We can now start to see how the magic of `traverse` works: what happens if we
execute `traverse f "01x3y"`? (Recall that `String` is the same as `[Char]`).
I'm going to use a "mathematical" notation below to reduce the expression.

```haskell
traverse f "01x3y" == foldr cons_f (Right []) "01x3y"
                   == cons_f '0' $ cons_f '1' $ cons_f 'x' $ cons_f '3' $ cons_f 'y' (Right [])
                   == cons_f '0' $ cons_f '1' $ cons_f 'x' $ cons_f '3' Left 'y'
                   == cons_f '0' $ cons_f '1' $ cons_f 'x' Left 'y'
                   == cons_f '0' $ cons_f '1' $ Left 'x'
                   -- [...]
                   == Left 'x'
```

Now recall that `sequence = traverse id` and `mapM = traverse`. We can see now
why an expression like `sequence [Right 1, Left 'x', Left 'y']`
returns the **first occurrence** of a value of type `Left e` (`Left 'x'` in this
case): it's because the implementation of `<*>` for `Either e` always 
returns the **first `Left e` argument**.

And that's all! The magic behind `sequence` and `mapM` is demystified. If we had
to summarize everything in a nutshell, we could simply say that it's all
determined by how the `Functor` and `Applicative` typeclasses are defined for `Either e`. Now
if you want to understand why `sequence [Just 3, Nothing, Just 4]` returns
`Nothing`, just go look at how those 2 typeclasses are implemented for 
[`Maybe`](https://hackage.haskell.org/package/base-4.16.0.0/docs/Prelude.html#t:Maybe).


In the final part of this article series ([Part 3](@/blog/2021-12-08-simple-haskell-monads-3.md)), we'll try to solve the "nucleotide" problem
described in [Part 1](@/blog/2021-09-25-simple-haskell-monads.md) with C++ and Rust.

