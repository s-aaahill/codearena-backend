import prisma from '../src/lib/prisma.js';

async function main() {
    console.log("Sweeping the Arena... Deleting old data.");
    
    await prisma.submission.deleteMany(); 
    await prisma.testCase.deleteMany();
    await prisma.problem.deleteMany();

    console.log("Injecting the pristine Problem Vault...");

    // 1. Two Sum (Easy)
    await prisma.problem.create({
        data: {
            title: "1. Two Sum",
            description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\n**Input format:** `[nums], target`\n**Output format:** `[index1,index2]`",
            difficulty: "EASY",
            testCases: {
                create: [
                    { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
                    { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false },
                    { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true },
                ]
            }
        }
    });

    // 2. Palindrome Number (Easy)
    await prisma.problem.create({
        data: {
            title: "2. Palindrome Number",
            description: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\n**Input format:** `x`\n**Output format:** `true` or `false`",
            difficulty: "EASY",
            testCases: {
                create: [
                    { input: "121", expectedOutput: "true", isHidden: false },
                    { input: "-121", expectedOutput: "false", isHidden: false },
                    { input: "10", expectedOutput: "false", isHidden: true },
                    { input: "0", expectedOutput: "true", isHidden: true },
                ]
            }
        }
    });

    // 3. Contains Duplicate (Easy)
    await prisma.problem.create({
        data: {
            title: "3. Contains Duplicate",
            description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.\n\n**Input format:** `[nums]`\n**Output format:** `true` or `false`",
            difficulty: "EASY",
            testCases: {
                create: [
                    { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
                    { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
                    { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: true },
                ]
            }
        }
    });

    // 4. Maximum Subarray (Medium)
    await prisma.problem.create({
        data: {
            title: "4. Maximum Subarray",
            description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Input format:** `[nums]`\n**Output format:** `integer`",
            difficulty: "MEDIUM",
            testCases: {
                create: [
                    { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
                    { input: "[1]", expectedOutput: "1", isHidden: false },
                    { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: true },
                    { input: "[-1,-2,-3]", expectedOutput: "-1", isHidden: true },
                ]
            }
        }
    });

    console.log("Vault seeded successfully! The Arena is ready.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });