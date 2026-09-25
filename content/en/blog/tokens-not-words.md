---
title: "Tokens Are Not Words"
date: 2025-11-20
pinned: false
description: ""
slug: "tokens-not-words"
tags: []
content_language: "en"
selected: false
# external_url: ""
draft: false
---
These days, tokens feel like a new kind of money. We count and budget them, and look for ways to spend fewer. At the same time, AI companies compete to offer us larger context windows, bigger token limits, and models capable of devouring enormous amounts of text to burn thousands of tokens in a few seconds.

I think we have ended up in a strange economy where everyone, including myself, wants more tokens, while also trying to use fewer of them. At this rate, developers might soon be cheaper than the tokens!

## What a token really is?
When you send a sentence to a language model, it does not digest it the way we see it. Before the model can process the text, a system called a tokenizer breaks it into smaller pieces called **tokens** and then converts them into a sequence of integer IDs. So tokens are not words.

For the model, it’s a sequence of numbers. A token might represent a word, part of a word, punctuation, bytes, a Unicode character, or something totally meaningless on its own.

One word can break into several tokens, and a single token can sometimes contain multiple characters. A token can even contain only part of the bytes needed to represent a Unicode character. In other words, the boundaries we see in human language are not the same boundaries the model sees.

## How does a tokenizer decide where to cut?
So where do these small pieces come from, or how does the tokenizer decide where to cut them into pieces? There are several methods for that. OpenAI’s [tiktoken](https://github.com/openai/tiktoken), for example, implements **Byte Pair Encoding (BPE)** and exposes the token IDs that models consume.

BPE roots go back to [Philip Gage’s 1994 compression algorithm](https://dl.acm.org/doi/10.5555/177910.177914). The idea later became highly influential in NLP when researchers adapted BPE for neural machine translation in 2016, where they used BPE to represent rare and unknown words as sequences of reusable subword units rather than requiring every possible word to exist in the vocabulary. Their paper described this as:

> encoding rare and unknown words as sequences of subword units

A simplified version looks like this. Suppose our training text repeatedly contains:

`l o w`

`l o w e r`

`l o w e s t`

At first, everything is made of tiny pieces. If `l` and `o` appear together frequently, the tokenizer can merge them into `lo`. Now, if `lo` and `w` frequently occur together, they can eventually become `low`. Over many such merges, common patterns earn larger reusable pieces.

OpenAI’s educational BPE implementation demonstrates this process essentially at the **byte** level. Begin with individual byte values, count neighboring pairs, merge a frequent pair, and repeat until the desired vocabulary size is reached. tiktoken also performs an initial regex-based split before applying its learned byte pair merges.

That is why a common pattern such as `ing` may become a convenient unit while an uncommon word gets chopped into several tiny pieces. tiktoken explicitly cites common subwords such as `ing` as one advantage of BPE.

## What does the tokenizer actually see?
The playground below uses OpenAI’s **o200k_base** encoding, so go and give it a try. Compare English and Persian, add emojis, and change the punctuation or spacing to see how the token IDs and total count change. Token counts depend on the tokenizer, so another encoding can split the same string differently. 

{{< tokenizer >}}
