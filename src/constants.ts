export interface Step {
  label: string;
  explain: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCode: string;
  constraints: string[];
  edgeCases: string[];
  pattern: string;
  visualType: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence';
  sampleData: Record<string, unknown>;
  guide: {
    steps: Step[];
  };
}

export const PROBLEMS: Problem[] = [
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    starterCode: 'function containsDuplicate(nums) {\n  \n}',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    edgeCases: [
      'Empty array (though constraints say min 1)',
      'Array with all unique elements',
      'Array with all same elements'
    ],
    pattern: 'Hash Set / Hashing',
    visualType: 'set',
    sampleData: { nums: [1, 2, 3, 1] },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'Compare every pair (i, j) where i < j. If nums[i] == nums[j], found duplicate. Time: O(n^2).' },
        { label: 'Key Insight', explain: 'Instead of re-comparing, "remember" what we have seen. A Hash Set gives us O(1) lookup.' },
        { label: 'One Pass', explain: 'Iterate once. If current number is in the set, return true. Otherwise, add it and continue.' },
        { label: 'Example Trace', explain: 'Nums: [1,2,3,1] -> Set: {1} -> {1,2} -> {1,2,3} -> "1" is already in set! Return true.' },
        { label: 'Complexity', explain: 'Time: O(n) as we visit each element once. Space: O(n) to store seen elements in the Set.' }
      ]
    }
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    starterCode: 'function isAnagram(s, t) {\n  \n}',
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.'
    ],
    edgeCases: [
      'Strings of different lengths',
      'Empty strings',
      'Strings with same characters but different counts'
    ],
    pattern: 'Hash Map / Frequency Counting',
    visualType: 'hashmap',
    sampleData: { s: 'anagram', t: 'nagaram' },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'Sort both strings alphabetically. If s_sorted == t_sorted, they are anagrams. Time: O(n log n).' },
        { label: 'Key Insight', explain: 'Anagrams must have the exact same character counts. A freq map can track this in O(n).' },
        { label: 'One Pass', explain: 'Use one Hash Map (or Array[26]). Increment for chars in s, decrement for chars in t. Must end at all zeros.' },
        { label: 'Example Trace', explain: 's="art", t="rat": Freq Map becomes {a:1, r:1, t:1}. Consuming t: r->0, a->0, t->0. All zero!' },
        { label: 'Complexity', explain: 'Time: O(n) to count characters. Space: O(1) if lowercase letters only (fixed size 26 map).' }
      ]
    }
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    starterCode: 'function twoSum(nums, target) {\n  \n}',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    edgeCases: [
      'Target is sum of first two elements',
      'Target is sum of last two elements',
      'Numbers are negative',
      'Numbers are zero'
    ],
    pattern: 'Hash Map Lookup',
    visualType: 'hashmap',
    sampleData: { nums: [2, 7, 11, 15], target: 9 },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'Try every pair (i, j) where i != j. If nums[i] + nums[j] == target, return [i, j]. Time: O(n^2).' },
        { label: 'Key Insight', explain: 'For each number x, we need exactly target - x. A Hash Map can find this "complement" instantly.' },
        { label: 'One Pass', explain: 'Iterate once. Look for (target - current) in the map. If found, return indices. If not, save current in map.' },
        { label: 'Example Trace', explain: 'Target 9, Nums [2, 7,...]. At index 0 (2): map {2:0}. At index 1 (7): need 2. Found in map! Return [0, 1].' },
        { label: 'Complexity', explain: 'Time: O(n) as we visit each element once. Space: O(n) to store the mapping of value to index.' }
      ]
    }
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    starterCode: 'function groupAnagrams(strs) {\n  \n}',
    constraints: [
      '1 <= strs.length <= 10^4',
      '0 <= strs[i].length <= 100',
      'strs[i] consists of lowercase English letters.'
    ],
    edgeCases: [
      'Empty string in array',
      'Array with one string',
      'All strings are anagrams',
      'No strings are anagrams'
    ],
    pattern: 'Hash Map / Categorization',
    visualType: 'hashmap',
    sampleData: { strs: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'For each word, check every other word to see if they are anagrams. Very slow.' },
        { label: 'Key Insight', explain: 'Anagrams share a common "signature" (alphabetized characters). Group by this unique signature.' },
        { label: 'One Pass', explain: 'Go through strs. Split/Sort/Join word to get the key. Use key in a Map to group original strings.' },
        { label: 'Example Trace', explain: '"eat"->key "aet", "tea"->key "aet". Map: {"aet": ["eat", "tea"]}. Grouping successful.' },
        { label: 'Complexity', explain: 'Time: O(n * k log k) where k is max string length. Space: O(n * k) for storing strings.' }
      ]
    }
  },
  {
    id: 'top-k-frequent',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
    starterCode: 'function topKFrequent(nums, k) {\n  \n}',
    constraints: [
      '1 <= nums.length <= 10^5',
      'k is in the range [1, the number of unique elements in the array].',
      'It is guaranteed that the answer is unique.'
    ],
    edgeCases: [
      'k equals number of unique elements',
      'All elements have same frequency',
      'Array has only one element'
    ],
    pattern: 'Heap / Bucket Sort',
    visualType: 'array',
    sampleData: { nums: [1, 1, 1, 2, 2, 3], k: 2 },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'Count frequencies, sort the elements by frequency descending, return top k. Time: O(n log n).' },
        { label: 'Key Insight', explain: 'Since frequency is bounded by array size n, we can use Bucket Sort instead of sorting frequencies.' },
        { label: 'One Pass', explain: '1. Count freqs via Map. 2. Create buckets array where index = freq. 3. Collect elements from max bucket down.' },
        { label: 'Example Trace', explain: '{1:3, 2:2, 3:1}. Buckets[3]=[1], Buckets[2]=[2], Buckets[1]=[3]. Collect from index 3 down until k=2.' },
        { label: 'Complexity', explain: 'Time: O(n) as we traverse freqs and buckets once. Space: O(n) for Map and buckets.' }
      ]
    }
  },
  {
    id: 'longest-consecutive',
    title: 'Longest Consecutive Sequence',
    difficulty: 'Medium',
    description: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.',
    starterCode: 'function longestConsecutive(nums) {\n  \n}',
    constraints: [
      '0 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    edgeCases: [
      'Empty array',
      'Array with one element',
      'Sequence with duplicates',
      'Multiple sequences of same length'
    ],
    pattern: 'Hash Set / Sequence Building',
    visualType: 'sequence',
    sampleData: { nums: [100, 4, 200, 1, 3, 2] },
    guide: {
      steps: [
        { label: 'Brute Force', explain: 'Sort the array, then iterate once to find the longest running run of numbers. Time: O(n log n).' },
        { label: 'Key Insight', explain: 'A number n starts a sequence only if n-1 is NOT present. Checking "starts" avoids duplicate work.' },
        { label: 'One Pass', explain: 'Put all nums in Set. For each num, if num-1 is missing, it is a "start". Count forward from it: num+1, num+2...' },
        { label: 'Example Trace', explain: '[100,4,200,1,3,2]. 4 has 3, skip. 1 is start (0 missing), count 1,2,3,4. Len=4. Max=4.' },
        { label: 'Complexity', explain: 'Time: O(n) — each element is "counted" exactly twice (once to check start, once in a sequence). Space: O(n).' }
      ]
    }
  }
];
