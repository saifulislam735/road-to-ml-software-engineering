### 1. HashMaps, HashSets, Frequency Counts & Anagrams

To understand how these structures work under the hood and how to apply them to frequency/anagram problems:

* **For the Core Theory:** Read [Hash Tables](https://medium.com/basecs/taking-hash-tables-off-the-shelf-139cbf4752f0) from the *Fundamental Concepts* section. This will explain the mechanics of HashMaps and HashSets.
* **For Anagrams & String Frequencies:** Read [Collections of Important String Questions](https://leetcode.com/discuss/study-guide/2001789/Collections-of-Important-String-questions-Pattern) from the  *Must-Read Leetcode Articles* . Anagram problems heavily rely on HashMaps to count character frequencies.

### 2. Two Sum Family Problems

The "Two Sum" family (Two Sum, Two Sum II, 3Sum, 4Sum) relies heavily on two core concepts: HashMaps (for unsorted arrays) and Two Pointers (for sorted arrays).

* **For the Hashing approach:** The **Hash Tables** article above will cover the foundation.
* **For the Sorted approach:** Watch [Two Pointers Pattern](https://www.youtube.com/watch?v=QzZ7nmouLTI&list=PLK63NuByH5o9odyBT7nfYkHZyvGQ5oVp2) from the *Patterns* section.
* **For Deep Practice:** Read [Two Pointers Patterns](https://leetcode.com/discuss/study-guide/1688903/Solved-all-two-pointers-problems-in-100-days) from the *Must-Read Leetcode Articles* to see how the Two Sum logic scales up.

### 3. Prefix Sum & Difference Array

This is a very specific mathematical pattern used to quickly query the sum of a sub-array.

* **For the Pattern:** Watch [Prefix Sum Pattern](https://www.youtube.com/watch?v=yuws7YK0Yng&list=PLK63NuByH5o9odyBT7nfYkHZyvGQ5oVp2) under the *Patterns* section.

### 4. Kadane's Algorithm (Max Subarray)

Kadane's is an elegant algorithm specifically designed to find the maximum contiguous subarray sum in **$O(n)$** time.

* **For the Algorithm:** Watch [Kadane&#39;s Algorithm](https://www.youtube.com/watch?v=NUWAXbSlsws&list=PLK63NuByH5o9odyBT7nfYkHZyvGQ5oVp2) under the *Patterns* section. It will break down the exact logic you need.

### 5. Your Goal: 8 LeetCode Problems (Arrays & Hashing)

To find 8 high-quality, quintessential problems that test these exact concepts without wasting time on poorly designed questions:

* **Go to the Curated Problems Section:** Click on [Blind 75](https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions).
* **Your Strategy:** The Blind 75 is famously categorized by topic. Go straight to the "Arrays" section of that list. You will immediately find the core 8 questions you need, including:

  * *Two Sum* (Tests HashMaps)
  * *Contains Duplicate* (Tests HashSets)
  * *Valid Anagram* (Tests Frequency Counting)
  * *Maximum Subarray* (Tests Kadane's Algorithm)
