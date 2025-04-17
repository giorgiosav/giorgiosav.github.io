+++
title = "A simple problem in Haskell, using monads (Part 3/3)"
description = "Comparing Haskell with C++ and Rust."
+++

This article is the last of a 3-part series. You can read Part 1 
[here]({% link en/_posts/2021-09-25-simple-haskell-monads.md %})
and Part 2 [here]({% link en/_posts/2021-10-30-simple-haskell-monads-2.md %}).

In Part 1 of this series, we looked at how to solve the
[Nucleotide Count](https://exercism.org/tracks/haskell/exercises/nucleotide-count)
problem in Haskell and came up with this.


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

Now we'll try to solve the same problem in Rust and C++. As you might guess, the
crux of the problem will be to reproduce the behavior of Haskell's `Either a b`
data type.

## Rust

Let's start with Rust, which provides us with the handy 
[`Result`](https://doc.rust-lang.org/std/result/enum.Result.html)
type. This is
essentially the same as Haskell's `Either a b`: the only difference is that the
type constructors are called `Ok` and `Err`, instead of `Right` and `Left`.

As a disclaimer, I must say I'm not very experienced with Rust yet, so there are
probably much better ways to solve this problem.

```rust
use std::collections::HashMap;

#[derive(PartialEq, Eq, Hash)]
pub enum Nucleotide { A, C, G, T }

fn char2nuc(c: char) -> Result<Nucleotide, char> {
    match c {
        'A' => Ok(Nucleotide::A),
        'C' => Ok(Nucleotide::C),
        'G' => Ok(Nucleotide::G),
        'T' => Ok(Nucleotide::T),
        _ => Err(c)
    }
}


// combine count and nucleotideCounts from Haskell code
pub fn count(dna : &str) -> Result<HashMap<Nucleotide, i32>, char> {
    use Nucleotide::*;

    let mut counts = HashMap::new();
    counts.insert(A, 0);
    counts.insert(C, 0);
    counts.insert(G, 0);
    counts.insert(T, 0);

    for c in dna.chars() {
        match char2nuc(c) {
            Ok(n) => { counts.entry(n).and_modify(|e| { *e += 1 }); },
            Err(n) => return Err(n)
        }
    }

    return Ok(counts);
}
```

So this code is very similar to the Haskell version, except that in the `count`
function we can have early termination if we find an incorrect character. In the
Haskell version, instead, we always traverse the full list, though you _could_
achieve early termination by using strictness (more info
[here](https://www.fpcomplete.com/haskell/tutorial/monad-transformers/) if you are
interested).

## C++

Unlike Rust, C++ does not have **sum types** such as `Either a b`. We could solve the
problem without them, but it's much more interesting to try to create a sum type
in C++, so here we go.

The closest thing we can use to create a sum type in C++ (besides `union`s, which are not type safe)
is [`std::variant`](https://en.cppreference.com/w/cpp/utility/variant), from
C++ 17. However, this still isn't equivalent, because while we can have such a thing as
an `Either Char Char` in Haskell, in C++ a `std::variant<char, char>` is not
allowed: the types must be different.

Of course, in the Nucleotide Count problem, we actually do have different types,
so we could write something like this.

```c++
#include <variant>
using std::variant;

enum Nucleotide { A, C, G, T };

using EitherCharNucleotide = variant<char, Nucleotide>;
```

But then, what if someday we need a `std::variant<char, char>`, what will we do?
We could just create two dummy `struct`s to wrap the different variants.

```c++
#include <variant>
using std::variant;

enum Nucleotide { A, C, G, T };

template<typename L>
struct Left {
    L val;
};

template<typename R>
struct Right {
    R val;
};

using EitherCharNucleotide = variant<Left<char>, Right<Nucleotide>>;
```
This works even if we use two variants of the same type! We can just create a
`std::variant<Left<char>, Right<char>>`, for example. Let's add some
functionality by creating an actual `Either` object.


```c++
#include <variant>
using std::variant;

enum Nucleotide { A, C, G, T };

template<typename L>
struct Left {
    L val;
};

template<typename R>
struct Right {
    R val;
};

template<typename L, typename R>
class Either {
    public:
        Either(L left) : value(Left<L>{left}) {}
        Either(R right) : value(Right<R>{right}) {}
        bool right() const { return std::holds_alternative<Right<R>>(value); }

        // these will throw an exception if the wrong type is accessed
        const L& unwrap_left() const { return std::get<Left<L>>(value).val; }
        const R& unwrap_right() const { return std::get<Right<R>>(value).val; }
    private:
        variant<Left<L>, Right<R>> value;
};
```

This way, we can use, for example, `Either<char, Nucleotide>`, or even
`Either<char, char>`.

The rest of the code is pretty straightforward.
```c++
#include <string_view>
#include <variant>
#include <map>

using std::variant;
using std::string_view;
using std::map;

enum Nucleotide { A, C, G, T };

template<typename L>
struct Left {
    L val;
};

template<typename R>
struct Right {
    R val;
};

template<typename L, typename R>
class Either {

    public:
        Either(L left) : value(Left<L>{left}) {}
        Either(R right) : value(Right<R>{right}) {}
        bool right() const { return std::holds_alternative<Right<R>>(value); }

        // these will throw an exception if the wrong type is accessed
        const L& unwrap_left() const { return std::get<Left<L>>(value).val; }
        const R& unwrap_right() const { return std::get<Right<R>>(value).val; }
    private:
        const variant<Left<L>, Right<R>> value;
};

Either<char, Nucleotide> char2nuc(char c) {
    switch (c) {
        case 'A':
            return A;
        case 'C':
            return C;
        case 'G':
            return G;
        case 'T':
            return T;
        default:
            // casts to Either because constructor is not marked explicit
            return c;
    }
}


// combine count and nucleotideCounts from Haskell code
Either<char, map<Nucleotide, int>> count(string_view dna) {

    map<Nucleotide, int> counts { {A, 0}, {C, 0}, {G, 0}, {T, 0} };

    for (const char c : dna) {
        const Either<char, Nucleotide> n = char2nuc(c);
        if(n.right())
            counts[n.unwrap_right()] += 1;
        else {
            char res = n.unwrap_left();
            return res;
        }
    }

    return counts;
}
```

<br><br>
So, which of the 3 versions do you prefer? Personally, I think it would be great
if C++ had sum types and pattern-matching like Rust and Haskell,
but for now we'll have to make do.
