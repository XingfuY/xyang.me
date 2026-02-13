# MiniLM

A minimal JAX incarnation of the full life cycle of a modern language model, built from scratch.

## Overview

MiniLM implements the complete training pipeline for a Mixture-of-Experts (MoE) foundation model:

- **Data pipeline**: Tokenization, batching, and sharding across devices
- **Model architecture**: Transformer with MoE layers, RoPE embeddings, GQA
- **Pretraining**: Multi-device sharded training with data and tensor parallelism
- **Post-training**: SFT, reward modeling, RLHF with PPO/DPO/GRPO

## Key Features

- Pure JAX/Flax implementation — no PyTorch dependency
- Runs on TPU Research Cloud (v3-8 and v4-8 pods)
- Custom sharding strategies via `jax.sharding` and `NamedSharding`
- Mixed precision training with bfloat16

## Parallelism Strategy

```
Data Parallelism (across hosts)
└── Tensor Parallelism (across devices per host)
    └── Expert Parallelism (MoE routing)
```

The model uses a 2D mesh: data parallelism across the batch dimension and tensor parallelism across the model dimension. Expert layers are partitioned across devices using top-k routing.

## Results

- Trained a 1.3B parameter MoE model (8 experts, top-2 routing)
- Achieved competitive perplexity on C4 validation set
- Linear scaling efficiency up to 32 TPU v3 chips
