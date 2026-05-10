// backend/src/controllers/submission.controller.js
import prisma from '../lib/prisma.js';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import crypto from 'crypto';

const execAsync = util.promisify(exec);

export const submitCode = async (req, res) => {
    try {
        const { code, language, problemId } = req.body;
        const userId = req.user.id;

        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { testCases: true }
        });

        if (!problem) return res.status(404).json({ error: "Problem not found" });

        const uniqueId = crypto.randomUUID();
        const tempDir = path.join(process.cwd(), 'temp', uniqueId);
        await fs.mkdir(tempDir, { recursive: true });

        const codePath = path.join(tempDir, language === 'cpp' ? 'code.cpp' : 'code.py');
        const inputPath = path.join(tempDir, 'input.txt');
        const outPath = path.join(tempDir, 'out');

        await fs.writeFile(codePath, code);

        if (language === 'cpp') {
            try {
                await execAsync(`g++ ${codePath} -o ${outPath}`, { timeout: 10000 });
            } catch (compileErr) {
                await fs.rm(tempDir, { recursive: true, force: true });
                return res.status(200).json({ 
                    status: "Compilation Error", 
                    details: compileErr.stderr || "Check your C++ syntax." 
                });
            }
        }

        let allPassed = true;
        let finalStatus = "Accepted";
        let failureDetails = null;
        let maxExecutionTime = 0;

        for (const testCase of problem.testCases) {
            await fs.writeFile(inputPath, testCase.input);

            let execCommand = language === 'python' 
                ? `python3 ${codePath} < ${inputPath}` 
                : `${outPath} < ${inputPath}`;

            try {
                const startTime = Date.now();
                
                const { stdout } = await execAsync(execCommand, { timeout: 5000 });
                
                const executionTime = Date.now() - startTime;
                maxExecutionTime = Math.max(maxExecutionTime, executionTime);

                const actualOutput = stdout.trim();
                const expectedOutput = testCase.expectedOutput.trim();

                if (actualOutput !== expectedOutput) {
                    allPassed = false;
                    finalStatus = "Wrong Answer";
                    failureDetails = testCase.isHidden 
                        ? "Failed on a hidden test case." 
                        : `Input: ${testCase.input} | Expected: ${expectedOutput} | Got: ${actualOutput}`;
                    break;
                }
            } catch (err) {
                allPassed = false;
                if (err.killed) {
                    finalStatus = "Time Limit Exceeded";
                    failureDetails = "Your code was too slow for the cloud. Try optimizing your algorithm.";
                } else {
                    finalStatus = "Runtime Error";
                    failureDetails = err.stderr || "Check for infinite loops or memory issues.";
                }
                break;
            }
        }

        await fs.rm(tempDir, { recursive: true, force: true });

        const submission = await prisma.submission.create({
            data: { code, language, status: finalStatus, executionMs: maxExecutionTime, userId, problemId }
        });

        res.status(200).json({ status: finalStatus, details: failureDetails, executionMs: maxExecutionTime, submissionId: submission.id });

    } catch (error) {
        console.error("Execution error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMySubmissions = async (req, res) => {
    try {
        const submissions = await prisma.submission.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                problem: { select: { title: true, difficulty: true } }
            }
        });

        res.status(200).json(submissions);
    } catch (error) {
        console.error("Fetch submssions error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};