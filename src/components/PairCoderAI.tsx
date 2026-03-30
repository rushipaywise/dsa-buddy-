"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import {
  type AIResponse,
  getDSAGuidance,
  getRuntimeApiKeys,
  setRuntimeApiKeys,
  hasConfiguredLiveProvider,
  testLiveProviderConnection,
} from "../services/geminiService";
import {
  Brain,
  FileEdit,
  BookOpen,
  TrendingUp,
  Sparkles,
  User,
  Settings,
  Send,
  X,
  Square,
  Circle,
  ArrowRight,
  Type,
  Trash2,
  Undo,
} from "lucide-react";
import { Streamdown } from "streamdown";

const BLIND75 = [
  {
    cat: "Arrays & Hashing",
    color: "#7c6fcd",
    problems: [
      { id: 1, name: "Two Sum", diff: "Easy", slug: "two-sum" },
      {
        id: 2,
        name: "Contains Duplicate",
        diff: "Easy",
        slug: "contains-duplicate",
      },
      { id: 3, name: "Valid Anagram", diff: "Easy", slug: "valid-anagram" },
      { id: 4, name: "Group Anagrams", diff: "Medium", slug: "group-anagrams" },
      {
        id: 5,
        name: "Top K Frequent Elements",
        diff: "Medium",
        slug: "top-k-frequent-elements",
      },
      {
        id: 6,
        name: "Product of Array Except Self",
        diff: "Medium",
        slug: "product-of-array-except-self",
      },
      {
        id: 7,
        name: "Longest Consecutive Sequence",
        diff: "Medium",
        slug: "longest-consecutive-sequence",
      },
    ],
  },
  {
    cat: "Two Pointers",
    color: "#14b8a6",
    problems: [
      {
        id: 8,
        name: "Valid Palindrome",
        diff: "Easy",
        slug: "valid-palindrome",
      },
      { id: 9, name: "3Sum", diff: "Medium", slug: "3sum" },
      {
        id: 10,
        name: "Container With Most Water",
        diff: "Medium",
        slug: "container-with-most-water",
      },
    ],
  },
  {
    cat: "Sliding Window",
    color: "#f59e0b",
    problems: [
      {
        id: 11,
        name: "Best Time to Buy & Sell Stock",
        diff: "Easy",
        slug: "best-time-to-buy-and-sell-stock",
      },
      {
        id: 12,
        name: "Longest Substring Without Repeating",
        diff: "Medium",
        slug: "longest-substring-without-repeating-characters",
      },
    ],
  },
  {
    cat: "Stack",
    color: "#ef4444",
    problems: [
      {
        id: 15,
        name: "Valid Parentheses",
        diff: "Easy",
        slug: "valid-parentheses",
      },
    ],
  },
  {
    cat: "Binary Search",
    color: "#22c55e",
    problems: [
      {
        id: 16,
        name: "Find Minimum in Rotated Sorted Array",
        diff: "Medium",
        slug: "find-minimum-in-rotated-sorted-array",
      },
    ],
  },
  {
    cat: "Linked List",
    color: "#a78bfa",
    problems: [
      {
        id: 18,
        name: "Reverse Linked List",
        diff: "Easy",
        slug: "reverse-linked-list",
      },
      {
        id: 19,
        name: "Merge Two Sorted Lists",
        diff: "Easy",
        slug: "merge-two-sorted-lists",
      },
      {
        id: 20,
        name: "Linked List Cycle",
        diff: "Easy",
        slug: "linked-list-cycle",
      },
    ],
  },
  {
    cat: "Trees",
    color: "#10b981",
    problems: [
      {
        id: 24,
        name: "Invert Binary Tree",
        diff: "Easy",
        slug: "invert-binary-tree",
      },
      {
        id: 25,
        name: "Maximum Depth of Binary Tree",
        diff: "Easy",
        slug: "maximum-depth-of-binary-tree",
      },
    ],
  },
  {
    cat: "1-D Dynamic Programming",
    color: "#ec4899",
    problems: [
      {
        id: 47,
        name: "Climbing Stairs",
        diff: "Easy",
        slug: "climbing-stairs",
      },
      { id: 48, name: "House Robber", diff: "Medium", slug: "house-robber" },
    ],
  },
];

const PROBLEM_DATA: any = {
  "two-sum": {
    desc: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.`,
    starter: {
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n    \n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[] {};\n    }\n}`,
    },
    guide: {
      title: "Two Sum — Hash Map",
      steps: [
        {
          label: "Brute Force",
          explain:
            "The naive O(n²) approach checks every pair. For each i, loop all j > i and check if they sum to target. Too slow for large inputs.",
        },
        {
          label: "Key Insight",
          explain:
            "We want: does target - nums[i] exist in the array? Instead of re-scanning, store what we've seen in a hash map for O(1) lookup.",
        },
        {
          label: "One Pass",
          explain:
            "Iterate once. For each element, check if its complement is already in the map. If yes — done! If no — store current value with its index.",
        },
        {
          label: "Example Trace",
          explain:
            "Array [2,7,11,15], target 9. At index 1, value 7: complement = 9-7 = 2, which is in the map at index 0. Return [0,1].",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one pass. O(n) space — hash map stores at most n elements.",
        },
      ],
    },
  },
  "contains-duplicate": {
    desc: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    starter: {
      python: `class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    // Your code here\n    \n};`,
      java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Your code here\n        return false;\n    }\n}`,
    },
    guide: {
      title: "Contains Duplicate — Hash Set",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Compare every element with every other element using nested loops. Time: O(n²), Space: O(1).",
        },
        {
          label: "Key Insight",
          explain:
            "To check for duplicates faster, we need O(1) lookups. A Hash Set automatically prevents duplicate entries and provides instant lookups.",
        },
        {
          label: "One Pass",
          explain:
            "Iterate through the array. If the number is already in the set, we found a duplicate! Otherwise, add it to the set and continue.",
        },
        {
          label: "Example Trace",
          explain:
            "Array [1,2,3,1]. i=0 (1), add to set. i=1 (2), add to set. i=2 (3), add to set. i=3 (1) -> ALREADY IN SET! Return true.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one pass. O(n) space — storing elements in a hash set.",
        },
      ],
    },
  },
  "valid-anagram": {
    desc: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.`,
    starter: {
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    // Your code here\n    \n};`,
      java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Your code here\n        return false;\n    }\n}`,
    },
    guide: {
      title: "Valid Anagram — Hash Map",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Sort both strings and compare them. Sorting takes O(n log n) time.",
        },
        {
          label: "Key Insight",
          explain:
            "Instead of sorting, just count the occurrences of each character. If both strings have the exact same character counts, they are anagrams.",
        },
        {
          label: "One Pass",
          explain:
            "Use an array of size 26 or a hash map. Increment counts for string s, decrement for string t. Ensure all counts ultimately reach zero.",
        },
        {
          label: "Example Trace",
          explain:
            "s='rat', t='car'. s adds {r:1, a:1, t:1}. t subtracts {c:-1, a:0, r:0}. Since 'c' and 't' remain non-zero, return false.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one or two passes. O(1) space — fixed 26 character array.",
        },
      ],
    },
  },
  "group-anagrams": {
    desc: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.`,
    starter: {
      python: `class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    // Your code here\n    \n};`,
      java: `class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}`,
    },
    guide: {
      title: "Group Anagrams — Hash Map & Keys",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Compare each string against every other string to see if they are anagrams. Time: O(n² * k log k).",
        },
        {
          label: "Key Insight",
          explain:
            "All anagrams share the same 'base format'. Sorting an anagram yields a unique key. E.g., 'eat', 'tea', 'ate' all sort to 'aet'.",
        },
        {
          label: "One Pass",
          explain:
            "Iterate over the array. For each string, compute its key (via sorting or counting characters) and append it to the corresponding list in a Hash Map.",
        },
        {
          label: "Example Trace",
          explain:
            "['eat', 'bat', 'tea']. 'eat' -> key 'aet', map['aet'] = ['eat']. 'bat' -> key 'abt', map['abt'] = ['bat']. 'tea' -> key 'aet', map['aet'] = ['eat', 'tea'].",
        },
        {
          label: "Complexity",
          explain:
            "O(n * k log k) time — sorting strings. O(n * k) space — storing all strings in the map.",
        },
      ],
    },
  },
  "top-k-frequent-elements": {
    desc: `Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.`,
    starter: {
      python: `class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    // Your code here\n    \n};`,
      java: `class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        // Your code here\n        return new int[] {};\n    }\n}`,
    },
    guide: {
      title: "Top K Frequent — Bucket Sort",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Count frequencies, then sort elements by frequency. Sorting takes O(n log n).",
        },
        {
          label: "Key Insight",
          explain:
            "The maximum frequency is bounded. The frequency of any element can't exceed 'n'. We can map frequencies to an array of lists.",
        },
        {
          label: "One Pass",
          explain:
            "Count frequencies first. Then place numbers into 'buckets' where the index equals their frequency. Finally, gather 'k' elements from the end of the buckets backwards.",
        },
        {
          label: "Example Trace",
          explain:
            "[1,1,1,2,2,3], k=2. Freqs: {1:3, 2:2, 3:1}. Buckets: [ [], [3], [2], [1], [], [], [] ]. Reading backward yields 1, then 2.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — counting and bucket placement. O(n) space — storing frequencies and buckets.",
        },
      ],
    },
  },
  "product-of-array-except-self": {
    desc: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].`,
    guide: {
      title: "Product Except Self — Prefix & Suffix",
      steps: [
        {
          label: "Brute Force",
          explain:
            "For each element, iterate through the whole array and multiply all other elements. O(n²) time.",
        },
        {
          label: "Key Insight",
          explain:
            "The product except self at index i is the product of all elements to its left multiplied by all elements to its right. We can precompute these side products.",
        },
        {
          label: "One Pass",
          explain:
            "First pass: Build the left product array. Second pass: Compute the right product on the fly while multiplying it by the left product array.",
        },
        {
          label: "Example Trace",
          explain:
            "[1,2,3,4]. Left pass gives [1, 1, 2, 6]. Right pass starts at end with suffix=1. result[3]=6*1=6. suffix=4. result[2]=2*4=8... Final [24,12,8,6].",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — two passes over the array. O(1) space auxiliary — the result array doesn't count towards space complexity.",
        },
      ],
    },
  },
  "longest-consecutive-sequence": {
    desc: `Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.`,
    guide: {
      title: "Longest Consecutive Sequence — Set Operations",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Sort the array and count consecutive numbers. Sorting takes O(n log n). The problem requires O(n) time!",
        },
        {
          label: "Key Insight",
          explain:
            "We only care about building sequences. If we can jump directly to the Start of a Sequence (a number 'x' where 'x-1' does not exist), we can just count upwards from there.",
        },
        {
          label: "One Pass",
          explain:
            "Store all numbers in a HashSet. Iterate over the set. If current 'n' does not have 'n-1' in the set, it's the start of a sequence. Keep checking for 'n+1', 'n+2', incrementing length.",
        },
        {
          label: "Example Trace",
          explain:
            "[100,4,200,1,3,2]. Set created. Look at 100: no 99, start sequence. Next is 101? No. Length=1. Look at 1: no 0. Check 2, 3, 4. Length=4. Return 4.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — HashSet lookups are O(1) and each element is visited at most twice. O(n) space — storing all elements in a set.",
        },
      ],
    },
  },
  "linked-list-cycle": {
    desc: `Given the head of a linked list, return true if the list has a cycle in it, otherwise return false.`,
    starter: {
      python: `class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        # Your code here\n        pass`,
      javascript: `/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar hasCycle = function(head) {\n    // Your code here\n    \n};`,
      java: `public class Solution {\n    public boolean hasCycle(ListNode head) {\n        // Your code here\n        return false;\n    }\n}`,
    },
    guide: {
      title: "Linked List Cycle — Floyd's",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Keep a HashSet of visited nodes. If you ever hit a node you've already seen, return true. O(n) space overhead.",
        },
        {
          label: "Key Insight",
          explain:
            "Think of a circular track. If two runners are on the track, and one runs twice as fast, the faster runner will eventually lap the slower runner.",
        },
        {
          label: "One Pass",
          explain:
            "Use Slow & Fast pointers. Slow moves 1 step, Fast moves 2 steps. If Fast hits null, there's no cycle. If Slow == Fast, there is a cycle.",
        },
        {
          label: "Example Trace",
          explain:
            "List 1->2->3->4 where 4 points back to 2. S=1, F=1. S=2, F=3. S=3, F=2. S=4, F=4. They met! Cycle exists.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — pointers traverse at most 2n nodes before meeting. O(1) space — only two pointer variables.",
        },
      ],
    },
  },
  "valid-palindrome": {
    desc: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.`,
    guide: {
      title: "Valid Palindrome — Two Pointers",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Filter the string, create a reversed copy, and compare them. Takes O(n) time but requires O(n) extra space for the new strings.",
        },
        {
          label: "Key Insight",
          explain:
            "A palindrome is symmetric. The first character must match the last, the second matches the second-to-last, etc.",
        },
        {
          label: "One Pass",
          explain:
            "Use two pointers, one at the start and one at the end. Move both inwards, skipping non-alphanumeric characters. If they ever differ, return false.",
        },
        {
          label: "Example Trace",
          explain:
            "'race car' -> L at 'r', R at 'r' -> Match. L at 'a', R at 'a' -> Match. Skip space -> L at 'c', R at 'c'. Match. L >= R, done.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one pass over the string. O(1) space — only two integer pointers used.",
        },
      ],
    },
  },
  "3sum": {
    desc: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.`,
    guide: {
      title: "3Sum — Sort & Two Pointers",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Three nested loops to check every possible triplet. Time complexity: O(n³).",
        },
        {
          label: "Key Insight",
          explain:
            "If we sort the array, we can lock one number and treat the remaining problem as 'Two Sum II' targeting the inverse of the locked number (-nums[i]).",
        },
        {
          label: "One Pass",
          explain:
            "Sort first. Iterate 'i' through the array. For each 'i', use Left and Right pointers on the remaining subarray to find pairs that sum to -nums[i]. Skip duplicates to avoid duplicate triplets.",
        },
        {
          label: "Example Trace",
          explain:
            "[-1,0,1,2,-1,-4] -> sort -> [-4,-1,-1,0,1,2]. i=0 (val -4): target 4. L=-1, R=2. Sum 1 < 4, L++. No triplet. i=1 (val -1): target 1. L=-1, R=2. Sum 1 == 1. Found [-1,-1,2].",
        },
        {
          label: "Complexity",
          explain:
            "O(n²) time — O(n log n) to sort, then O(n) 'Two Sum' for each of the 'n' elements. O(1) space (ignoring sorting/output overhead).",
        },
      ],
    },
  },
  "container-with-most-water": {
    desc: `You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water.`,
    guide: {
      title: "Container With Most Water — Greedy Two Pointers",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Check every pair of vertical lines to find the maximum enclosed area. O(n²) time.",
        },
        {
          label: "Key Insight",
          explain:
            "The area is constrained by the SHORTER line. If we start with the widest possible container (Left at 0, Right at end), the only way to get a larger area is to find a taller line.",
        },
        {
          label: "One Pass",
          explain:
            "Place pointers at ends. Calculate area. To potentially increase area, move the pointer that has the SHORTER height inward. Keep tracking the maximum seen.",
        },
        {
          label: "Example Trace",
          explain:
            "[1,8,6,2,5,4,8,3,7]. L=0(1), R=8(7). Area = 1 * 8 = 8. Move L because 1 < 7. L=1(8), R=8(7). Area = 7 * 7 = 49. Move R. L=1(8), R=7(3)...",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — single pass from both ends inwards. O(1) space — only two tracking variables.",
        },
      ],
    },
  },
  "best-time-to-buy-and-sell-stock": {
    desc: `You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.`,
    guide: {
      title: "Buy & Sell Stock — Sliding Window Tracker",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Compare every 'buy' day with every subsequent 'sell' day. O(n²) time complexity.",
        },
        {
          label: "Key Insight",
          explain:
            "To maximize profit, you always want to subtract the LOWEST historical price seen so far from the CURRENT price.",
        },
        {
          label: "One Pass",
          explain:
            "Keep a running variable 'minPrice'. Iterate through prices: if current price < minPrice, update it. Else, check if current price - minPrice > maxProfit. Update maxProfit.",
        },
        {
          label: "Example Trace",
          explain:
            "[7,1,5,3,6,4]. Day1: min=7. Day2: min=1. Day3: 5. Profit=5-1=4. Day4: 3. Profit=2. Day5: 6. Profit=6-1=5! (Max updated). Return 5.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — iterate over prices exactly once. O(1) space — only integer variables used.",
        },
      ],
    },
  },
  "longest-substring-without-repeating-characters": {
    desc: `Given a string s, find the length of the longest substring without repeating characters.`,
    guide: {
      title: "Longest Substring — Sliding Window Set",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Generate all possible substrings and check them for duplicates. O(n³) time.",
        },
        {
          label: "Key Insight",
          explain:
            "If a substring has no duplicates, expanding it one character to the right might introduce a duplicate. If it does, we just shrink from the left until the duplicate is removed!",
        },
        {
          label: "One Pass",
          explain:
            "Use a Left and Right pointer to represent a window. Add Right char to a Set. If it's already in the set, remove Left chars and increment Left until the duplicate is gone. Update max length.",
        },
        {
          label: "Example Trace",
          explain:
            "'abcabcbb'. R=0(a). Set={a}, max=1. R=1(b). Set={a,b}, max=2. R=2(c). Set={a,b,c}, max=3. R=3(a). 'a' in Set! Remove L=0(a). Now Set={b,c,a}, max=3...",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — each character is added/removed from the sliding window at most once. O(min(n, m)) space where m is the charset size.",
        },
      ],
    },
  },
  "valid-parentheses": {
    desc: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
    guide: {
      title: "Valid Parentheses — Stack",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Repeatedly replace '()', '{}', '[]' with empty strings until string is empty or no changes happen. O(n²) time.",
        },
        {
          label: "Key Insight",
          explain:
            "The MOST RECENTLY opened bracket must be the FIRST one successfully closed. This perfectly maps to LIFO (Last-In-First-Out) logic.",
        },
        {
          label: "One Pass",
          explain:
            "Iterate over string. If opening bracket, push to a Stack. If closing bracket, check if it matches the 'top' of the stack. If match, pop it. If mismatch or stack empty, invalid!",
        },
        {
          label: "Example Trace",
          explain:
            "'{[]}'. S=[ '{' ]. Next is '[' -> S=[ '{', '[' ]. Next is ']' -> Matches top '[' so pop it. S=[ '{' ]. Next is '}' -> Matches top '{' so pop. Stack empty! Valid.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one pass string iteration. O(n) space — stack might store all characters if they are all opening brackets.",
        },
      ],
    },
  },
  "find-minimum-in-rotated-sorted-array": {
    desc: `Find the minimum element in an array that was sorted in ascending order and then rotated an unknown number of times.`,
    guide: {
      title: "Find Minimum — Modified Binary Search",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Linear scan the array to find the smallest number. O(n) time. The problem explicitly demands O(log n) time.",
        },
        {
          label: "Key Insight",
          explain:
            "Because the array is rotated, it is split into TWO sorted halves. The minimum element is the FIRST element of the Right sorted half. We can use Binary Search!",
        },
        {
          label: "One Pass",
          explain:
            "L=0, R=end. Find mid. If nums[mid] > nums[R], the minimum is strictly to the right. Else, the mid itself might be the minimum or it's to the left (R = mid).",
        },
        {
          label: "Example Trace",
          explain:
            "[4,5,6,7,0,1,2]. mid=7. 7 > 2, so minimum is in right half. L=mid+1(0). Array left: [0,1,2]. mid=1. 1 < 2, so R=mid. Array left: [0,1]. mid=0. 0 < 1, R=0. Found 0!",
        },
        {
          label: "Complexity",
          explain:
            "O(log n) time — array size halves each step. O(1) space — only pointer variables.",
        },
      ],
    },
  },
  "reverse-linked-list": {
    desc: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    guide: {
      title: "Reverse List — Iterative Pointers",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Extract all values into an array, reverse the array, and build a completely new linked list. O(n) memory.",
        },
        {
          label: "Key Insight",
          explain:
            "You only need to flip the direction of the 'next' pointers in-place! No new nodes required.",
        },
        {
          label: "One Pass",
          explain:
            "Keep three pointers: 'prev' (null initially), 'curr' (head), and 'next' (temp). Cache 'curr.next', set 'curr.next' to 'prev', then shift both 'prev' and 'curr' forward.",
        },
        {
          label: "Example Trace",
          explain:
            "1 -> 2 -> 3. Curr=1, Prev=null. Cache 2. Set 1.next = null. Prev=1, Curr=2. Cache 3. Set 2.next = 1. Prev=2, Curr=3. Set 3.next = 2... Done.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — one pass over the linked list. O(1) space — completely in-place pointer manipulation.",
        },
      ],
    },
  },
  "merge-two-sorted-lists": {
    desc: `You are given the heads of two sorted linked lists. Merge the two lists into one sorted list.`,
    guide: {
      title: "Merge Sorted Lists — Dummy Node",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Put all list elements into an array, sort it, and rebuild a new list. O(n log n) time.",
        },
        {
          label: "Key Insight",
          explain:
            "Both lists are ALREADY sorted. At any point, the very next smallest element MUST be at the head of either list A or list B.",
        },
        {
          label: "One Pass",
          explain:
            "Create a 'Dummy' node to handle the edge case of an empty start. Compare A and B heads. Attach the smaller one to Dummy.next, and advance that list's pointer.",
        },
        {
          label: "Example Trace",
          explain:
            "A: 1->2->4, B: 1->3->4. Dummy. Compare 1 and 1 -> A. T.next=1(A). A=A.next. Compare 2 and 1 -> B. T.next=1(B)... until one list is exhausted. Attach remainder.",
        },
        {
          label: "Complexity",
          explain:
            "O(n + m) time — single pass through both lists simultaneously. O(1) space — just relinking existing list nodes.",
        },
      ],
    },
  },
  "invert-binary-tree": {
    desc: `Given the root of a binary tree, invert the tree, and return its root.`,
    guide: {
      title: "Invert Binary Tree — Recursive Swap",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Traverse the tree and rebuild an entirely new tree with left/right swapped. O(n) space overhead.",
        },
        {
          label: "Key Insight",
          explain:
            "Inverting a tree just means taking a Node, and swapping its exact Left and Right children. If we do this for EVERY node, the whole tree is inverted.",
        },
        {
          label: "One Pass",
          explain:
            "Write a recursive function. Base case: if root is null, return. Swap root.left with root.right. Recursively call the function on both children.",
        },
        {
          label: "Example Trace",
          explain:
            "Root 4: L is 2, R is 7. Swap them! Now L is 7, R is 2. Step into 7: L is 6, R is 9. Swap them! Step into 2: L is 1, R is 3. Swap them! Done.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — visit every node exactly once. O(h) space where h is the tree height (due to recursive call stack memory).",
        },
      ],
    },
  },
  "maximum-depth-of-binary-tree": {
    desc: `Given the root of a binary tree, return its maximum depth.`,
    guide: {
      title: "Max Depth — DFS / Recursion",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Manually explore every single leaf node path and keep a global maximum. Valid, but code structure can be messy.",
        },
        {
          label: "Key Insight",
          explain:
            "The maximum depth of any tree is exactly 1 (for the root) plus the MAXIMUM of the depths of its left and right subtrees!",
        },
        {
          label: "One Pass",
          explain:
            "If node is null, depth is 0. Otherwise, recursively get depth of Left child, recursively get depth of Right child. Return 1 + Math.max(left, right).",
        },
        {
          label: "Example Trace",
          explain:
            "Root 3: Left is 9 (leaf, depth 1). Right is 20, which has leaves 15, 7. Depth of 20 = 1+max(1,1) = 2. Root 3 depth = 1+max(1, 2) = 3.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — must visit every node to ensure we haven't missed a deeper branch. O(h) space — call stack size equals the height of the tree.",
        },
      ],
    },
  },
  "climbing-stairs": {
    desc: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. How many distinct ways can you climb to the top?`,
    guide: {
      title: "Climbing Stairs — Fibonacci DP",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Recurse out every possibility: climb(n-1) + climb(n-2). This creates a massive branching tree resulting in O(2^n) time limit exceeded.",
        },
        {
          label: "Key Insight",
          explain:
            "To get to step N, you MUST have either jumped from step N-1 or step N-2. Thus, Ways(N) = Ways(N-1) + Ways(N-2). This is exactly the Fibonacci sequence.",
        },
        {
          label: "One Pass",
          explain:
            "Instead of recursion, cache the results bottom-up. Keep two variables: 'oneStepBack' and 'twoStepsBack'. Iterate through N, updating them dynamically.",
        },
        {
          label: "Example Trace",
          explain:
            "N=5. Base: step1=1, step2=2. Step3 = 1+2=3. Step4 = 2+3=5. Step5 = 3+5=8. We just shift the two tracking variables forward at each step!",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — single loop iterating to N. O(1) space — only track the last two results, not an entire array.",
        },
      ],
    },
  },
  "house-robber": {
    desc: `You are a professional robber. Each house has a certain amount of money. The only constraint is that adjacent houses have security systems. Return max money.`,
    guide: {
      title: "House Robber — Dynamic Programming",
      steps: [
        {
          label: "Brute Force",
          explain:
            "Try every combination of houses, making sure none are adjacent. Enormous exponential branching factor.",
        },
        {
          label: "Key Insight",
          explain:
            "At any house 'i', you have a binary choice: Rob it (meaning you add its value to the max loot from house 'i-2') OR Skip it (meaning you keep the max loot from house 'i-1').",
        },
        {
          label: "One Pass",
          explain:
            "Iterate through the houses maintaining two variables: 'rob1' (max at i-2) and 'rob2' (max at i-1). For each, compute current max = max(rob1 + current_value, rob2). shift variables.",
        },
        {
          label: "Example Trace",
          explain:
            "[2,7,9,3,1]. i=0 (2): max=2. i=1 (7): max=max(2, 7)=7. i=2 (9): max=max(2+9, 7)=11. i=3 (3): max=max(7+3, 11)=11. i=4 (1): max=max(11+1, 11)=12.",
        },
        {
          label: "Complexity",
          explain:
            "O(n) time — iterate over the array exactly once. O(1) space — track only two integer variables instead of a full DP array.",
        },
      ],
    },
  },
};

const DEFAULT_GUIDE = {
  title: "Problem Solving",
  steps: [
    {
      label: "Brute Force",
      explain:
        "First, state the naive approach out loud. Understanding the brute force uncovers bottlenecks in time and space complexity.",
    },
    {
      label: "Key Insight",
      explain:
        "Identify the bottleneck and consider which Data Structures or Algorithms can eliminate redundant work (e.g. Hash Map for O(1) lookups).",
    },
    {
      label: "One Pass",
      explain:
        "Design an optimized algorithm. Often, this requires iterating over the data exactly once (or linearly), making decisions on the fly.",
    },
    {
      label: "Example Trace",
      explain:
        "Dry run your approach on a small sample input before writing any code. Check edge cases like empty arrays or strange constraints.",
    },
    {
      label: "Complexity",
      explain:
        "Confirm your Time and Space complexities. Ensure they satisfy the optimal bounds intended for the problem before proceeding to code.",
    },
  ],
};

const EDITOR_PREFS_KEY = "dsa-buddy-editor-prefs";

const DEFAULT_EDITOR_PREFS = {
  autoCloseBrackets: true,
  autocomplete: true,
  docsTooltips: true,
  fontSize: "large",
  darkMode: true,
  highContrastMode: false,
  showWhitespace: false,
  wordWrap: true,
};

const FONT_SIZE_MAP: Record<string, number> = {
  small: 12,
  medium: 13,
  large: 15,
};

const MEDIUM_BREAKPOINT = 1200;
const COMPACT_BREAKPOINT = 960;
const MIN_LEFT_PANEL_WIDTH = 220;
const MAX_LEFT_PANEL_WIDTH = 360;
const MIN_RIGHT_PANEL_WIDTH = 300;
const MAX_RIGHT_PANEL_WIDTH = 460;

const MemoCodeEditor = React.memo(function MemoCodeEditor({
  initialValue,
  darkMode,
  extensions,
  autocomplete,
  autoCloseBrackets,
  showWhitespace,
  fontSize,
  onDocChange,
  onRun,
}: {
  initialValue: string;
  darkMode: boolean;
  extensions: any[];
  autocomplete: boolean;
  autoCloseBrackets: boolean;
  showWhitespace: boolean;
  fontSize: number;
  onDocChange: (value: string) => void;
  onRun: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "block",
        height: "100%",
      }}
      onKeyDownCapture={onRun}
    >
      <CodeMirror
        value={initialValue}
        height="100%"
        theme={darkMode ? vscodeDark : undefined}
        extensions={extensions}
        basicSetup={{
          autocompletion: autocomplete,
          closeBrackets: autoCloseBrackets,
          highlightSpecialChars: showWhitespace,
        }}
        onUpdate={(viewUpdate: ViewUpdate) => {
          if (viewUpdate.docChanged) {
            onDocChange(viewUpdate.state.doc.toString());
          }
        }}
        style={{
          fontSize,
          height: "100%",
        }}
      />
    </div>
  );
});

export default function PairCoderAI() {
  const [problems] = useState(BLIND75);
  const [currentProb, setCurrentProb] = useState(BLIND75[0].problems[0]);
  const [currentCat, setCurrentCat] = useState(BLIND75[0]);
  const [editorCode, setEditorCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [editorTab, setEditorTab] = useState("code");
  const [solved, setSolved] = useState(new Set());
  const [search, setSearch] = useState("");
  const [aiTab, setAiTab] = useState("visual");
  const [currentStep, setCurrentStep] = useState(0);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);

  // API Keys state
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [mistralKeyInput, setMistralKeyInput] = useState("");
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState("");
  const [hasLiveAIProvider, setHasLiveAIProvider] = useState(
    hasConfiguredLiveProvider(),
  );
  const [apiTestMessage, setApiTestMessage] = useState("");
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [aiGuide, setAiGuide] = useState<{
    steps: { label: string; explain: string }[];
  } | null>(null);
  const [visualType, setVisualType] = useState<string>("array");
  const [visualData, setVisualData] = useState<any>(null);
  const [coachFeedback, setCoachFeedback] = useState("");
  const [coachState, setCoachState] = useState<AIResponse | null>(null);
  const [editorPrefs, setEditorPrefs] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_EDITOR_PREFS;
    try {
      const saved = window.localStorage.getItem(EDITOR_PREFS_KEY);
      return saved
        ? { ...DEFAULT_EDITOR_PREFS, ...JSON.parse(saved) }
        : DEFAULT_EDITOR_PREFS;
    } catch {
      return DEFAULT_EDITOR_PREFS;
    }
  });
  const [runnerStdin, setRunnerStdin] = useState("");
  const [runnerStdout, setRunnerStdout] = useState(
    "Output will appear here after you run the code.",
  );
  const [runnerStatus, setRunnerStatus] = useState<
    "idle" | "running" | "success" | "error" | "unsupported"
  >("idle");
  const [runnerMeta, setRunnerMeta] = useState("Press Cmd+Enter or Ctrl+Enter to run.");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [aiPanelWidth, setAiPanelWidth] = useState(380);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth > MEDIUM_BREAKPOINT,
  );
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth > COMPACT_BREAKPOINT,
  );
  const [activeDrag, setActiveDrag] = useState<null | "sidebar" | "ai">(null);
  const breakpointStateRef = useRef({
    medium:
      typeof window === "undefined" ? false : window.innerWidth <= MEDIUM_BREAKPOINT,
    compact:
      typeof window === "undefined" ? false : window.innerWidth <= COMPACT_BREAKPOINT,
  });

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("dsa-custom-questions");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    name: "",
    slug: "",
    desc: "",
    difficulty: "Easy",
  });

  const codeRef = useRef<string>("");
  const liveCoachRequestRef = useRef(0);
  const skipNextLiveCoachRef = useRef(true);

  const handleEditorChange = useCallback((value: string) => {
    setEditorCode(value);
    codeRef.current = value;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(EDITOR_PREFS_KEY, JSON.stringify(editorPrefs));
  }, [editorPrefs]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMediumViewport = viewportWidth <= MEDIUM_BREAKPOINT;
  const isCompactViewport = viewportWidth <= COMPACT_BREAKPOINT;

  useEffect(() => {
    const previous = breakpointStateRef.current;

    if (isMediumViewport !== previous.medium) {
      setIsSidebarOpen(!isMediumViewport);
    }

    if (isCompactViewport !== previous.compact) {
      setIsAiPanelOpen(!isCompactViewport);
    }

    breakpointStateRef.current = {
      medium: isMediumViewport,
      compact: isCompactViewport,
    };
  }, [isMediumViewport, isCompactViewport]);

  useEffect(() => {
    if (!activeDrag || typeof window === "undefined") return undefined;

    const handleMouseMove = (event: MouseEvent) => {
      if (activeDrag === "sidebar") {
        const nextWidth = Math.min(
          MAX_LEFT_PANEL_WIDTH,
          Math.max(MIN_LEFT_PANEL_WIDTH, event.clientX),
        );
        setSidebarWidth(nextWidth);
        return;
      }

      const nextWidth = Math.min(
        MAX_RIGHT_PANEL_WIDTH,
        Math.max(MIN_RIGHT_PANEL_WIDTH, window.innerWidth - event.clientX),
      );
      setAiPanelWidth(nextWidth);
    };

    const stopDragging = () => setActiveDrag(null);
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [activeDrag]);

  const editorExtensions = useMemo(() => {
    // 15 lines x approx 20px = 300px scroll margin
    const scrollPadding = EditorView.scrollMargins.of(() => ({
      top: 15 * 20,
      bottom: 15 * 20,
    }));

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: editorPrefs.darkMode ? "#0f1117" : "#f8fafc",
          color: editorPrefs.darkMode ? "#e2e8f0" : "#0f172a",
        },
        ".cm-scroller": {
          fontFamily: "'JetBrains Mono', monospace",
        },
        ".cm-cursor": {
          borderLeft: "2px solid transparent !important",
          borderBottom: "none !important",
          width: "0 !important",
          position: "relative",
        },
        ".cm-cursor::after": {
          content: '""',
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "0.55em",
          borderBottom: `2.5px solid ${
            editorPrefs.highContrastMode ? "#facc15" : "#a78bfa"
          }`,
          pointerEvents: "none",
        },
        ".cm-content": {
          caretColor: editorPrefs.highContrastMode ? "#facc15" : "#a78bfa",
        },
        ".cm-activeLine": {
          backgroundColor: editorPrefs.darkMode
            ? editorPrefs.highContrastMode
              ? "#172033"
              : "#161b27"
            : "#e2e8f0",
        },
        ".cm-gutters": {
          backgroundColor: editorPrefs.darkMode ? "#111827" : "#f1f5f9",
          color: editorPrefs.darkMode ? "#64748b" : "#64748b",
          borderRight: `1px solid ${
            editorPrefs.highContrastMode ? "#facc15" : "#2a3348"
          }`,
        },
      },
      { dark: editorPrefs.darkMode },
    );

    const exts = [scrollPadding, customTheme];
    if (editorPrefs.wordWrap) exts.push(EditorView.lineWrapping);
    if (language === "python") exts.push(python());
    if (language === "javascript") exts.push(javascript());
    if (language === "java") exts.push(java());
    return exts;
  }, [editorPrefs, language]);

  const guide =
    aiGuide || PROBLEM_DATA[currentProb.slug]?.guide || DEFAULT_GUIDE;
  const guideTitleParts = (guide.title || "")
    .split("—")
    .map((part) => part.trim())
    .filter(Boolean);
  const fallbackPatternName =
    guideTitleParts[1] || guideTitleParts[0] || "Problem-solving pattern";
  const coachPattern = coachState?.patternInfo || null;
  const coachLearningGuide = coachState?.learningGuide || null;
  const coachHints = (coachState?.hints || []).filter(Boolean);
  const coachStageLabel = coachState?.stage
    ? coachState.stage.charAt(0).toUpperCase() + coachState.stage.slice(1)
    : "Thinking";
  const coachOverview =
    coachFeedback ||
    coachState?.feedback ||
    guide.steps[0]?.explain ||
    DEFAULT_GUIDE.steps[0].explain;
  const coachInvariant =
    coachLearningGuide?.invariant ||
    "Preserve the invariant and only store the state needed for the next move.";
  const coachNextStep =
    coachLearningGuide?.nextStep ||
    coachHints[0] ||
    guide.steps[1]?.explain ||
    coachOverview;
  const coachCheckpoints =
    coachLearningGuide?.checkpoints?.filter(Boolean) || coachHints.slice(0, 3);
  const coachProviderLabel =
    coachState?.providerStatus === "live"
      ? "Live AI Coach"
      : coachState?.providerStatus === "fallback" || coachState?.provider === "local"
        ? "Local Coach"
        : hasLiveAIProvider
          ? "Live AI Coach"
          : "Local Coach";

  const filteredProblems = useMemo(
    () =>
      problems
        .map((cat) => ({
          ...cat,
          problems: cat.problems.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.problems.length > 0),
    [problems, search],
  );

  const diffColor =
    currentProb.diff === "Easy"
      ? "#22c55e"
      : currentProb.diff === "Medium"
        ? "#f59e0b"
        : "#ef4444";

  const buildAsciiSnapshot = () => {
    const patternLabel = coachPattern?.name || fallbackPatternName;
    const lines = [
      `Problem: ${currentProb.name}`,
      `Pattern: ${patternLabel}`,
      `Stage: ${coachStageLabel}`,
      "",
    ];
    const data = visualData || {};

    if (visualType === "array" && Array.isArray(data.items) && data.items.length > 0) {
      const indexes = data.items
        .map((_: any, i: number) => String(i).padStart(2, " "))
        .join(" ");
      const values = data.items
        .map((value: any) => String(value).padStart(2, " "))
        .join(" ");
      lines.push(`idx: ${indexes}`);
      lines.push(`arr: ${values}`);
      if (typeof data.activeIndex === "number") {
        lines.push(`cur: ${"   ".repeat(Math.max(0, data.activeIndex))}^^ index ${data.activeIndex}`);
      }
      if (typeof data.target !== "undefined") lines.push(`target: ${data.target}`);
      if (typeof data.complement !== "undefined") lines.push(`need: ${data.complement}`);
      return lines.join("\n");
    }

    if (visualType === "hashmap" && data.map && typeof data.map === "object") {
      lines.push("map:");
      Object.entries(data.map)
        .slice(0, 8)
        .forEach(([key, value]) => lines.push(`  ${key} -> ${value}`));
      return lines.join("\n");
    }

    if (visualType === "set" && Array.isArray(data.seen)) {
      lines.push(`seen: { ${data.seen.join(", ")} }`);
      if (typeof data.activeIndex === "number") lines.push(`active index: ${data.activeIndex}`);
      return lines.join("\n");
    }

    if (visualType === "sequence" && Array.isArray(data.activeSequence)) {
      lines.push(`sequence: ${data.activeSequence.join(" -> ")}`);
      if (data.trace?.currentLength) lines.push(`length: ${data.trace.currentLength}`);
      return lines.join("\n");
    }

    if (visualType === "constraints") {
      const constraints = Array.isArray(data.constraints) ? data.constraints : [];
      const edgeCases = Array.isArray(data.edgeCases) ? data.edgeCases : [];
      lines.push("constraints:");
      constraints.slice(0, 4).forEach((item: string) => lines.push(`  - ${item}`));
      if (edgeCases.length > 0) {
        lines.push("", "edge cases:");
        edgeCases.slice(0, 4).forEach((item: string) => lines.push(`  - ${item}`));
      }
      return lines.join("\n");
    }

    if (data.trace && typeof data.trace === "object") {
      lines.push("trace:");
      Object.entries(data.trace)
        .slice(0, 6)
        .forEach(([key, value]) => lines.push(`  ${key}: ${String(value)}`));
      return lines.join("\n");
    }

    lines.push("code -> think -> simplify");
    lines.push("watch the invariant");
    lines.push("store only what the next step needs");
    return lines.join("\n");
  };

  const normalizeCoachMarkdown = (text: string = "") =>
    text
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<code>(.*?)<\/code>/g, "`$1`")
      .replace(/\r\n/g, "\n");

  const updateEditorPref = (key: string, value: any) => {
    setEditorPrefs((prev: any) => ({ ...prev, [key]: value }));
  };

  const formatRunnerValue = (value: any): string => {
    if (typeof value === "string") return value;
    if (typeof value === "undefined") return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const runJavaScriptLocally = (source: string, stdin: string) => {
    const logs: string[] = [];
    const startTime = performance.now();
    const startMemory =
      typeof performance !== "undefined" &&
      "memory" in performance &&
      (performance as any).memory?.usedJSHeapSize
        ? Number((performance as any).memory.usedJSHeapSize)
        : null;

    const consoleProxy = {
      ...console,
      log: (...args: any[]) => logs.push(args.map(formatRunnerValue).join(" ")),
      error: (...args: any[]) =>
        logs.push(`ERROR: ${args.map(formatRunnerValue).join(" ")}`),
      warn: (...args: any[]) =>
        logs.push(`WARN: ${args.map(formatRunnerValue).join(" ")}`),
    };

    const executor = new Function(
      "stdin",
      "console",
      `
        "use strict";
        let __result;
        ${source}
        if (typeof solve === "function") __result = solve(stdin);
        else if (typeof main === "function") __result = main(stdin);
        else if (typeof solution === "function") __result = solution(stdin);
        return __result;
      `,
    );

    const result = executor(stdin, consoleProxy);
    if (typeof result !== "undefined") {
      logs.push(formatRunnerValue(result));
    }

    const endTime = performance.now();
    const endMemory =
      typeof performance !== "undefined" &&
      "memory" in performance &&
      (performance as any).memory?.usedJSHeapSize
        ? Number((performance as any).memory.usedJSHeapSize)
        : null;

    const runtimeMs = Math.max(1, Math.round(endTime - startTime));
    const memoryLabel =
      startMemory !== null && endMemory !== null
        ? `${Math.max(endMemory, startMemory) / (1024 * 1024)}`.slice(0, 4) + " MB"
        : "n/a";

    return {
      stdout:
        logs.join("\n").trim() || "Program finished successfully with no stdout.",
      meta: `${runtimeMs} ms | ${memoryLabel}`,
    };
  };

  const runCodeWithBackend = async (source: string, stdin: string) => {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        source,
        stdin,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.stderr || payload.error || "Execution failed.");
    }

    return payload as {
      ok: boolean;
      stdout: string;
      stderr: string;
      meta: string;
    };
  };

  const getStarterCode = (slug: string, lang: string, probName: string) => {
    const problem = PROBLEM_DATA[slug];
    if (problem?.starter?.[lang]) {
      return problem.starter[lang];
    }
    // Default templates for each language
    if (lang === "python")
      return `# ${probName}\n# Your code here\nclass Solution:\n    def solve(self):\n        pass`;
    if (lang === "javascript")
      return `// ${probName}\n// Your code here\nfunction solve() {\n    \n}`;
    return `// ${probName}\n// Your code here\nclass Solution {\n    \n}`;
  };

  // Helper: map AI response to guide/visuals
  const applyGuidanceResult = (result: any, fullProblemData: any) => {
    if (!result) return;

    setCoachState(result);

    // Update visuals if present
    const visType = result.visualType ?? result.visualizationData?.visualType;
    const visData = result.visualData ?? result.visualizationData?.visualData;
    setCoachFeedback(result.feedback?.trim?.() || "");
    if (visType) setVisualType(visType);
    if (visData) setVisualData(visData);
    if (result.stage) {
      const stageIndex = {
        understanding: 0,
        reasoning: 1,
        coding: 2,
        review: 4,
      }[result.stage];
      if (typeof stageIndex === "number") {
        const maxIndex = Math.max(
          0,
          ((fullProblemData?.guide?.steps?.length || guide.steps.length) as number) - 1,
        );
        setCurrentStep(Math.min(stageIndex, maxIndex));
      }
    }

    if (fullProblemData?.guide) {
      setAiGuide(fullProblemData.guide);
    } else {
      setAiGuide(DEFAULT_GUIDE);
    }
  };

  // Function to get AI-generated guide (on load)
  const fetchAIGuide = React.useCallback(
    async (slug: string) => {
      const fullProblemData = PROBLEM_DATA[slug];
      if (!fullProblemData) return;

      const problemData = {
        title: currentProb.name,
        description: fullProblemData.desc,
        difficulty: currentProb.diff,
        guide: fullProblemData.guide,
        constraints: fullProblemData.constraints || [],
        edgeCases: fullProblemData.edgeCases || [],
        sampleData: fullProblemData.sampleData || {},
      };

      setAiGuide(null);

      try {
        const result = await getDSAGuidance(
          problemData,
          "",
          "get-guide",
          "understanding",
          [],
          {},
          false,
        );
        applyGuidanceResult(result, fullProblemData);
      } catch (err) {
        console.error("❌ Error in fetchAIGuide:", err);
        if (fullProblemData?.guide) setAiGuide(fullProblemData.guide);
        else setAiGuide(DEFAULT_GUIDE);
      }
    },
    [currentProb.name, currentProb.diff, currentProb.slug],
  );

  useEffect(() => {
    // Try to load saved code first
    const savedCode = loadSavedCode(currentProb.slug, language);
    const starter =
      savedCode || getStarterCode(currentProb.slug, language, currentProb.name);

    setEditorCode(starter);
    codeRef.current = starter;
    setCurrentStep(0);
    setAiGuide(null);
    setVisualData(null);
    setVisualType("array");
    setCoachFeedback("");
    setCoachState(null);
    skipNextLiveCoachRef.current = true;

    // Always fetch a fresh guide. getDSAGuidance will fall back to the
    // built-in local coach when no live API keys are configured, so users
    // still get tailored steps instead of the generic placeholder.
    fetchAIGuide(currentProb.slug);
  }, [currentProb, language, hasLiveAIProvider, fetchAIGuide]);

  useEffect(() => {
    if (skipNextLiveCoachRef.current) {
      skipNextLiveCoachRef.current = false;
      return;
    }

    const source = editorCode.trim();
    if (!source) return;

    const requestId = ++liveCoachRequestRef.current;
    const problemSlug = currentProb.slug;
    const fullProblemData = PROBLEM_DATA[problemSlug];
    if (!fullProblemData) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        const problemData = {
          title: currentProb.name,
          description: fullProblemData.desc || "",
          difficulty: currentProb.diff,
          starterCode: fullProblemData?.starter?.[language] || "",
          constraints: fullProblemData?.constraints || [],
          edgeCases: fullProblemData?.edgeCases || [],
          sampleData: fullProblemData?.sampleData || {},
          guide: fullProblemData?.guide || null,
        };

        const result = await getDSAGuidance(
          problemData,
          editorCode,
          "live-keystroke",
          "coding",
          chatMsgs
            .slice(-6)
            .map((msg: any) => ({
              role: msg.role === "ai" ? "ai" : "user",
              content: msg.text || "",
            })),
          { stdin: runnerStdin, language },
          true,
        );

        if (liveCoachRequestRef.current !== requestId) return;
        applyGuidanceResult(result, fullProblemData);
      } catch (error) {
        if (liveCoachRequestRef.current !== requestId) return;
        console.error("❌ Live coach refresh failed:", error);
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    editorCode,
    currentProb.slug,
    currentProb.name,
    currentProb.diff,
    language,
    runnerStdin,
    chatMsgs,
  ]);

  const loadProblem = (prob, cat) => {
    setCurrentProb(prob);
    setCurrentCat(cat);
    if (viewportWidth <= MEDIUM_BREAKPOINT) {
      setIsSidebarOpen(false);
    }
  };

  const submitProblem = () => {
    setSolved((s) => new Set([...s, currentProb.id]));
  };

  const saveApiKeys = () => {
    setRuntimeApiKeys({
      groqKey: groqKeyInput,
      geminiKey: geminiKeyInput,
      mistralKey: mistralKeyInput,
      openRouterKey: openRouterKeyInput,
    });
    setHasLiveAIProvider(hasConfiguredLiveProvider());
    setApiTestMessage("Keys saved!");
    setTimeout(() => setApiTestMessage(""), 2000);
  };

  const testApiConnection = async () => {
    setIsTestingApi(true);
    setApiTestMessage("Testing...");
    try {
      const result = await testLiveProviderConnection();
      if (result.ok) {
        setApiTestMessage("✓ Connected to " + result.provider);
      } else {
        setApiTestMessage("✗ " + result.message);
      }
    } catch (e: any) {
      setApiTestMessage("Error: " + e.message);
    }
    setIsTestingApi(false);
  };

  // Save code to localStorage
  const saveCode = () => {
    if (typeof window === "undefined") return;
    const key = `dsa-code-${currentProb.slug}-${language}`;
    window.localStorage.setItem(key, codeRef.current);
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  // Load saved code from localStorage
  const loadSavedCode = (slug: string, lang: string): string | null => {
    if (typeof window === "undefined") return null;
    const key = `dsa-code-${slug}-${lang}`;
    return window.localStorage.getItem(key);
  };

  const handleRun = async () => {
    saveCode(); // Save before running
    setRunnerStatus("running");
    setRunnerStdout("Running your code...");
    setRunnerMeta("Preparing execution...");
    setIsAIThinking(true);
    setAiTab("chat");
    setChatMsgs((prev) => [...prev, { role: "user", text: "▶ Run my code" }]);

    try {
      try {
        if (language === "javascript") {
          const runResult = runJavaScriptLocally(codeRef.current, runnerStdin);
          setRunnerStatus("success");
          setRunnerStdout(runResult.stdout);
          setRunnerMeta(runResult.meta);
        } else {
          const runResult = await runCodeWithBackend(codeRef.current, runnerStdin);
          setRunnerStatus(runResult.ok ? "success" : "error");
          setRunnerStdout(runResult.stderr ? `${runResult.stderr}\n\n${runResult.stdout}`.trim() : runResult.stdout);
          setRunnerMeta(runResult.meta);
        }
      } catch (runError) {
        const message =
          runError instanceof Error
            ? runError.message
            : "Code execution failed unexpectedly.";
        const unsupportedRuntime =
          message.includes("not installed") ||
          message.includes("not available") ||
          message.includes("not configured");

        setRunnerStatus(unsupportedRuntime ? "unsupported" : "error");
        setRunnerStdout(
          message,
        );
        setRunnerMeta(unsupportedRuntime ? "Runtime unavailable" : "Execution error");
      }

      const problemSlug = currentProb.slug;
      const fullProblemData = PROBLEM_DATA[problemSlug];

      const problemData = {
        title: currentProb.name,
        description: fullProblemData?.desc || "",
        difficulty: currentProb.diff,
        starterCode: fullProblemData?.starter?.[language] || "",
        constraints: fullProblemData?.constraints || [],
        edgeCases: fullProblemData?.edgeCases || [],
        sampleData: fullProblemData?.sampleData || {},
        guide: fullProblemData?.guide || null,
      };

      console.log("🤖 AI Checking code for:", currentProb.name);

      const result = await getDSAGuidance(
        problemData,
        codeRef.current,
        "run-code",
        "coding",
        [
          ...chatMsgs,
          {
            role: "user",
            content: "Run my code and evaluate it. Is my solution correct?",
          },
        ],
        {},
        false,
      );

      console.log("🤖 AI Result:", result);
      console.log("🤖 isCorrect:", result.isCorrect);

      // Build response message
      let responseText = "";
      if (result.isCorrect) {
        responseText =
          "✅ **Correct!** " +
          (result.feedback || "Great job! Your solution works!");
      } else if (result.mistakes && result.mistakes.length > 0) {
        responseText =
          "❌ **Issues found:**\n" +
          result.mistakes.map((m: string) => "• " + m).join("\n");
        if (result.feedback) responseText += "\n\n💡 " + result.feedback;
      } else {
        responseText = result.feedback || "Code evaluated.";
      }

      // Add complexity feedback if available
      if (result.complexity) {
        responseText += `\n\n📊 Complexity: Time ${result.complexity.time || "?"}, Space ${result.complexity.space || "?"}`;
      }

       // Update visual state if available (check both top-level and nested)
       const visType = result.visualType ?? result.visualizationData?.visualType;
       const visData = result.visualData ?? result.visualizationData?.visualData;
       if (visType) {
         setVisualType(visType);
       }
       if (visData) {
         setVisualData(visData);
       }
      if (visType || visData) {
        console.log("🎨 Visual state updated:", { visType, visData });
      }

      setChatMsgs((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: responseText,
          chips: result.isCorrect
            ? ["Next problem", "Explain solution", "Show optimization"]
            : result.hints?.slice(0, 3) || [
                "Show hint",
                "Next step",
                "Explain error",
              ],
        },
      ]);

      applyGuidanceResult(result, fullProblemData);
      setAiTab("chat");
    } catch (e) {
      console.error("❌ AI Error:", e);
      setChatMsgs((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: "Failed to evaluate code. Please check your API keys.",
        },
      ]);
    }
    setIsAIThinking(false);
  };

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput;
    setChatMsgs((msgs) => [...msgs, { role: "user", text: userQ }]);
    setChatInput("");
    setIsAIThinking(true);
    try {
      const problemSlug = currentProb.slug;
      const fullProblemData = PROBLEM_DATA[problemSlug];

      const problemData = {
        title: currentProb.name,
        description: fullProblemData?.desc || "",
        difficulty: currentProb.diff,
        starterCode: fullProblemData?.starter?.[language] || "",
        constraints: fullProblemData?.constraints || [],
        edgeCases: fullProblemData?.edgeCases || [],
        sampleData: fullProblemData?.sampleData || {},
        guide: fullProblemData?.guide || null,
      };

      const result = await getDSAGuidance(
        problemData,
        codeRef.current,
        "user-chat",
        "coding",
        [...chatMsgs, { role: "user" as const, content: userQ }],
        {},
        false,
      );

      const feedback = result.feedback || "Let me check your code...";
      const hints = (result.hints || []).filter(Boolean);
      const visType = result.visualType || result.visualizationData?.visualType;
      const visData = result.visualData || result.visualizationData?.visualData;

      if (visType) setVisualType(visType);
      if (visData) setVisualData(visData);

      applyGuidanceResult(result, fullProblemData);
      setAiTab("visual");

      setChatMsgs((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: feedback,
          chips:
            hints.length > 0
              ? hints.slice(0, 3)
              : ["Show the pattern", "Show the invariant", "What should I change?"],
        },
      ]);
    } catch (e: any) {
      setChatMsgs((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: "I hit an issue while updating the coach. Try again in a second.",
        },
      ]);
    }
    setIsAIThinking(false);
  };

  const inlineSidebarVisible = isSidebarOpen && !isMediumViewport;
  const overlaySidebarVisible = isSidebarOpen && isMediumViewport;
  const inlineAiVisible = isAiPanelOpen && !isCompactViewport;
  const overlayAiVisible = isAiPanelOpen && isCompactViewport;
  const showOverlayBackdrop = overlaySidebarVisible || overlayAiVisible;
  const contentColumns = [
    inlineSidebarVisible ? `${sidebarWidth}px` : "0px",
    inlineSidebarVisible ? "8px" : "0px",
    "minmax(0, 1fr)",
    inlineAiVisible ? "8px" : "0px",
    inlineAiVisible ? `${aiPanelWidth}px` : "0px",
  ].join(" ");
  const overlaySidebarWidth = Math.min(
    Math.max(sidebarWidth, MIN_LEFT_PANEL_WIDTH),
    Math.max(280, viewportWidth - 32),
  );
  const overlayAiWidth = Math.min(
    Math.max(aiPanelWidth, MIN_RIGHT_PANEL_WIDTH),
    Math.max(320, viewportWidth - 32),
  );
  const runnerGridColumns =
    viewportWidth <= 900
      ? "1fr"
      : "minmax(180px, 0.9fr) minmax(220px, 1.1fr)";
  const sidebarToggleStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px",
    borderRadius: 7,
    border: "1px solid #3a4460",
    background: active ? "#1e1b38" : "#161b27",
    color: active ? "#a78bfa" : "#8892a4",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  });
  const resizeHandleStyle: React.CSSProperties = {
    background: "#111827",
    cursor: "col-resize",
    position: "relative",
  };
  const resizeHandleRailStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    transform: "translateX(-50%)",
    background: "#2a3348",
  };
  const sidebarPanel = (style: React.CSSProperties = {}) => (
    <div
      style={{
        borderRight: "1px solid #2a3348",
        background: "#161b27",
        overflowY: "auto",
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          padding: "10px 12px 6px",
          position: "sticky",
          top: 0,
          background: "#161b27",
          zIndex: 5,
          borderBottom: "1px solid #2a3348",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#8892a4",
            letterSpacing: "0.06em",
          }}
        >
          Blind 75 · NeetCode
        </div>
        <input
          style={{
            width: "100%",
            marginTop: 6,
            padding: "5px 10px",
            background: "#1e2535",
            border: "1px solid #2a3348",
            borderRadius: 7,
            color: "#e2e8f0",
            fontSize: 11,
            outline: "none",
          }}
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filteredProblems.map((cat) => (
        <div key={cat.cat}>
          <div
            style={{
              padding: "8px 12px 3px",
              fontSize: 10,
              fontWeight: 700,
              color: "#55627a",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: cat.color,
              }}
            />
            {cat.cat}
          </div>
          {cat.problems.map((prob) => (
            <div
              key={prob.id}
              onClick={() => loadProblem(prob, cat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                cursor: "pointer",
                borderLeft:
                  currentProb.id === prob.id
                    ? "2px solid #a78bfa"
                    : "2px solid transparent",
                background:
                  currentProb.id === prob.id ? "#1e1b38" : "transparent",
                transition: "all 0.1s",
              }}
            >
              <span style={{ fontSize: 10, color: "#55627a", minWidth: 22 }}>
                {solved.has(prob.id) ? "✓" : `#${prob.id}`}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: currentProb.id === prob.id ? "#e2e8f0" : "#8892a4",
                  flex: 1,
                  fontWeight: 500,
                }}
              >
                {prob.name}
              </span>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    prob.diff === "Easy"
                      ? "#22c55e"
                      : prob.diff === "Medium"
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  const aiPanel = (style: React.CSSProperties = {}) => (
    <div
      style={{
        borderLeft: "1px solid #2a3348",
        background: "#161b27",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderBottom: "1px solid #2a3348",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7c6fcd,#a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          AI
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Pair Coder</div>
          <div style={{ fontSize: 10, color: "#55627a" }}>
            Visual Teacher · Always watching
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#14b8a6",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#14b8a6",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          Active
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #2a3348" }}>
        {["visual", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setAiTab(tab)}
            style={{
              flex: 1,
              padding: "8px 6px",
              fontSize: 11,
              fontWeight: 600,
              color: aiTab === tab ? "#a78bfa" : "#55627a",
              background: "transparent",
              borderStyle: "solid",
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 2,
              borderColor: aiTab === tab ? "#7c6fcd" : "transparent",
              cursor: "pointer",
            }}
          >
            {tab === "visual" ? "📖 Guide" : "💬 Chat"}
          </button>
        ))}
      </div>

      {aiTab === "visual" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "#0f1117",
                borderRadius: 10,
                border: "1px solid #2a3348",
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "#a78bfa",
                      background: "#1e2535",
                      border: "1px solid #2a3348",
                      padding: "6px 10px",
                      borderRadius: 999,
                      width: "fit-content",
                    }}
                  >
                    {coachProviderLabel}
                    <span style={{ color: "#55627a" }}>· {coachStageLabel}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                    {currentProb.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {coachPattern?.name || fallbackPatternName}
                    {coachPattern?.description
                      ? ` · ${coachPattern.description}`
                      : ""}
                  </div>
                </div>
                {coachState?.complexity && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #2a3348",
                      background: "#111827",
                      minWidth: 160,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#55627a",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Complexity
                    </div>
                    <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
                      <div>Time: {coachState.complexity.time || "?"}</div>
                      <div>Space: {coachState.complexity.space || "?"}</div>
                    </div>
                  </div>
                )}
              </div>
              {(coachPattern?.description || coachInvariant) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid #2a3348",
                      background: "#111827",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#55627a",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Pattern
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
                      {coachPattern?.description ||
                        "Use the data shape and constraints to choose the right pattern first."}
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid #2a3348",
                      background: "#111827",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#55627a",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Invariant
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
                      {coachInvariant}
                    </div>
                  </div>
                </div>
              )}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: "#9ae6b4",
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 120,
                }}
              >
                {buildAsciiSnapshot()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  background: "#0f1117",
                  border: "1px solid #2a3348",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div className="streamdown-shell">
                  <Streamdown
                    parseIncompleteMarkdown
                    className="streamdown-body"
                  >
                    {normalizeCoachMarkdown(coachOverview)}
                  </Streamdown>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #2a3348",
                    background: "#111827",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#55627a",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Next exact move
                  </div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
                    {coachNextStep}
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #2a3348",
                    background: "#111827",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#55627a",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Checklist
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.7 }}>
                    {coachCheckpoints.length > 0 ? (
                      coachCheckpoints.map((item, index) => (
                        <div key={`${item}-${index}`}>- {item}</div>
                      ))
                    ) : (
                      <div>- Keep the state minimal.</div>
                    )}
                  </div>
                </div>
              </div>
              {coachState?.providerMessage && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    borderTop: "1px solid #1f2937",
                    paddingTop: 2,
                  }}
                >
                  {coachState.providerMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiTab === "chat" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {chatMsgs.length === 0 && (
              <div
                style={{
                  maxWidth: "85%",
                  padding: "8px 11px",
                  borderRadius: 10,
                  background: "#1e2535",
                  border: "1px solid #2a3348",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                I&apos;m your <strong>AI Pair Coder</strong>. I&apos;ll watch your
                code, explain the pattern, and tell you the next exact change to make.
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 6,
                  }}
                >
                  {[
                    "Explain pattern",
                    "Give me an overview",
                    "What pattern?",
                    "I'm stuck",
                  ].map((c) => (
                    <span
                      key={c}
                      onClick={() => {
                        setChatInput(c);
                        setTimeout(() => sendChat(), 100);
                      }}
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "#252d3d",
                        border: "1px solid #3a4460",
                        color: "#55627a",
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background:
                      m.role === "ai"
                        ? "linear-gradient(135deg,#7c6fcd,#a78bfa)"
                        : "#252d3d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {m.role === "ai" ? "AI" : "U"}
                </div>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 11px",
                    borderRadius: 10,
                    background: m.role === "ai" ? "#1e2535" : "#1e1b38",
                    border: "1px solid #2a3348",
                    color: "#e2e8f0",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  <div className="streamdown-shell">
                    <Streamdown
                      parseIncompleteMarkdown
                      className="streamdown-body"
                    >
                      {normalizeCoachMarkdown(m.text || "")}
                    </Streamdown>
                  </div>
                  {m.chips && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {m.chips.map((c) => (
                        <span
                          key={c}
                          onClick={() => {
                            setChatInput(c);
                            setTimeout(() => sendChat(), 100);
                          }}
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: "#252d3d",
                            border: "1px solid #3a4460",
                            color: "#55627a",
                            cursor: "pointer",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "10px 12px",
              borderTop: "1px solid #2a3348",
              background: "#161b27",
            }}
          >
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about this problem..."
              rows={2}
              style={{
                flex: 1,
                padding: "8px 11px",
                background: "#1e2535",
                border: "1px solid #2a3348",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 12,
                fontFamily: "'Space Grotesk', sans-serif",
                outline: "none",
                resize: "none",
              }}
            />
            <button
              onClick={sendChat}
              style={{
                padding: "8px 12px",
                background: "#7c6fcd",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="app"
      style={{
        display: "grid",
        gridTemplateColumns: contentColumns,
        gridTemplateRows: "44px 1fr",
        height: "100vh",
        overflow: "hidden",
        background: "#0f1117",
        color: "#e2e8f0",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
      }}
    >
      {/* TOPBAR */}
      <div
        className="topbar"
        style={{
          gridColumn: "1/-1",
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderBottom: "1px solid #2a3348",
          background: "#161b27",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#a78bfa",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#a78bfa",
              letterSpacing: "-0.3px",
            }}
          >
            PairCoder AI
          </span>
        </div>
        <div style={{ width: 1, height: 24, background: "#2a3348" }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentProb.name}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 12,
              fontWeight: 600,
              background: `${diffColor}22`,
              color: diffColor,
            }}
          >
            {currentProb.diff}
          </span>
          <span style={{ fontSize: 11, color: "#55627a" }}>
            Blind 75 · #{currentProb.id}
          </span>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingRight: 14,
            flexShrink: 0,
          }}
        >
          <button
            style={sidebarToggleStyle(isSidebarOpen)}
            onClick={() => setIsSidebarOpen((open) => !open)}
            title={editorPrefs.docsTooltips ? "Toggle the problem list" : undefined}
          >
            ☰ Problems
          </button>
          <button
            style={sidebarToggleStyle(isAiPanelOpen)}
            onClick={() => setIsAiPanelOpen((open) => !open)}
            title={editorPrefs.docsTooltips ? "Toggle the AI coach panel" : undefined}
          >
            🤖 Coach
          </button>
          <button
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #7c6fcd",
              background: "#1e1b38",
              color: "#a78bfa",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => setShowApiPanel(!showApiPanel)}
            title={editorPrefs.docsTooltips ? "Configure live AI provider keys" : undefined}
          >
            🔑 {hasLiveAIProvider ? "API ✓" : "API ✗"}
          </button>
          <button
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #3a4460",
              background: "#161b27",
              color: "#8892a4",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title={editorPrefs.docsTooltips ? "Editor and display preferences" : undefined}
          >
            ⚙️ Settings
          </button>
          <button
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #7c6fcd",
              background: "#1e1b38",
              color: "#a78bfa",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => {
              setAiTab("chat");
              setIsAiPanelOpen(true);
            }}
            title={editorPrefs.docsTooltips ? "Ask the AI coach for a hint" : undefined}
          >
            💡 Hint
          </button>
          <button
            onClick={saveCode}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #2a3348",
              background: "#111827",
              color: "#cbd5e1",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title={editorPrefs.docsTooltips ? "Save your current code" : undefined}
          >
            💾 Save
          </button>
          <button
            onClick={handleRun}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "none",
              background: "#22c55e",
              color: "#000",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title={editorPrefs.docsTooltips ? "Run code locally (Cmd+Enter / Ctrl+Enter)" : undefined}
          >
            ▶ Run
          </button>
          <button
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "none",
              background: "#7c6fcd",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={submitProblem}
          >
            Submit
          </button>
        </div>
      </div>

      {/* API PANEL */}
      {showApiPanel && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 320,
            background: "#161b27",
            border: "1px solid #2a3348",
            borderRadius: "0 0 0 10px",
            zIndex: 100,
            padding: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#a78bfa",
              marginBottom: 12,
            }}
          >
            🔑 API Keys
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#55627a", marginBottom: 4 }}>
              Model
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            >
              <option value="auto">🤖 Auto (Best Available)</option>
              <option value="groq">🔥 Groq (Fast)</option>
              <option value="gemini">🌐 Gemini</option>
              <option value="mistral">💨 Mistral</option>
              <option value="openrouter">
                🌍 OpenRouter (GPT-4, Claude, etc)
              </option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#55627a", marginBottom: 4 }}>
              Groq Key
            </div>
            <input
              type="password"
              value={groqKeyInput}
              onChange={(e) => setGroqKeyInput(e.target.value)}
              placeholder="gsk_..."
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#55627a", marginBottom: 4 }}>
              Gemini Key
            </div>
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="AIza..."
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#55627a", marginBottom: 4 }}>
              Mistral Key
            </div>
            <input
              type="password"
              value={mistralKeyInput}
              onChange={(e) => setMistralKeyInput(e.target.value)}
              placeholder="mistral-..."
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#55627a", marginBottom: 4 }}>
              OpenRouter Key
            </div>
            <input
              type="password"
              value={openRouterKeyInput}
              onChange={(e) => setOpenRouterKeyInput(e.target.value)}
              placeholder="sk-or-..."
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={saveApiKeys}
              style={{
                flex: 1,
                padding: "6px",
                background: "#7c6fcd",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={testApiConnection}
              disabled={isTestingApi}
              style={{
                flex: 1,
                padding: "6px",
                background: "#1e2535",
                color: "#8892a4",
                border: "1px solid #3a4460",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Test
            </button>
          </div>
          {apiTestMessage && (
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: apiTestMessage.includes("✓") ? "#22c55e" : "#ef4444",
              }}
            >
              {apiTestMessage}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 9, color: "#55627a" }}>
            Keys stored locally. Without keys, uses local coach mode.
          </div>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {showSettingsPanel && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 360,
            maxHeight: "80vh",
            background: "#161b27",
            border: "1px solid #2a3348",
            borderRadius: "0 0 0 10px",
            zIndex: 100,
            padding: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#a78bfa",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            ⚙️ Settings
            <button
              onClick={() => setShowSettingsPanel(false)}
              style={{
                background: "none",
                border: "none",
                color: "#55627a",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          {/* Add Custom Question */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8892a4",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              📝 Custom Questions
              <button
                onClick={() => setShowAddQuestion(!showAddQuestion)}
                style={{
                  padding: "3px 8px",
                  background: "#7c6fcd",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {showAddQuestion ? "− Cancel" : "+ Add"}
              </button>
            </div>

            {showAddQuestion && (
              <div
                style={{
                  background: "#0f1117",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  placeholder="Question name (e.g., Reverse Array)"
                  value={newQuestion.name}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#161b27",
                    border: "1px solid #2a3348",
                    borderRadius: 4,
                    color: "#e2e8f0",
                    fontSize: 10,
                    marginBottom: 6,
                  }}
                />
                <textarea
                  placeholder="Problem description..."
                  value={newQuestion.desc}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, desc: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#161b27",
                    border: "1px solid #2a3348",
                    borderRadius: 4,
                    color: "#e2e8f0",
                    fontSize: 10,
                    marginBottom: 6,
                    minHeight: 60,
                    resize: "vertical",
                  }}
                />
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      difficulty: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#161b27",
                    border: "1px solid #2a3348",
                    borderRadius: 4,
                    color: "#e2e8f0",
                    fontSize: 10,
                    marginBottom: 6,
                  }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <button
                  onClick={() => {
                    if (newQuestion.name && newQuestion.desc) {
                      const updated = [
                        ...customQuestions,
                        { ...newQuestion, id: Date.now() },
                      ];
                      setCustomQuestions(updated);
                      localStorage.setItem(
                        "dsa-custom-questions",
                        JSON.stringify(updated),
                      );
                      setNewQuestion({
                        name: "",
                        slug: "",
                        desc: "",
                        difficulty: "Easy",
                      });
                      setShowAddQuestion(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#22c55e",
                    color: "#000",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add Question
                </button>
              </div>
            )}

            {/* List Custom Questions */}
            {customQuestions.length > 0 && (
              <div style={{ fontSize: 10, color: "#55627a" }}>
                {customQuestions.length} custom question(s) added
              </div>
            )}
          </div>

          {/* Default Language */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8892a4",
                marginBottom: 6,
              }}
            >
              💻 Default Language
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 6,
                color: "#e2e8f0",
                fontSize: 11,
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8892a4",
                marginBottom: 8,
              }}
            >
              Editor Experience
            </div>
            <div
              style={{
                display: "grid",
                gap: 8,
                background: "#0f1117",
                border: "1px solid #2a3348",
                borderRadius: 8,
                padding: 10,
              }}
            >
              {[
                ["autoCloseBrackets", "Autoclose brackets and quotes"],
                ["autocomplete", "Code autocomplete"],
                ["docsTooltips", "Docs tooltips"],
                ["darkMode", "Dark mode"],
                ["highContrastMode", "High contrast mode"],
                ["showWhitespace", "Show whitespace characters"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 11,
                    color: "#cbd5e1",
                  }}
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((editorPrefs as any)[key])}
                    onChange={(e) => updateEditorPref(key, e.target.checked)}
                  />
                </label>
              ))}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 11,
                  color: "#cbd5e1",
                }}
              >
                <span>Disable word wrap</span>
                <input
                  type="checkbox"
                  checked={!editorPrefs.wordWrap}
                  onChange={(e) => updateEditorPref("wordWrap", !e.target.checked)}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 11,
                  color: "#cbd5e1",
                }}
              >
                <span>Code font size</span>
                <select
                  value={editorPrefs.fontSize}
                  onChange={(e) => updateEditorPref("fontSize", e.target.value)}
                  style={{
                    padding: "4px 8px",
                    background: "#161b27",
                    border: "1px solid #2a3348",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 11,
                  }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{ fontSize: 9, color: "#55627a" }}>
            Changes are saved automatically and apply to this browser.
          </div>
        </div>
      )}

      {showOverlayBackdrop && (
        <button
          type="button"
          aria-label="Close sidebar overlays"
          onClick={() => {
            if (overlaySidebarVisible) setIsSidebarOpen(false);
            if (overlayAiVisible) setIsAiPanelOpen(false);
          }}
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            bottom: 0,
            left: 0,
            border: "none",
            background: "rgba(5, 12, 20, 0.58)",
            zIndex: 40,
            cursor: "pointer",
          }}
        />
      )}

      {inlineSidebarVisible &&
        sidebarPanel({
          gridColumn: 1,
          gridRow: 2,
        })}

      {inlineSidebarVisible && (
        <div
          onMouseDown={() => setActiveDrag("sidebar")}
          style={{
            ...resizeHandleStyle,
            gridColumn: 2,
            gridRow: 2,
            zIndex: 20,
          }}
          title="Drag to resize the problem list"
        >
          <div style={resizeHandleRailStyle} />
        </div>
      )}

      {overlaySidebarVisible &&
        sidebarPanel({
          position: "absolute",
          top: 44,
          bottom: 0,
          left: 0,
          width: overlaySidebarWidth,
          zIndex: 60,
          boxShadow: "18px 0 40px rgba(0,0,0,0.45)",
        })}

      {/* EDITOR */}
      <div
        style={{
          gridColumn: 3,
          gridRow: 2,
          display: "flex",
          flexDirection: "column",
          background: "#0f1117",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            borderBottom: "1px solid #2a3348",
            background: "#161b27",
            padding: "0 12px",
          }}
        >
          <div
            onClick={() => setEditorTab("code")}
            style={{
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: editorTab === "code" ? "#a78bfa" : "#55627a",
              borderBottom:
                editorTab === "code"
                  ? "2px solid #7c6fcd"
                  : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            Code
          </div>
          <div
            onClick={() => setEditorTab("problem")}
            style={{
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: editorTab === "problem" ? "#a78bfa" : "#55627a",
              borderBottom:
                editorTab === "problem"
                  ? "2px solid #7c6fcd"
                  : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            Problem
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title={editorPrefs.docsTooltips ? "Choose the coding language" : undefined}
            style={{
              marginLeft: "auto",
              padding: "3px 8px",
              background: "#1e2535",
              border: "1px solid #2a3348",
              borderRadius: 6,
              color: "#8892a4",
              fontSize: 10,
              outline: "none",
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              display: editorTab === "code" ? "block" : "none",
              height: "100%",
            }}
          >
            <MemoCodeEditor
              key={`${currentProb.slug}-${language}`}
              initialValue={editorCode}
              darkMode={editorPrefs.darkMode}
              extensions={editorExtensions}
              autocomplete={editorPrefs.autocomplete}
              autoCloseBrackets={editorPrefs.autoCloseBrackets}
              showWhitespace={editorPrefs.showWhitespace}
              fontSize={FONT_SIZE_MAP[editorPrefs.fontSize] || 15}
              onDocChange={handleEditorChange}
              onRun={handleEditorKeyDown}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: editorTab === "problem" ? "block" : "none",
              padding: 24,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#cbd5e1",
              overflowY: "auto",
              height: "100%",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#a78bfa",
                marginBottom: 12,
              }}
            >
              {currentProb.name}
            </h2>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {PROBLEM_DATA[currentProb.slug]?.desc ||
                "No description available."}
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 12,
            borderTop: "1px solid #2a3348",
            background: "#161b27",
            display: "grid",
            gridTemplateColumns: runnerGridColumns,
            gap: 12,
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#55627a",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              stdin
            </div>
            <div style={{ fontSize: 10, color: "#8892a4", marginBottom: 6 }}>
              Input for the program (optional)
            </div>
            <textarea
              value={runnerStdin}
              onChange={(e) => setRunnerStdin(e.target.value)}
              placeholder="42\nhello world"
              style={{
                width: "100%",
                minHeight: 92,
                resize: "vertical",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #2a3348",
                background: "#0f1117",
                color: "#e2e8f0",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#55627a",
                  letterSpacing: "0.05em",
                }}
              >
                Output
              </div>
              <div
                style={{
                  fontSize: 11,
                  color:
                    runnerStatus === "error"
                      ? "#f87171"
                      : runnerStatus === "success"
                        ? "#4ade80"
                        : runnerStatus === "unsupported"
                          ? "#facc15"
                          : "#94a3b8",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {runnerMeta}
              </div>
            </div>
            <div
              style={{
                borderRadius: 8,
                border: "1px solid #2a3348",
                background: "#0b1220",
                padding: "10px 12px",
                minHeight: 118,
                whiteSpace: "pre-wrap",
                fontSize: 12,
                lineHeight: 1.6,
                color:
                  runnerStatus === "error"
                    ? "#fca5a5"
                    : runnerStatus === "unsupported"
                      ? "#fde68a"
                      : "#d1fae5",
                fontFamily: "'JetBrains Mono', monospace",
                overflowX: "auto",
              }}
            >
              {runnerStdout}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 10,
                color: "#64748b",
              }}
            >
              <span>{lastSavedAt ? `Saved at ${lastSavedAt}` : "Not saved yet"}</span>
              <span>Cmd+Enter / Ctrl+Enter to run</span>
            </div>
          </div>
        </div>
      </div>

      {inlineAiVisible && (
        <div
          onMouseDown={() => setActiveDrag("ai")}
          style={{
            ...resizeHandleStyle,
            gridColumn: 4,
            gridRow: 2,
            zIndex: 20,
          }}
          title="Drag to resize the AI coach panel"
        >
          <div style={resizeHandleRailStyle} />
        </div>
      )}

      {inlineAiVisible &&
        aiPanel({
          gridColumn: 5,
          gridRow: 2,
        })}

      {overlayAiVisible &&
        aiPanel({
          position: "absolute",
          top: 44,
          right: 0,
          bottom: 0,
          width: overlayAiWidth,
          zIndex: 60,
          boxShadow: "-18px 0 40px rgba(0,0,0,0.45)",
        })}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
      `}</style>
    </div>
  );
}
