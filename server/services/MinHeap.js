// ============================================
// MinHeap — Priority Queue implementation
// Priority = mentor's current workload (lower = higher priority)
// Used for O(log M) access to least-loaded mentor
// ============================================

class MinHeap {
  constructor() {
    this.heap = [];
  }

  // Get parent/child indices
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i) { return 2 * i + 1; }
  _right(i) { return 2 * i + 2; }

  // Swap two elements
  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // Bubble up after insertion
  _heapifyUp(i) {
    while (i > 0 && this.heap[i].workload < this.heap[this._parent(i)].workload) {
      this._swap(i, this._parent(i));
      i = this._parent(i);
    }
  }

  // Bubble down after extraction
  _heapifyDown(i) {
    const n = this.heap.length;
    let smallest = i;

    const left = this._left(i);
    const right = this._right(i);

    if (left < n && this.heap[left].workload < this.heap[smallest].workload) {
      smallest = left;
    }
    if (right < n && this.heap[right].workload < this.heap[smallest].workload) {
      smallest = right;
    }

    if (smallest !== i) {
      this._swap(i, smallest);
      this._heapifyDown(smallest);
    }
  }

  // Insert a mentor node into the heap — O(log M)
  insert(node) {
    this.heap.push(node);
    this._heapifyUp(this.heap.length - 1);
  }

  // Extract mentor with lowest workload — O(log M)
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);
    return min;
  }

  // Peek at min without removing — O(1)
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // Current size
  size() {
    return this.heap.length;
  }

  // Check if empty
  isEmpty() {
    return this.heap.length === 0;
  }
}

export default MinHeap;
