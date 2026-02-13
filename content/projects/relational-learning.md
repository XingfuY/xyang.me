# RelationalLearning

Scaling Graph Neural Networks to industrial-scale graphs with remote-backed storage.

## Overview

This project demonstrates how to train GNNs on graphs with **100M+ nodes and 1.6B edges** — far beyond what fits in a single machine's memory — using PyTorch Geometric's `GraphStore` and `FeatureStore` abstractions with remote backends.

## Architecture

- **GraphStore**: Adjacency stored in a distributed key-value store, sampled on-the-fly
- **FeatureStore**: Node/edge features stored remotely, fetched per mini-batch
- **Model**: GraphSAGE with neighbor sampling (fan-out: 15, 10, 5)
- **Training**: Distributed data-parallel across multiple GPUs

## Key Challenges

1. **Memory**: The full graph exceeds 500GB — remote backends stream subgraphs on demand
2. **I/O bottleneck**: Optimized prefetching and caching for neighbor sampling
3. **Convergence**: Careful tuning of sampling fan-out and learning rate schedules

## Results

- Successfully trained on a 100M node / 1.6B edge graph
- Achieved state-of-the-art link prediction accuracy on the benchmark
- 3.5x speedup over naive full-graph loading approach
