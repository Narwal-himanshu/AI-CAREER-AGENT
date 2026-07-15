import os
import json
import logging
import asyncio
import httpx
from typing import Dict, Any, List
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import DSAPracticeRequest, DSAPracticeResponse

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Comprehensive DSA topic list (LeetCode-aligned)
# ──────────────────────────────────────────────
DSA_TOPICS: Dict[str, str] = {
    "Arrays": "array",
    "Strings": "string",
    "Hash Table": "hash-table",
    "Linked Lists": "linked-list",
    "Stacks": "stack",
    "Queues": "queue",
    "Trees": "tree",
    "Binary Search Trees": "binary-search-tree",
    "Graphs": "graph",
    "Heaps (Priority Queue)": "heap",
    "Sorting": "sorting",
    "Searching": "binary-search",
    "Two Pointers": "two-pointers",
    "Sliding Window": "sliding-window",
    "Binary Search": "binary-search",
    "Recursion / Backtracking": "backtracking",
    "Dynamic Programming": "dynamic-programming",
    "Greedy": "greedy",
    "Bit Manipulation": "bit-manipulation",
    "Tries": "trie",
    "Union Find": "union-find",
    "Math & Number Theory": "math",
}

ALL_TOPIC_NAMES = list(DSA_TOPICS.keys())

# Cache configuration: 24h expiration (86400 seconds)
# Using a simple dictionary as TTLCache is available via cachetools
# Or implement a simple dict with timestamp
import time

class SimpleDictCache:
    def __init__(self, ttl_seconds):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None

    def set(self, key, value):
        self.cache[key] = (value, time.time())

# 24 hours cache
dsa_cache = SimpleDictCache(ttl_seconds=86400)

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.4,
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=0,
        # Force Gemini to return raw JSON instead of markdown-wrapped text so we
        # don't have to rely on brittle string-splitting to extract the payload.
        response_mime_type="application/json",
    )


class AgentProcessingError(Exception):
    pass


def _extract_json(content: str) -> str:
    """Best-effort extraction of a JSON object from an LLM response, in case
    response_mime_type is ignored by a given model/SDK version and the model
    still wraps the payload in markdown fences or extra prose."""
    content = content.strip()
    if "```json" in content:
        return content.split("```json")[1].split("```")[0].strip()
    if "```" in content:
        return content.split("```")[1].split("```")[0].strip()
    # Fallback: grab the outermost {...} block
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1 and end > start:
        return content[start:end + 1]
    return content


class DSAPracticeAgent:

    def _generate_mock_sheet(self, request: DSAPracticeRequest) -> DSAPracticeResponse:
        problems = [
            # ── Arrays (6) ──
            {'order': 1, 'topic': 'Arrays', 'problem_title': 'Two Sum', 'problem_id': '1', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/two-sum/', 'why_important': 'Classic hashmap problem for O(n) thinking', 'approach_hint': 'Use a hashmap to store complements', 'time_to_solve_minutes': 15, 'tags': ['Array', 'Hash Table']},
            {'order': 2, 'topic': 'Arrays', 'problem_title': 'Best Time to Buy and Sell Stock', 'problem_id': '121', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'why_important': 'Track min and max profit in one pass', 'approach_hint': 'Track min price and max profit', 'time_to_solve_minutes': 20, 'tags': ['Array', 'DP']},
            {'order': 3, 'topic': 'Arrays', 'problem_title': 'Product of Array Except Self', 'problem_id': '238', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/product-of-array-except-self/', 'why_important': 'Prefix/suffix product without division', 'approach_hint': 'Build prefix and suffix product arrays', 'time_to_solve_minutes': 25, 'tags': ['Array']},
            {'order': 4, 'topic': 'Arrays', 'problem_title': 'Maximum Subarray', 'problem_id': '53', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/maximum-subarray/', 'why_important': 'Kadane\'s algorithm for contiguous subarray', 'approach_hint': 'Track current sum, reset when it goes negative', 'time_to_solve_minutes': 20, 'tags': ['Array', 'DP']},
            {'order': 5, 'topic': 'Arrays', 'problem_title': 'Rotate Array', 'problem_id': '189', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/rotate-array/', 'why_important': 'In-place rotation using reversal technique', 'approach_hint': 'Reverse all, reverse first k, reverse rest', 'time_to_solve_minutes': 20, 'tags': ['Array']},
            {'order': 6, 'topic': 'Arrays', 'problem_title': 'Merge Sorted Array', 'problem_id': '88', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/merge-sorted-array/', 'why_important': 'Two-pointer merge from the end', 'approach_hint': 'Fill from the back using three pointers', 'time_to_solve_minutes': 15, 'tags': ['Array', 'Two Pointers']},
            # ── Strings (5) ──
            {'order': 7, 'topic': 'Strings', 'problem_title': 'Valid Palindrome', 'problem_id': '125', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/valid-palindrome/', 'why_important': 'Two pointer string traversal', 'approach_hint': 'Use two pointers from both ends, skip non-alphanumeric', 'time_to_solve_minutes': 10, 'tags': ['String', 'Two Pointers']},
            {'order': 8, 'topic': 'Strings', 'problem_title': 'Longest Palindromic Substring', 'problem_id': '5', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-palindromic-substring/', 'why_important': 'Expand-around-center pattern', 'approach_hint': 'Expand from each index and gap as center', 'time_to_solve_minutes': 25, 'tags': ['String', 'DP']},
            {'order': 9, 'topic': 'Strings', 'problem_title': 'Reverse String', 'problem_id': '344', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/reverse-string/', 'why_important': 'In-place two pointer swap', 'approach_hint': 'Swap characters from both ends moving inward', 'time_to_solve_minutes': 10, 'tags': ['String', 'Two Pointers']},
            {'order': 10, 'topic': 'Strings', 'problem_title': 'Valid Anagram', 'problem_id': '242', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/valid-anagram/', 'why_important': 'Frequency counting with hashmap', 'approach_hint': 'Count char frequencies in both strings and compare', 'time_to_solve_minutes': 10, 'tags': ['Hash Table', 'String']},
            {'order': 11, 'topic': 'Strings', 'problem_title': 'Longest Common Prefix', 'problem_id': '14', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/longest-common-prefix/', 'why_important': 'Vertical scanning or sorting approach', 'approach_hint': 'Compare characters column by column across all strings', 'time_to_solve_minutes': 10, 'tags': ['String']},
            # ── Hash Table (5) ──
            {'order': 12, 'topic': 'Hash Table', 'problem_title': 'Contains Duplicate', 'problem_id': '217', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/contains-duplicate/', 'why_important': 'HashSet for O(1) membership check', 'approach_hint': 'Add elements to a set, return true if already present', 'time_to_solve_minutes': 10, 'tags': ['Array', 'Hash Table']},
            {'order': 13, 'topic': 'Hash Table', 'problem_title': 'Group Anagrams', 'problem_id': '49', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/group-anagrams/', 'why_important': 'Hashing with sorted key or frequency key', 'approach_hint': 'Use sorted string or char count tuple as key', 'time_to_solve_minutes': 20, 'tags': ['Hash Table', 'String']},
            {'order': 14, 'topic': 'Hash Table', 'problem_title': 'Subarray Sum Equals K', 'problem_id': '560', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/subarray-sum-equals-k/', 'why_important': 'Prefix sum with hashmap counting', 'approach_hint': 'Track prefix sums, count how many times (sum - k) appeared', 'time_to_solve_minutes': 25, 'tags': ['Array', 'Hash Table']},
            {'order': 15, 'topic': 'Hash Table', 'problem_title': 'Two Sum', 'problem_id': '1', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/two-sum/', 'why_important': 'Classic hashmap complement lookup', 'approach_hint': 'Store seen numbers in map, check for complement', 'time_to_solve_minutes': 15, 'tags': ['Array', 'Hash Table']},
            {'order': 16, 'topic': 'Hash Table', 'problem_title': 'Longest Consecutive Sequence', 'problem_id': '128', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-consecutive-sequence/', 'why_important': 'O(n) hashmap sequence detection', 'approach_hint': 'Only start counting from sequence starts (num-1 not in set)', 'time_to_solve_minutes': 20, 'tags': ['Array', 'Hash Table']},
            # ── Linked Lists (5) ──
            {'order': 17, 'topic': 'Linked Lists', 'problem_title': 'Reverse Linked List', 'problem_id': '206', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/reverse-linked-list/', 'why_important': 'Pointer manipulation fundamentals', 'approach_hint': 'Iteratively reverse pointers with prev/curr/next', 'time_to_solve_minutes': 15, 'tags': ['Linked List']},
            {'order': 18, 'topic': 'Linked Lists', 'problem_title': 'Merge Two Sorted Lists', 'problem_id': '21', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/merge-two-sorted-lists/', 'why_important': 'Dummy node pattern for linked lists', 'approach_hint': 'Use a dummy head and compare node values', 'time_to_solve_minutes': 15, 'tags': ['Linked List']},
            {'order': 19, 'topic': 'Linked Lists', 'problem_title': 'Linked List Cycle', 'problem_id': '141', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/linked-list-cycle/', 'why_important': 'Floyd\'s cycle detection algorithm', 'approach_hint': 'Use slow and fast pointers', 'time_to_solve_minutes': 10, 'tags': ['Linked List', 'Two Pointers']},
            {'order': 20, 'topic': 'Linked Lists', 'problem_title': 'Remove Nth Node From End of List', 'problem_id': '19', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', 'why_important': 'Two-pointer gap technique', 'approach_hint': 'Advance first pointer n steps, then move both together', 'time_to_solve_minutes': 20, 'tags': ['Linked List', 'Two Pointers']},
            {'order': 21, 'topic': 'Linked Lists', 'problem_title': 'Middle of the Linked List', 'problem_id': '876', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/middle-of-the-linked-list/', 'why_important': 'Slow/fast pointer for midpoint', 'approach_hint': 'Slow moves 1 step, fast moves 2 steps', 'time_to_solve_minutes': 10, 'tags': ['Linked List', 'Two Pointers']},
            # ── Stacks (5) ──
            {'order': 22, 'topic': 'Stacks', 'problem_title': 'Valid Parentheses', 'problem_id': '20', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/valid-parentheses/', 'why_important': 'Stack application for matching', 'approach_hint': 'Use a stack to match brackets', 'time_to_solve_minutes': 15, 'tags': ['Stack', 'String']},
            {'order': 23, 'topic': 'Stacks', 'problem_title': 'Min Stack', 'problem_id': '155', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/min-stack/', 'why_important': 'Auxiliary stack for tracking min', 'approach_hint': 'Maintain a second stack that tracks current minimum', 'time_to_solve_minutes': 20, 'tags': ['Stack', 'Design']},
            {'order': 24, 'topic': 'Stacks', 'problem_title': 'Next Greater Element I', 'problem_id': '496', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/next-greater-element-i/', 'why_important': 'Monotonic stack pattern intro', 'approach_hint': 'Traverse right-to-left, pop smaller elements from stack', 'time_to_solve_minutes': 15, 'tags': ['Stack', 'Array', 'Hash Table']},
            {'order': 25, 'topic': 'Stacks', 'problem_title': 'Daily Temperatures', 'problem_id': '739', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/daily-temperatures/', 'why_important': 'Monotonic stack for next warmer day', 'approach_hint': 'Stack stores indices, pop when current temp is warmer', 'time_to_solve_minutes': 25, 'tags': ['Stack', 'Array']},
            {'order': 26, 'topic': 'Stacks', 'problem_title': 'Evaluate Reverse Polish Notation', 'problem_id': '150', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', 'why_important': 'Stack-based expression evaluation', 'approach_hint': 'Push operands, pop two on operator and push result', 'time_to_solve_minutes': 20, 'tags': ['Stack', 'Array']},
            # ── Queues (5) ──
            {'order': 27, 'topic': 'Queues', 'problem_title': 'Implement Queue using Stacks', 'problem_id': '232', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/implement-queue-using-stacks/', 'why_important': 'Queue-stack interplay', 'approach_hint': 'Use two stacks: one for enqueue, one for dequeue', 'time_to_solve_minutes': 20, 'tags': ['Queue', 'Stack', 'Design']},
            {'order': 28, 'topic': 'Queues', 'problem_title': 'Sliding Window Maximum', 'problem_id': '239', 'difficulty': 'HARD', 'leetcode_url': 'https://leetcode.com/problems/sliding-window-maximum/', 'why_important': 'Monotonic deque for window max', 'approach_hint': 'Deque stores indices of decreasing values, remove out-of-window', 'time_to_solve_minutes': 35, 'tags': ['Queue', 'Sliding Window', 'Deque']},
            {'order': 29, 'topic': 'Queues', 'problem_title': 'Rotting Oranges', 'problem_id': '994', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/rotting-oranges/', 'why_important': 'BFS level-by-level propagation', 'approach_hint': 'Multi-source BFS from all rotten oranges simultaneously', 'time_to_solve_minutes': 25, 'tags': ['Queue', 'BFS', 'Matrix']},
            {'order': 30, 'topic': 'Queues', 'problem_title': 'Open the Lock', 'problem_id': '752', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/open-the-lock/', 'why_important': 'BFS shortest path on state space', 'approach_hint': 'Each state is a 4-digit string, BFS to find min steps', 'time_to_solve_minutes': 30, 'tags': ['Queue', 'BFS', 'Hash Table']},
            {'order': 31, 'topic': 'Queues', 'problem_title': 'Design Circular Queue', 'problem_id': '622', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/design-circular-queue/', 'why_important': 'Array-based circular buffer implementation', 'approach_hint': 'Use fixed array with head/tail pointers and modular arithmetic', 'time_to_solve_minutes': 25, 'tags': ['Queue', 'Design', 'Array']},
            # ── Trees (5) ──
            {'order': 32, 'topic': 'Trees', 'problem_title': 'Maximum Depth of Binary Tree', 'problem_id': '104', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', 'why_important': 'Recursion on trees', 'approach_hint': 'DFS: return max(left, right) + 1', 'time_to_solve_minutes': 10, 'tags': ['Tree', 'DFS']},
            {'order': 33, 'topic': 'Trees', 'problem_title': 'Invert Binary Tree', 'problem_id': '226', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/invert-binary-tree/', 'why_important': 'Classic recursive tree problem', 'approach_hint': 'Swap left and right children, recurse', 'time_to_solve_minutes': 10, 'tags': ['Tree', 'DFS']},
            {'order': 34, 'topic': 'Trees', 'problem_title': 'Lowest Common Ancestor of a Binary Tree', 'problem_id': '236', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', 'why_important': 'Post-order recursion for LCA', 'approach_hint': 'If left and right both return non-null, current is LCA', 'time_to_solve_minutes': 20, 'tags': ['Tree', 'DFS']},
            {'order': 35, 'topic': 'Trees', 'problem_title': 'Same Tree', 'problem_id': '100', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/same-tree/', 'why_important': 'Parallel recursion comparison', 'approach_hint': 'Recurse on both trees simultaneously, compare values', 'time_to_solve_minutes': 10, 'tags': ['Tree', 'DFS']},
            {'order': 36, 'topic': 'Trees', 'problem_title': 'Subtree of Another Tree', 'problem_id': '572', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/subtree-of-another-tree/', 'why_important': 'Tree traversal + same-tree check', 'approach_hint': 'DFS every node, check if subtree matches using isSameTree', 'time_to_solve_minutes': 15, 'tags': ['Tree', 'DFS']},
            # ── Binary Search Trees (5) ──
            {'order': 37, 'topic': 'Binary Search Trees', 'problem_title': 'Validate Binary Search Tree', 'problem_id': '98', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/validate-binary-search-tree/', 'why_important': 'BST invariant checking', 'approach_hint': 'Pass valid range (min, max) down during DFS', 'time_to_solve_minutes': 20, 'tags': ['Tree', 'BST', 'DFS']},
            {'order': 38, 'topic': 'Binary Search Trees', 'problem_title': 'Search in a BST', 'problem_id': '700', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/search-in-a-binary-search-tree/', 'why_important': 'BST search property', 'approach_hint': 'Go left if target < node, right if target > node', 'time_to_solve_minutes': 10, 'tags': ['Tree', 'BST']},
            {'order': 39, 'topic': 'Binary Search Trees', 'problem_title': 'Kth Smallest Element in a BST', 'problem_id': '230', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', 'why_important': 'Inorder traversal yields sorted order', 'approach_hint': 'Inorder DFS, count nodes until k-th', 'time_to_solve_minutes': 20, 'tags': ['Tree', 'BST', 'DFS']},
            {'order': 40, 'topic': 'Binary Search Trees', 'problem_title': 'Two Sum IV - Input a BST', 'problem_id': '653', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/two-sum-iv-input-a-bst/', 'why_important': 'BST + HashSet combination', 'approach_hint': 'Inorder traverse, use set to find complement', 'time_to_solve_minutes': 15, 'tags': ['Tree', 'BST', 'Hash Table']},
            {'order': 41, 'topic': 'Binary Search Trees', 'problem_title': 'Delete Node in a BST', 'problem_id': '450', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/delete-node-in-a-bst/', 'why_important': 'BST deletion with successor/predecessor', 'approach_hint': 'Find node, replace with in-order successor then delete successor', 'time_to_solve_minutes': 30, 'tags': ['Tree', 'BST']},
            # ── Graphs (5) ──
            {'order': 42, 'topic': 'Graphs', 'problem_title': 'Number of Islands', 'problem_id': '200', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/number-of-islands/', 'why_important': 'Grid DFS/BFS classic', 'approach_hint': 'DFS on each land cell and mark visited', 'time_to_solve_minutes': 25, 'tags': ['Graph', 'DFS', 'Matrix']},
            {'order': 43, 'topic': 'Graphs', 'problem_title': 'Clone Graph', 'problem_id': '133', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/clone-graph/', 'why_important': 'Graph traversal with hashmap cloning', 'approach_hint': 'DFS/BFS with visited map from old to new nodes', 'time_to_solve_minutes': 25, 'tags': ['Graph', 'DFS', 'BFS']},
            {'order': 44, 'topic': 'Graphs', 'problem_title': 'Course Schedule', 'problem_id': '207', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/course-schedule/', 'why_important': 'Cycle detection in directed graph', 'approach_hint': 'Topological sort via Kahn\'s BFS or DFS cycle check', 'time_to_solve_minutes': 30, 'tags': ['Graph', 'BFS', 'DFS']},
            {'order': 45, 'topic': 'Graphs', 'problem_title': 'Pacific Atlantic Water Flow', 'problem_id': '417', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/pacific-atlantic-water-flow/', 'why_important': 'Reverse BFS/DFS from ocean borders', 'approach_hint': 'Start from ocean cells, flow inland tracking reachable cells', 'time_to_solve_minutes': 30, 'tags': ['Graph', 'BFS', 'DFS']},
            {'order': 46, 'topic': 'Graphs', 'problem_title': 'Number of Provinces', 'problem_id': '547', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/number-of-provinces/', 'why_important': 'Connected components counting', 'approach_hint': 'DFS/BFS from each unvisited node, count components', 'time_to_solve_minutes': 20, 'tags': ['Graph', 'DFS']},
            # ── Heaps (Priority Queue) (5) ──
            {'order': 47, 'topic': 'Heaps (Priority Queue)', 'problem_title': 'Top K Frequent Elements', 'problem_id': '347', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/top-k-frequent-elements/', 'why_important': 'Heap / bucket sort', 'approach_hint': 'Count frequencies then use a min-heap of size k', 'time_to_solve_minutes': 20, 'tags': ['Heap', 'Hash Table']},
            {'order': 48, 'topic': 'Heaps (Priority Queue)', 'problem_title': 'Find Median from Data Stream', 'problem_id': '295', 'difficulty': 'HARD', 'leetcode_url': 'https://leetcode.com/problems/find-median-from-data-stream/', 'why_important': 'Two-heap technique for online median', 'approach_hint': 'Max-heap for lower half, min-heap for upper half', 'time_to_solve_minutes': 35, 'tags': ['Heap', 'Design']},
            {'order': 49, 'topic': 'Heaps (Priority Queue)', 'problem_title': 'Kth Largest Element in an Array', 'problem_id': '215', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/kth-largest-element-in-an-array/', 'why_important': 'Min-heap of size k or quickselect', 'approach_hint': 'Maintain a min-heap of size k, or use quickselect O(n)', 'time_to_solve_minutes': 20, 'tags': ['Heap', 'Array']},
            {'order': 50, 'topic': 'Heaps (Priority Queue)', 'problem_title': 'Task Scheduler', 'problem_id': '621', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/task-scheduler/', 'why_important': 'Greedy + heap scheduling', 'approach_hint': 'Always run most frequent task first, use idle slots for cooldown', 'time_to_solve_minutes': 30, 'tags': ['Heap', 'Greedy']},
            {'order': 51, 'topic': 'Heaps (Priority Queue)', 'problem_title': 'Reorganize String', 'problem_id': '767', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/reorganize-string/', 'why_important': 'Greedy heap-based rearrangement', 'approach_hint': 'Max-heap by frequency, place most frequent char greedily', 'time_to_solve_minutes': 25, 'tags': ['Heap', 'Greedy', 'String']},
            # ── Sorting (5) ──
            {'order': 52, 'topic': 'Sorting', 'problem_title': 'Merge Intervals', 'problem_id': '56', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/merge-intervals/', 'why_important': 'Interval merging after sorting', 'approach_hint': 'Sort by start, merge overlapping intervals', 'time_to_solve_minutes': 20, 'tags': ['Sorting', 'Array']},
            {'order': 53, 'topic': 'Sorting', 'problem_title': 'Sort Colors', 'problem_id': '75', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/sort-colors/', 'why_important': 'Dutch National Flag three-way partition', 'approach_hint': 'Three pointers: low, mid, high for 0,1,2 partitioning', 'time_to_solve_minutes': 20, 'tags': ['Sorting', 'Array', 'Two Pointers']},
            {'order': 54, 'topic': 'Sorting', 'problem_title': 'Largest Number', 'problem_id': '179', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/largest-number/', 'why_important': 'Custom comparator sorting', 'approach_hint': 'Sort strings by a+b > b+a comparator', 'time_to_solve_minutes': 25, 'tags': ['Sorting', 'String']},
            {'order': 55, 'topic': 'Sorting', 'problem_title': 'Meeting Rooms', 'problem_id': '252', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/meeting-rooms/', 'why_important': 'Interval sorting + overlap check', 'approach_hint': 'Sort by start time, check if any end > next start', 'time_to_solve_minutes': 10, 'tags': ['Sorting', 'Array']},
            {'order': 56, 'topic': 'Sorting', 'problem_title': 'Insert Interval', 'problem_id': '57', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/insert-interval/', 'why_important': 'Interval insertion with merge', 'approach_hint': 'Collect non-overlapping before/after, merge overlapping with new', 'time_to_solve_minutes': 25, 'tags': ['Sorting', 'Array']},
            # ── Searching (5) ──
            {'order': 57, 'topic': 'Searching', 'problem_title': 'Binary Search', 'problem_id': '704', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/binary-search/', 'why_important': 'O(log n) search foundation', 'approach_hint': 'Standard binary search with left/right pointers', 'time_to_solve_minutes': 10, 'tags': ['Binary Search']},
            {'order': 58, 'topic': 'Searching', 'problem_title': 'Search in Rotated Sorted Array', 'problem_id': '33', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/search-in-rotated-sorted-array/', 'why_important': 'Modified binary search', 'approach_hint': 'Determine which half is sorted, then search that half', 'time_to_solve_minutes': 20, 'tags': ['Binary Search']},
            {'order': 59, 'topic': 'Searching', 'problem_title': 'Find Minimum in Rotated Sorted Array', 'problem_id': '153', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', 'why_important': 'Binary search for pivot point', 'approach_hint': 'If mid > right, min is in right half; else left half', 'time_to_solve_minutes': 15, 'tags': ['Binary Search']},
            {'order': 60, 'topic': 'Searching', 'problem_title': 'Median of Two Sorted Arrays', 'problem_id': '4', 'difficulty': 'HARD', 'leetcode_url': 'https://leetcode.com/problems/median-of-two-sorted-arrays/', 'why_important': 'O(log(m+n)) binary search on partitions', 'approach_hint': 'Binary search on shorter array, partition both at i and j=(m+n+1)/2-i', 'time_to_solve_minutes': 40, 'tags': ['Binary Search', 'Array']},
            {'order': 61, 'topic': 'Searching', 'problem_title': 'Guess Number Higher or Lower', 'problem_id': '374', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/guess-number-higher-or-lower/', 'why_important': 'Binary search with API interaction', 'approach_hint': 'Standard binary search using guess() feedback', 'time_to_solve_minutes': 10, 'tags': ['Binary Search']},
            # ── Two Pointers (5) ──
            {'order': 62, 'topic': 'Two Pointers', 'problem_title': 'Container With Most Water', 'problem_id': '11', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/container-with-most-water/', 'why_important': 'Two pointer greedy approach', 'approach_hint': 'Move the pointer pointing to the shorter line inward', 'time_to_solve_minutes': 20, 'tags': ['Two Pointers', 'Greedy']},
            {'order': 63, 'topic': 'Two Pointers', 'problem_title': '3Sum', 'problem_id': '15', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/3sum/', 'why_important': 'Sort + two pointers to avoid O(n^3)', 'approach_hint': 'Fix one element, two-pointer search for remaining two', 'time_to_solve_minutes': 25, 'tags': ['Two Pointers', 'Sorting']},
            {'order': 64, 'topic': 'Two Pointers', 'problem_title': 'Move Zeroes', 'problem_id': '283', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/move-zeroes/', 'why_important': 'In-place swap partitioning', 'approach_hint': 'Slow pointer tracks insertion spot, fast scans ahead', 'time_to_solve_minutes': 10, 'tags': ['Array', 'Two Pointers']},
            {'order': 65, 'topic': 'Two Pointers', 'problem_title': 'Valid Palindrome II', 'problem_id': '680', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/valid-palindrome-ii/', 'why_important': 'Two pointers with one-skip tolerance', 'approach_hint': 'If mismatch, check if skipping left or right makes palindrome', 'time_to_solve_minutes': 15, 'tags': ['String', 'Two Pointers']},
            {'order': 66, 'topic': 'Two Pointers', 'problem_title': 'Sort Colors', 'problem_id': '75', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/sort-colors/', 'why_important': 'Dutch National Flag three-way partition', 'approach_hint': 'Three pointers: low, mid, high for 0,1,2 partitioning', 'time_to_solve_minutes': 20, 'tags': ['Two Pointers', 'Sorting']},
            # ── Sliding Window (5) ──
            {'order': 67, 'topic': 'Sliding Window', 'problem_title': 'Longest Substring Without Repeating Characters', 'problem_id': '3', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 'why_important': 'Sliding window pattern', 'approach_hint': 'Two pointers + set to track chars in window', 'time_to_solve_minutes': 20, 'tags': ['Sliding Window', 'String']},
            {'order': 68, 'topic': 'Sliding Window', 'problem_title': 'Minimum Window Substring', 'problem_id': '76', 'difficulty': 'HARD', 'leetcode_url': 'https://leetcode.com/problems/minimum-window-substring/', 'why_important': 'Hard sliding window with frequency matching', 'approach_hint': 'Expand until all required chars are in window, then shrink', 'time_to_solve_minutes': 35, 'tags': ['Sliding Window', 'String']},
            {'order': 69, 'topic': 'Sliding Window', 'problem_title': 'Maximum Average Subarray I', 'problem_id': '643', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/maximum-average-subarray-i/', 'why_important': 'Fixed-size sliding window intro', 'approach_hint': 'Compute sum of first k, slide and update max', 'time_to_solve_minutes': 10, 'tags': ['Sliding Window', 'Array']},
            {'order': 70, 'topic': 'Sliding Window', 'problem_title': 'Permutation in String', 'problem_id': '567', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/permutation-in-string/', 'why_important': 'Fixed window with frequency matching', 'approach_hint': 'Count freq of s1, slide window of size |s1| over s2', 'time_to_solve_minutes': 25, 'tags': ['Sliding Window', 'String']},
            {'order': 71, 'topic': 'Sliding Window', 'problem_title': 'Fruit Into Baskets', 'problem_id': '904', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/fruit-into-baskets/', 'why_important': 'Longest subarray with at most 2 distinct', 'approach_hint': 'Sliding window with hashmap tracking distinct count', 'time_to_solve_minutes': 25, 'tags': ['Sliding Window', 'Array', 'Hash Table']},
            # ── Binary Search (5) ──
            {'order': 72, 'topic': 'Binary Search', 'problem_title': 'Search Insert Position', 'problem_id': '35', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/search-insert-position/', 'why_important': 'Lower bound binary search', 'approach_hint': 'Find first index where nums[i] >= target', 'time_to_solve_minutes': 10, 'tags': ['Binary Search', 'Array']},
            {'order': 73, 'topic': 'Binary Search', 'problem_title': 'Koko Eating Bananas', 'problem_id': '875', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/koko-eating-bananas/', 'why_important': 'Binary search on answer space', 'approach_hint': 'Binary search on eating speed k, check if feasible in h hours', 'time_to_solve_minutes': 20, 'tags': ['Binary Search', 'Array']},
            {'order': 74, 'topic': 'Binary Search', 'problem_title': 'First Bad Version', 'problem_id': '278', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/first-bad-version/', 'why_important': 'Binary search with API call', 'approach_hint': 'Find first version where isBadVersion returns true', 'time_to_solve_minutes': 10, 'tags': ['Binary Search']},
            {'order': 75, 'topic': 'Binary Search', 'problem_title': 'Capacity To Ship Packages Within D Days', 'problem_id': '1011', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', 'why_important': 'Binary search on capacity answer', 'approach_hint': 'Binary search on weight capacity, greedily check if feasible in d days', 'time_to_solve_minutes': 25, 'tags': ['Binary Search', 'Array']},
            {'order': 76, 'topic': 'Binary Search', 'problem_title': 'Find Peak Element', 'problem_id': '162', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/find-peak-element/', 'why_important': 'Binary search for local maximum', 'approach_hint': 'If mid < mid+1, peak is right; else peak is left or mid', 'time_to_solve_minutes': 15, 'tags': ['Binary Search', 'Array']},
            # ── Recursion / Backtracking (5) ──
            {'order': 77, 'topic': 'Recursion / Backtracking', 'problem_title': 'Subsets', 'problem_id': '78', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/subsets/', 'why_important': 'Power set generation', 'approach_hint': 'Include or exclude each element recursively', 'time_to_solve_minutes': 20, 'tags': ['Backtracking', 'Array']},
            {'order': 78, 'topic': 'Recursion / Backtracking', 'problem_title': 'Combination Sum', 'problem_id': '39', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/combination-sum/', 'why_important': 'Backtracking with reuse', 'approach_hint': 'Recurse, allowing same element to be chosen again', 'time_to_solve_minutes': 25, 'tags': ['Backtracking']},
            {'order': 79, 'topic': 'Recursion / Backtracking', 'problem_title': 'Generate Parentheses', 'problem_id': '22', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/generate-parentheses/', 'why_important': 'Backtracking with constraints', 'approach_hint': 'Add ( if count < n, add ) if close < open', 'time_to_solve_minutes': 20, 'tags': ['Backtracking', 'String']},
            {'order': 80, 'topic': 'Recursion / Backtracking', 'problem_title': 'Letter Combinations of a Phone Number', 'problem_id': '17', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', 'why_important': 'Cartesian product via backtracking', 'approach_hint': 'For each digit, try all mapped letters and recurse', 'time_to_solve_minutes': 20, 'tags': ['Backtracking', 'String']},
            {'order': 81, 'topic': 'Recursion / Backtracking', 'problem_title': 'Word Search', 'problem_id': '79', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/word-search/', 'why_important': 'Grid DFS with backtracking', 'approach_hint': 'DFS from each cell, mark visited, backtrack on mismatch', 'time_to_solve_minutes': 25, 'tags': ['Backtracking', 'Matrix']},
            # ── Dynamic Programming (6) ──
            {'order': 82, 'topic': 'Dynamic Programming', 'problem_title': 'Climbing Stairs', 'problem_id': '70', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/climbing-stairs/', 'why_important': 'Fibonacci-style DP intro', 'approach_hint': 'dp[n] = dp[n-1] + dp[n-2]', 'time_to_solve_minutes': 15, 'tags': ['DP']},
            {'order': 83, 'topic': 'Dynamic Programming', 'problem_title': 'Coin Change', 'problem_id': '322', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/coin-change/', 'why_important': 'Classic unbounded knapsack DP', 'approach_hint': 'dp[i] = min coins to make amount i', 'time_to_solve_minutes': 25, 'tags': ['DP', 'Array']},
            {'order': 84, 'topic': 'Dynamic Programming', 'problem_title': 'Longest Common Subsequence', 'problem_id': '1143', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-common-subsequence/', 'why_important': '2D DP on strings', 'approach_hint': 'dp[i][j] = LCS of first i and j chars', 'time_to_solve_minutes': 25, 'tags': ['DP', 'String']},
            {'order': 85, 'topic': 'Dynamic Programming', 'problem_title': 'House Robber', 'problem_id': '198', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/house-robber/', 'why_important': 'Linear DP with adjacency constraint', 'approach_hint': 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])', 'time_to_solve_minutes': 20, 'tags': ['DP', 'Array']},
            {'order': 86, 'topic': 'Dynamic Programming', 'problem_title': 'Unique Paths', 'problem_id': '62', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/unique-paths/', 'why_important': '2D grid DP', 'approach_hint': 'dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'time_to_solve_minutes': 20, 'tags': ['DP', 'Matrix']},
            {'order': 87, 'topic': 'Dynamic Programming', 'problem_title': 'Longest Increasing Subsequence', 'problem_id': '300', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-increasing-subsequence/', 'why_important': 'Classic LIS with patience sorting O(n log n)', 'approach_hint': 'Maintain tails array, binary search for each element', 'time_to_solve_minutes': 25, 'tags': ['DP', 'Binary Search']},
            # ── Greedy (5) ──
            {'order': 88, 'topic': 'Greedy', 'problem_title': 'Jump Game', 'problem_id': '55', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/jump-game/', 'why_important': 'Greedy reachability', 'approach_hint': 'Track the farthest reachable index', 'time_to_solve_minutes': 20, 'tags': ['Greedy', 'DP']},
            {'order': 89, 'topic': 'Greedy', 'problem_title': 'Jump Game II', 'problem_id': '45', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/jump-game-ii/', 'why_important': 'Greedy BFS-like minimum jumps', 'approach_hint': 'Track current end and farthest, increment jumps at boundary', 'time_to_solve_minutes': 20, 'tags': ['Greedy', 'DP']},
            {'order': 90, 'topic': 'Greedy', 'problem_title': 'Partition Labels', 'problem_id': '763', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/partition-labels/', 'why_important': 'Greedy partitioning by last occurrence', 'approach_hint': 'Track last index of each char, expand partition end greedily', 'time_to_solve_minutes': 20, 'tags': ['Greedy', 'String']},
            {'order': 91, 'topic': 'Greedy', 'problem_title': 'Maximum Subarray', 'problem_id': '53', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/maximum-subarray/', 'why_important': 'Kadane\'s algorithm (greedy + DP)', 'approach_hint': 'Keep running sum, reset to 0 when it drops below 0', 'time_to_solve_minutes': 15, 'tags': ['Greedy', 'Array', 'DP']},
            {'order': 92, 'topic': 'Greedy', 'problem_title': 'Minimum Absolute Difference in BST', 'problem_id': '783', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/minimum-absolute-difference-in-bst/', 'why_important': 'Inorder traversal gives sorted order for min diff', 'approach_hint': 'Inorder DFS, track previous value and compute min diff', 'time_to_solve_minutes': 15, 'tags': ['Greedy', 'Tree', 'BST']},
            # ── Bit Manipulation (5) ──
            {'order': 93, 'topic': 'Bit Manipulation', 'problem_title': 'Single Number', 'problem_id': '136', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/single-number/', 'why_important': 'XOR trick for unique element', 'approach_hint': 'XOR all numbers; pairs cancel out', 'time_to_solve_minutes': 10, 'tags': ['Bit Manipulation']},
            {'order': 94, 'topic': 'Bit Manipulation', 'problem_title': 'Number of 1 Bits', 'problem_id': '191', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/number-of-1-bits/', 'why_important': 'Brian Kernighan\'s bit count trick', 'approach_hint': 'n & (n-1) clears lowest set bit, count until n==0', 'time_to_solve_minutes': 10, 'tags': ['Bit Manipulation']},
            {'order': 95, 'topic': 'Bit Manipulation', 'problem_title': 'Reverse Bits', 'problem_id': '190', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/reverse-bits/', 'why_important': 'Bit-by-bit reversal', 'approach_hint': 'Shift result left, OR with last bit of n, shift n right', 'time_to_solve_minutes': 15, 'tags': ['Bit Manipulation']},
            {'order': 96, 'topic': 'Bit Manipulation', 'problem_title': 'Missing Number', 'problem_id': '268', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/missing-number/', 'why_important': 'XOR trick: a^a=0, 0^b=b', 'approach_hint': 'XOR all indices with all values; missing number remains', 'time_to_solve_minutes': 10, 'tags': ['Bit Manipulation', 'Array']},
            {'order': 97, 'topic': 'Bit Manipulation', 'problem_title': 'Counting Bits', 'problem_id': '338', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/counting-bits/', 'why_important': 'DP on bit patterns', 'approach_hint': 'dp[i] = dp[i >> 1] + (i & 1)', 'time_to_solve_minutes': 15, 'tags': ['Bit Manipulation', 'DP']},
            # ── Tries (5) ──
            {'order': 98, 'topic': 'Tries', 'problem_title': 'Implement Trie (Prefix Tree)', 'problem_id': '208', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/implement-trie-prefix-tree/', 'why_important': 'Trie data structure foundation', 'approach_hint': 'Each node holds a map of children and an end-of-word flag', 'time_to_solve_minutes': 25, 'tags': ['Trie', 'String']},
            {'order': 99, 'topic': 'Tries', 'problem_title': 'Design Add and Search Words Data Structure', 'problem_id': '211', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', 'why_important': 'Trie with wildcard search', 'approach_hint': 'On ".", try all children recursively; otherwise normal trie traversal', 'time_to_solve_minutes': 25, 'tags': ['Trie', 'DFS', 'Design']},
            {'order': 100, 'topic': 'Tries', 'problem_title': 'Map Sum Pairs', 'problem_id': '677', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/map-sum-pairs/', 'why_important': 'Trie with value storage and prefix sum', 'approach_hint': 'Store values at end nodes, sum all values under prefix subtree', 'time_to_solve_minutes': 20, 'tags': ['Trie', 'Design']},
            {'order': 101, 'topic': 'Tries', 'problem_title': 'Maximum XOR of Two Numbers in an Array', 'problem_id': '421', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/', 'why_important': 'Bitwise trie for XOR maximization', 'approach_hint': 'Insert numbers bit-by-bit into trie, query for opposite bits', 'time_to_solve_minutes': 30, 'tags': ['Trie', 'Bit Manipulation']},
            {'order': 102, 'topic': 'Tries', 'problem_title': 'Word Search II', 'problem_id': '212', 'difficulty': 'HARD', 'leetcode_url': 'https://leetcode.com/problems/word-search-ii/', 'why_important': 'Trie + backtracking on grid', 'approach_hint': 'Build trie from words, DFS on grid following trie paths', 'time_to_solve_minutes': 40, 'tags': ['Trie', 'Backtracking', 'Matrix']},
            # ── Union Find (5) ──
            {'order': 103, 'topic': 'Union Find', 'problem_title': 'Number of Connected Components in an Undirected Graph', 'problem_id': '323', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', 'why_important': 'Classic Union-Find application', 'approach_hint': 'Union edges, count distinct parents at the end', 'time_to_solve_minutes': 25, 'tags': ['Union Find', 'Graph']},
            {'order': 104, 'topic': 'Union Find', 'problem_title': 'Redundant Connection', 'problem_id': '684', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/redundant-connection/', 'why_important': 'Cycle detection via Union-Find', 'approach_hint': 'Union edges; if both already in same set, it\'s the redundant edge', 'time_to_solve_minutes': 25, 'tags': ['Union Find', 'Graph']},
            {'order': 105, 'topic': 'Union Find', 'problem_title': 'Accounts Merge', 'problem_id': '721', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/accounts-merge/', 'why_important': 'Union-Find on email equivalence', 'approach_hint': 'Union emails within same account, then group by root parent', 'time_to_solve_minutes': 30, 'tags': ['Union Find', 'Graph']},
            {'order': 106, 'topic': 'Union Find', 'problem_title': 'Surrounded Regions', 'problem_id': '130', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/surrounded-regions/', 'why_important': 'Reverse thinking: mark unsurrounded from border', 'approach_hint': 'DFS/BFS from border O\'s, then flip all remaining O to X', 'time_to_solve_minutes': 25, 'tags': ['Union Find', 'DFS', 'Matrix']},
            {'order': 107, 'topic': 'Union Find', 'problem_title': 'Number of Provinces', 'problem_id': '547', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/number-of-provinces/', 'why_important': 'Connected components counting', 'approach_hint': 'Union adjacent nodes, count distinct parents', 'time_to_solve_minutes': 20, 'tags': ['Union Find', 'Graph']},
            # ── Math & Number Theory (5) ──
            {'order': 108, 'topic': 'Math & Number Theory', 'problem_title': 'Power of Two', 'problem_id': '231', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/power-of-two/', 'why_important': 'Bit manipulation for math check', 'approach_hint': 'n > 0 and (n & (n - 1)) == 0', 'time_to_solve_minutes': 10, 'tags': ['Math', 'Bit Manipulation']},
            {'order': 109, 'topic': 'Math & Number Theory', 'problem_title': 'Count Primes', 'problem_id': '204', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/count-primes/', 'why_important': 'Sieve of Eratosthenes', 'approach_hint': 'Mark multiples of each prime, count unmarked', 'time_to_solve_minutes': 20, 'tags': ['Math', 'Array']},
            {'order': 110, 'topic': 'Math & Number Theory', 'problem_title': 'Happy Number', 'problem_id': '202', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/happy-number/', 'why_important': 'Cycle detection via repeated squaring', 'approach_hint': 'Floyd\'s cycle detection on digit-square-sum sequence', 'time_to_solve_minutes': 15, 'tags': ['Math', 'Two Pointers']},
            {'order': 111, 'topic': 'Math & Number Theory', 'problem_title': 'Plus One', 'problem_id': '66', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/plus-one/', 'why_important': 'Big integer carry propagation', 'approach_hint': 'Traverse from end, handle carry, insert 1 at front if needed', 'time_to_solve_minutes': 10, 'tags': ['Math', 'Array']},
            {'order': 112, 'topic': 'Math & Number Theory', 'problem_title': 'Factorial Trailing Zeroes', 'problem_id': '172', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/factorial-trailing-zeroes/', 'why_important': 'Counting factors of 5 in n!', 'approach_hint': 'Sum n/5 + n/25 + n/125 + ... until divisor > n', 'time_to_solve_minutes': 10, 'tags': ['Math']},
        ]

        topics_requested = getattr(request, 'topics', None) or [request.topic] if request.topic != 'all' else None
        if topics_requested and topics_requested != ['all']:
            topic_set = {t.lower() for t in topics_requested}
            problems = [p for p in problems if p['topic'].lower() in topic_set]
            if not problems:
                problems = [
                    {'order': i + 1, 'topic': t, 'problem_title': f'Practice {t} #{i+1}', 'problem_id': '0', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problemset/', 'why_important': f'Build {t} fundamentals', 'approach_hint': 'Think step by step', 'time_to_solve_minutes': 15, 'tags': [t]} for i, t in enumerate(topics_requested[:5])
                ]

        return DSAPracticeResponse(
            level=request.level,
            topic_focus=request.domain,
            sheet=problems,
            study_plan='Solve 3-5 problems daily, focusing on one topic at a time. Review solutions and track patterns.',
            daily_target='3-5 problems per day'
        )

    async def fetch_leetcode_problems(self, level: str, topic_slugs: List[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        """Fetch LeetCode problems filtered by difficulty and optionally by topic tags.

        When topic_slugs is provided, issues one request per topic slug and merges
        the results (deduped by question ID).  Each request is capped at `limit`.
        """
        url = "https://leetcode.com/graphql"

        difficulty_mapping = {
            "Beginner": "EASY",
            "Intermediate": "MEDIUM",
            "Advanced": "HARD",
        }
        mapped_difficulty = difficulty_mapping.get(level, "EASY")

        query = """
        query problemsetQuestionList($categorySlug: String, $limit: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, filters: $filters) {
            questions: data {
              acRate
              difficulty
              frontendQuestionId: questionFrontendId
              title
              titleSlug
              topicTags { name slug }
            }
          }
        }
        """

        async def _fetch_one(client: httpx.AsyncClient, slug: str = None) -> List[Dict]:
            filters: Dict[str, Any] = {"difficulty": mapped_difficulty}
            if slug:
                filters["tags"] = [slug]
            variables = {"categorySlug": "", "limit": limit, "filters": filters}
            try:
                resp = await client.post(url, json={"query": query, "variables": variables})
                resp.raise_for_status()
                data = resp.json()
                return data.get("data", {}).get("problemsetQuestionList", {}).get("questions", [])
            except Exception as e:
                logger.warning(f"LeetCode fetch failed for slug={slug}: {e}")
                return []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                if topic_slugs:
                    tasks = [_fetch_one(client, s) for s in topic_slugs]
                    results = await asyncio.gather(*tasks)
                    # Flatten and dedup by question ID
                    seen = set()
                    merged = []
                    for batch in results:
                        for q in batch:
                            qid = q.get("frontendQuestionId")
                            if qid and qid not in seen:
                                seen.add(qid)
                                merged.append(q)
                    return merged
                else:
                    return await _fetch_one(client)
        except Exception as e:
            logger.error(f"Failed to fetch problems from LeetCode GraphQL: {e}")
            return []

    async def generate_dsa_sheet(self, request: DSAPracticeRequest) -> DSAPracticeResponse:
        # Resolve requested topics
        requested_topics = getattr(request, 'topics', None) or []
        if not requested_topics or requested_topics == ["all"]:
            topic_names = ALL_TOPIC_NAMES
        else:
            topic_names = requested_topics

        cache_key = f"{request.level}_{'_'.join(sorted(topic_names))}_{request.domain}"
        cached_result = dsa_cache.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached DSA sheet for key: {cache_key}")
            return cached_result

        # 1. Fetch real problems from LeetCode (per-topic)
        topic_slugs = [DSA_TOPICS[t] for t in topic_names if t in DSA_TOPICS]
        # De-duplicate slugs (e.g. Searching and Binary Search both map to "binary-search")
        unique_slugs = list(dict.fromkeys(topic_slugs))
        raw_questions = await self.fetch_leetcode_problems(request.level, topic_slugs=unique_slugs, limit=200)

        # 2. Simplify and tag each question with its matched topics
        simplified_by_topic: Dict[str, List[Dict]] = {t: [] for t in topic_names}
        for q in raw_questions:
            qtags = {tag.get("slug") for tag in q.get("topicTags", [])}
            qtags_names = {tag.get("name", "").lower() for tag in q.get("topicTags", [])}
            entry = {
                "id": q.get("frontendQuestionId"),
                "title": q.get("title"),
                "slug": q.get("titleSlug"),
                "difficulty": q.get("difficulty"),
                "tags": [tag.get("name") for tag in q.get("topicTags", [])],
            }
            for tname in topic_names:
                tslug = DSA_TOPICS.get(tname, "")
                if tslug in qtags or tname.lower() in qtags_names:
                    simplified_by_topic[tname].append(entry)

        # Build a flat list for the prompt, plus a per-topic summary
        flat_questions = []
        for tname, qs in simplified_by_topic.items():
            for q in qs[:30]:  # cap per-topic to keep prompt size manageable
                q["_topic"] = tname
                flat_questions.append(q)

        # 3. Curate using Gemini
        llm = get_llm()

        system_prompt = (
            "You are an expert Data Structures and Algorithms instructor. "
            "Your task is to create a comprehensive, topic-wise practice sheet with multiple problems per topic."
        )

        topic_summary = "\n".join(
            f"- {t}: {len(simplified_by_topic.get(t, []))} problems available"
            for t in topic_names
        )

        user_prompt = f"""
Student Profile:
- Level: {request.level}
- Domain Focus: {request.domain}
- Requested Topics: {', '.join(topic_names)}

Problem Availability per Topic:
{topic_summary}

Available LeetCode Problems (up to 30 per topic):
{json.dumps(flat_questions[:300], indent=2)}

Task:
Create a comprehensive practice sheet by selecting 5-8 problems for EACH of the requested topics.
Total problems should be {len(topic_names) * 5}-{len(topic_names) * 8}.

Rules:
1. Cover EVERY requested topic with at least 5 problems (mix of EASY, MEDIUM, HARD where available)
2. Prefer problems from the provided list. If a topic has fewer than 5 available problems, supplement with well-known LeetCode problems from your knowledge.
3. Order problems within each topic from easier to harder.
4. Assign sequential order numbers across the entire sheet.
5. For each problem, provide a meaningful "why_important" (1 sentence on why it's a good learning problem) and a concise "approach_hint" (1 sentence on the algorithm/pattern to use).

The output MUST be exactly in the following JSON format:
{{
  "level": "{request.level}",
  "topic_focus": "{request.domain}",
  "sheet": [
    {{
      "order": 1,
      "topic": "topic name from the requested list",
      "problem_title": "LeetCode problem title",
      "problem_id": "LeetCode problem number as string",
      "difficulty": "EASY or MEDIUM or HARD",
      "leetcode_url": "https://leetcode.com/problems/{{titleSlug}}/",
      "why_important": "One sentence on why this problem is important",
      "approach_hint": "One sentence on the algorithm or pattern to use",
      "time_to_solve_minutes": 15,
      "tags": ["tag1", "tag2"]
    }}
  ],
  "study_plan": "A 4-6 week study plan covering all topics with daily targets",
  "daily_target": "3-5 problems per day"
}}
Ensure the JSON is valid and conforms exactly to this structure without markdown wrappers.
"""
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        try:
            result = await self._invoke_with_retry(llm, full_prompt)
            dsa_cache.set(cache_key, result)
            return result
        except Exception as e:
            logger.warning(f"Gemini DSA curation failed after retries, using mock: {e}")
            result = self._generate_mock_sheet(request)
            dsa_cache.set(cache_key, result)
            return result

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=4),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(AgentProcessingError),
        reraise=True,
    )
    async def _invoke_with_retry(self, llm, full_prompt: str) -> DSAPracticeResponse:
        """Call Gemini and parse+validate the JSON. Retries on parse/validation
        failures (malformed AI output) and transient API errors."""
        try:
            response = await llm.ainvoke(full_prompt)
            content = _extract_json(response.content)
            data = json.loads(content)
            return DSAPracticeResponse(**data)
        except json.JSONDecodeError as e:
            logger.error(f"DSA agent: failed to parse Gemini JSON: {e}")
            raise AgentProcessingError(f"Invalid JSON from Gemini: {e}")
        except ValidationError as e:
            logger.error(f"DSA agent: Gemini JSON failed schema validation: {e}")
            raise AgentProcessingError(f"Schema validation failed: {e}")
        except AgentProcessingError:
            raise
        except Exception as e:
            logger.error(f"DSA agent: Gemini call failed: {e}")
            raise AgentProcessingError(f"Gemini call failed: {e}")

dsa_agent = DSAPracticeAgent()
