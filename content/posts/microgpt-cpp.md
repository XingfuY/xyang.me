---
title: "microgpt-cpp: When You Rewrite Karpathy's 200 Lines of Python in C++ Because Why Not"
date: 2025-02-08
tags: [c++, autograd, gpt, deep-learning, karpathy]
description: "A faithful C++20 incarnation of Andrej Karpathy's microgpt — the most atomic way to train and run a GPT. No PyTorch. No dependencies. Just vibes and shared pointers."
---

# microgpt-cpp: When You Rewrite Karpathy's 200 Lines of Python in C++ Because Why Not

Look. Sometimes you see a piece of code so clean, so elegant, so *distilled* that your brain goes: "I must translate this into a language with semicolons."

That's exactly what happened when Andrej Karpathy dropped [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — a complete GPT training and inference pipeline in ~250 lines of pure Python. No PyTorch. No TensorFlow. No CUDA. Just `math`, `random`, and the raw, uncut beauty of backpropagation done by hand.

And I thought: *what if, but make it C++20?*

So here we are. **[microgpt-cpp](https://github.com/XingfuY/microgpt-cpp)** — a single-header, zero-dependency, modern C++ incarnation of Karpathy's microgpt. It compiles, it trains, it generates hallucinated names. Life is good.

---

## The Legend: Karpathy's microgpt.py

Let's talk about why Karpathy's version is legendary.

In a world drowning in 50,000-line codebases and "just pip install the thing" black boxes, Karpathy sits down and says: *here is everything you need to understand about how GPT works, in a single Python file.* No classes you need to chase through 17 files. No abstract base classes. No config YAML sprawl. Just **one file** with:

1. **A `Value` class** — the beating heart of autograd. Every number knows its parents and how to compute gradients. Reverse-mode autodiff in ~40 lines.

2. **Forward operations** — add, multiply, power, log, exp, relu. Each one builds the computation graph as it goes. No separate "define then run." No tape. It's just... Python objects pointing at each other.

3. **A baby GPT** — token embeddings, position embeddings, multi-head causal self-attention, an MLP block, RMS normalization, the works. All operating on `Value` objects, so every forward pass is automatically differentiable.

4. **Training** — cross-entropy loss, full backward pass through the entire model, Adam optimizer with cosine decay. In a for loop.

5. **Inference** — temperature-scaled sampling from the softmax distribution. Feed one token, get the next. Repeat until BOS or max length.

The genius isn't in any single component — it's that *all of them fit in one file* and *you can read them top-to-bottom in 20 minutes*. It's pedagogy through compression. Every line earns its place.

---

## The C++ Incarnation: microgpt.hpp

So how do you bring this to C++ without losing the soul?

The answer is: `shared_ptr`, operator overloading, and embracing the header-only life.

### The Value Engine

Karpathy's `Value` class stores `data`, `grad`, a list of children, and per-child local gradients. In C++, that's:

```cpp
struct ValueData {
    double data;
    double grad = 0.0;
    std::vector<std::shared_ptr<ValueData>> children;
    std::vector<double> local_grads;
};
using Var = std::shared_ptr<ValueData>;
```

Every arithmetic operation returns a new `Var` with the correct children and precomputed local gradients. Addition:

```cpp
inline Var operator+(const Var& a, const Var& b) {
    return std::make_shared<ValueData>(
        a->data + b->data,
        std::vector{a, b},
        std::vector{1.0, 1.0}  // d(a+b)/da = 1, d(a+b)/db = 1
    );
}
```

Multiplication:

```cpp
inline Var operator*(const Var& a, const Var& b) {
    return std::make_shared<ValueData>(
        a->data * b->data,
        std::vector{a, b},
        std::vector{b->data, a->data}  // product rule
    );
}
```

The beautiful thing about C++ operator overloading: `auto loss = -vlog(probs[target])` reads *exactly* like the Python version. The computation graph builds itself invisibly. You write math. The compiler writes the graph.

### Backward Pass

Topological sort via DFS, then reverse-order gradient propagation:

```cpp
inline void backward(const Var& root) {
    // Topo-sort the graph
    std::vector<ValueData*> topo;
    std::unordered_set<ValueData*> visited;
    std::function<void(ValueData*)> build = [&](ValueData* v) {
        if (visited.count(v)) return;
        visited.insert(v);
        for (auto& ch : v->children) build(ch.get());
        topo.push_back(v);
    };
    build(root.get());

    // Reverse-mode autodiff
    root->grad = 1.0;
    for (auto it = topo.rbegin(); it != topo.rend(); ++it)
        for (size_t i = 0; i < (*it)->children.size(); ++i)
            (*it)->children[i]->grad += (*it)->local_grads[i] * (*it)->grad;
}
```

This is functionally identical to Karpathy's `backward()`. Same algorithm, same traversal, same accumulation. The C++ version is arguably *more* readable because the raw-pointer topo vector avoids Python's `id()` gymnastics.

### The GPT

The model follows Karpathy's architecture exactly:

- **Token + position embeddings** → RMS norm
- **Multi-head self-attention** with KV cache (causal by construction — we only attend to past positions)
- **Output projection** → residual connection
- **MLP** (linear → ReLU → linear) → residual connection
- **Final linear projection** to vocabulary logits

Default config: 16-dim embeddings, 4 heads, 1 layer, 16-token context. Tiny enough to train on CPU in seconds, big enough to memorize short character patterns.

The C++ version adds explicit `KVCache` types (`std::vector<std::vector<Vec>>`) and processes one token at a time — same as the Python version's autoregressive loop.

---

## What Makes C++ Different (And Fun)

### Type Safety as Documentation

In Python, `w` is a list of lists of `Value`. In C++:

```cpp
using Vec = std::vector<Var>;
using Mat = std::vector<Vec>;
using StateDict = std::unordered_map<std::string, Mat>;
using KVCache = std::vector<std::vector<Vec>>;
```

You look at a function signature like `Vec gpt_forward(int token_id, int pos_id, KVCache& keys, KVCache& values, const StateDict& sd, const Config& cfg)` and you know *exactly* what goes in and what comes out. No `# type: ignore`. No runtime shape errors.

### Zero Dependencies, For Real

The Python version is "no PyTorch" but still needs Python. The C++ version needs... a C++20 compiler. That's it. No package manager. No virtual environments. No `pip install` that breaks your system Python.

```bash
cmake -B build && cmake --build build
./build/microgpt input.txt 500
```

Two commands. You're training a GPT.

### Shared Pointers as the Computation Graph

This is the key insight that makes the C++ translation natural: `shared_ptr<ValueData>` *is* the graph. When you write `a + b`, you create a node pointing to `a` and `b`. When nothing references a node anymore, it gets destroyed. The graph lives and dies with the math. No manual memory management. No garbage collector. Just RAII doing what RAII does best.

### The 27-Test Suite

Because this is C++ and we're not barbarians:

```
[==========] Running 27 tests from 6 test suites.
[  PASSED  ] 27 tests.
```

- **ValueForward** (9 tests): Every operation produces the right number
- **ValueBackward** (9 tests): Every gradient matches the analytical derivative, including a numerical gradient check on `f(a,b) = log(exp(a*b) + exp(a+b))`
- **Components** (5 tests): Linear, softmax (with numerical stability), RMS norm, softmax backward with finite-difference verification
- **Tokenizer** (1 test): Encode/decode roundtrip
- **GPT** (2 tests): Forward produces finite logits, KV cache grows correctly
- **Training** (1 test): Loss decreases over 100 steps on synthetic data

---

## The Zen of Minimal Implementations

There's a philosophy behind code like this. Karpathy has talked about it — the idea that you don't truly understand something until you can implement it from scratch, without libraries, in the simplest possible way.

Microgpt isn't meant to train the next ChatGPT. It's meant to make you *see* the algorithm. When every layer, every gradient, every optimization step is right there in front of you — not hidden behind `nn.Module` and `autograd` and `torch.compile` — you develop an intuition that no amount of documentation can give you.

The C++ version pushes this further. C++ makes you pay for everything. There's no NumPy broadcasting to hide a dimension mismatch. There's no dynamic dispatch to blur the boundary between "the math" and "the framework." It's all explicit. It's all there. And when you see it compile and the tests pass and the loss goes down — you know you understood it. Not approximately. *Exactly.*

---

## Try It

```bash
git clone https://github.com/XingfuY/microgpt-cpp.git
cd microgpt-cpp
cmake -B build && cmake --build build
echo -e "alice\nbob\ncharlie\ndave\neve" > input.txt
./build/microgpt input.txt 200
```

Watch the loss drop. Watch it hallucinate names. Then open `microgpt.hpp` and read the whole thing. It'll take you 15 minutes. You'll understand GPT better than you did this morning.

**[github.com/XingfuY/microgpt-cpp](https://github.com/XingfuY/microgpt-cpp)**
