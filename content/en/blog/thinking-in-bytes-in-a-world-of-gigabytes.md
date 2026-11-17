---
title: "Thinking in Bytes in a World of Gigabytes"
date: 2026-11-17
description: ""
slug: "thinking-in-bytes-in-a-world-of-gigabytes"
tags:
  - software-engineering
  - memory-management
  - python
  - embedded-systems
content_language: "en"
selected: false
draft: false
---

Some of the most useful software lessons I've learned came from the little embedded projects I built as a hobby. Working with microcontrollers and their limited RAM made me appreciate every byte and think twice before creating another buffer.

What I find interesting is how quickly I forget about these constraints when working with high-level languages like Python, which I've been using a lot more recently. Suddenly, I'm loading an entire JSON file with one line of code and letting the runtime handle memory management. Don't get me wrong, that's actually great, and it's one of the reasons we use high-level languages. But when you have so much memory available, it's easy to forget that it still has limits. Some of the habits I picked up while working with a few kilobytes of RAM turn out to be useful even when I have gigabytes available.

## Memory Has a Cost, Even When You Can't See It

One of the conveniences of high-level languages is that they hide a lot of what's happening in memory. Take something as simple as an integer. In C, an `int` typically occupies four bytes. In CPython, an integer is an object with metadata such as its type and reference count.

```python
import sys

print(sys.getsizeof(71))
# Typically 28 bytes on 64-bit CPython
```

Twenty-eight bytes for a single number doesn't sound like a disaster. But when you store a million distinct integers in a Python list, you're also paying for the Python objects and the references stored in the list. For example, NumPy can store numbers in a compact array instead of creating a separate Python object for every element.

```python
import numpy as np

numbers = np.arange(1_000_000, dtype=np.int32)

print(numbers.nbytes)
# 4,000,000 bytes
```

That's one million integers in four megabytes of array data. NumPy still needs some metadata, but it avoids creating a separate Python integer object for each number. Unlike Python integers, though, `int32` values have a fixed numeric range. The exact object sizes depend on the Python implementation, version, and architecture. Still, it's a useful reminder of how much data representation affects memory consumption.

Python also needs memory for its interpreter, imported libraries, and memory-management machinery. CPython primarily uses reference counting to reclaim objects, with a garbage collector to handle unreachable reference cycles. Freeing an object doesn't necessarily return its memory to the operating system. CPython's allocator may keep it around for future allocations. This explains why a Python process can continue showing high RAM usage even after some of its objects have been released. High memory usage alone isn't enough to diagnose a memory leak.

## The Best Allocation Is Sometimes the One You Never Make

One habit I picked up from embedded programming is questioning whether an allocation is necessary in the first place. Imagine counting errors in a large log file.

```python
# Loads the entire file into memory
with open("app.log") as f:
    lines = f.readlines()

errors = sum("ERROR" in line for line in lines)
```

There's nothing wrong with this for a small file. But if the file is several gigabytes, we're keeping a lot of data in memory just to count some lines. Python already lets us iterate over a file without loading the whole thing.

```python
with open("app.log") as f:
    errors = sum("ERROR" in line for line in f)
```

This version processes one line at a time. Its memory usage depends mainly on the current line and file buffering rather than the size of the entire file. A similar issue comes up with lists.

```python
total = sum([x * x for x in range(1_000_000)])
```

Here, Python creates a million intermediate values, sums them, and then discards the list. We can skip that allocation with a generator expression.

```python
total = sum(x * x for x in range(1_000_000))
```

Lists still make sense when we need random access or plan to reuse the values. For numerical workloads, NumPy arrays may also be faster than either approach.

Another place where memory usage can sneak up on us is NumPy or pandas. Operations that look similar can have very different allocation costs.

```python
import numpy as np

data = np.arange(10_000_000, dtype=np.float64)

view = data[::2]       # Shares the original buffer
copy = data[data > 0]  # Creates a new array
```

The original array contains 80 MB of numeric data. The first operation shares that memory, while the second allocates a new array and temporarily creates a boolean mask. At this scale, an extra allocation is worth paying attention to, especially when several operations are chained together. There's also a less obvious problem with views. Even a tiny view can keep a much larger underlying array alive. Copying a small portion of the data can sometimes save memory in the long run. I find it more useful to understand where copies happen than to try avoiding them everywhere.

## Every Resource Needs a Limit

With embedded systems, resource limits are usually obvious. You know how large a buffer is, and you have to decide what should happen when it fills up. In Python, it's easy to create data structures that grow indefinitely. For example, imagine a service that keeps a history of incoming requests.

```python
requests = []

def handle_request(data):
    requests.append(data)
```

Every request stays in memory because the list continues referencing it. The garbage collector won't reclaim those objects while they're still reachable. If we only need the last 100 requests, a bounded collection works better.

```python
from collections import deque

requests = deque(maxlen=100)
```

Older entries are removed automatically, although the memory used by each entry can still vary. Caches can run into a similar problem.

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def lookup(key):
    return expensive_lookup(key)
```

With `maxsize=None`, the cache can retain every distinct argument and its result. If the input keeps changing, memory usage can keep growing. Setting `maxsize=512` limits the number of cached entries. It doesn't guarantee a fixed memory footprint, but at least the cache has a defined capacity.

Consider an upload service that buffers incoming files in RAM. The average upload is 2 MB, but users can upload files up to 200 MB. With 20 concurrent uploads, the service could be holding around 4 GB of upload data in memory. That's a problem if the container has a 2 GB memory limit, even if average memory usage looks perfectly fine. Streaming uploads to disk, limiting concurrency, and applying backpressure are some ways to deal with this. It's a habit I wish we applied more consistently in software development. We spend plenty of time measuring average resource usage, but the occasional peak is often what takes a service down.

## Measure, Don't Guess

Memory usage isn't always obvious from reading code. I've found it useful to measure allocations before deciding whether something needs optimization. For Python, there are a few tools worth knowing:

- **`tracemalloc`** is part of the standard library and helps identify traced allocations and peak memory usage.
- **Memray** provides more detailed profiling, including native allocations.
- **RSS and container metrics** help show how much resident memory a process or container is consuming.

For JavaScript applications, Chrome DevTools has heap snapshots that can help identify objects being retained longer than expected. I ran a few benchmarks on my Apple M1 Mac with 16 GB of RAM, using CPython 3.14.7. Each test was repeated five times, and the results below show the median. Let's start with our earlier list and generator examples:

```python
import tracemalloc

def eager():
    return sum([x * x for x in range(1_000_000)])

def streaming():
    return sum(x * x for x in range(1_000_000))

def measure(func):
    tracemalloc.start()

    result = func()
    _, peak = tracemalloc.get_traced_memory()

    tracemalloc.stop()
    print(f"{func.__name__}: {peak / 1024**2:.2f} MiB")
    return result

measure(eager)
measure(streaming)
```

The code above demonstrates the memory measurement. For the full benchmark, I ran each implementation in a fresh process and measured execution times separately, with `tracemalloc` disabled.

| Approach             | Peak traced memory | Execution time |
| -------------------- | -----------------: | -------------: |
| List comprehension   |          38.57 MiB |       34.53 ms |
| Generator expression |       0.000534 MiB |       39.32 ms |

The generator used almost no additional traced memory, but the list was slightly faster in this experiment. Saving memory doesn't always mean saving time. I also benchmarked our earlier file-processing example using a 35.30 MiB log file containing one million lines.

| Approach            | Peak traced memory | Execution time |
| ------------------- | -----------------: | -------------: |
| Read all lines      |          82.59 MiB |       86.37 ms |
| Stream line by line |          0.144 MiB |       71.51 ms |

This time, streaming was both faster and more memory-efficient. Keep in mind that `tracemalloc` doesn't capture the entire process memory footprint, and the file was likely cached by the operating system. These results are specific to my machine and workload. It's worth repeating measurements under realistic conditions, since an optimization that looks impressive in a small benchmark might barely matter in the actual application.

## From Kilobytes to Gigabytes

Recently, I've been working more with machine learning, and it's been interesting to encounter familiar memory constraints at a completely different scale. Instead of worrying about a few kilobytes on a microcontroller, we might be trying to fit a language model into a few gigabytes of RAM or VRAM.

Quantization is a good example. A model with seven billion parameters stored in 16-bit precision needs roughly 14 GB just for its raw weights. At four bits per parameter, the theoretical storage drops to around 3.5 GB, excluding quantization overhead and other runtime memory. The tradeoffs depend on the quantization method and can include changes in model accuracy or inference performance.

Another example is the KV cache used during LLM inference. Transformer models commonly cache attention keys and values from previous tokens to avoid recomputing them during generation. As the context gets longer, the cache generally requires more memory. The exact amount depends on the model architecture, number of layers, KV heads, and precision. More concurrent requests can increase the memory requirement further.

It's funny to think that I started worrying about a few extra bytes on microcontrollers, and now I'm looking at techniques to save gigabytes when running language models. I still find myself doing the same calculations.

## Final Thoughts

I don't miss having to worry about every single byte, and I certainly don't want to write Python as if I'm programming an 8-bit microcontroller. Still, I'm glad I spent time working with hardware that had such limited resources. It made me pay attention to things I probably wouldn't have thought much about otherwise.
