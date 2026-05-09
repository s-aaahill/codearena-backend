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

        let codeFilename, execCommand;

        const uid = process.getuid ? process.getuid() : 1000; 
        const gid = process.getgid ? process.getgid() : 1000;

        if (language === 'python') {
            codeFilename = 'code.py';
            execCommand = `docker run --rm --network none --memory 256m --user ${uid}:${gid} -v ${tempDir}:/app codearena-sandbox sh -c "python3 /app/code.py < /app/input.txt"`;
        } else if (language === 'cpp') {
            codeFilename = 'code.cpp';
            execCommand = `docker run --rm --network none --memory 256m --user ${uid}:${gid} -v ${tempDir}:/app codearena-sandbox sh -c "g++ /app/code.cpp -o /app/out && /app/out < /app/input.txt"`;
        }

        const codeFilePath = path.join(tempDir, codeFilename);
        const inputFilePath = path.join(tempDir, 'input.txt');

        await fs.writeFile(codeFilePath, code);

        let allPassed = true;
        let finalStatus = "Accepted";
        let failureDetails = null;
        let maxExecutionTime = 0;

        for (const testCase of problem.testCases) {
            await fs.writeFile(inputFilePath, testCase.input);

            try {
                const startTime = Date.now();
                
                const { stdout } = await execAsync(execCommand, { timeout: 3000 }); 
                
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
            } catch (error) {
                allPassed = false;
                
                if (error.killed) {
                    finalStatus = "Time Limit Exceeded";
                    failureDetails = "Code took too long to execute.";
                } else {
                    finalStatus = "Runtime/Compilation Error";
                    failureDetails = error.stderr || error.message;
                }
                break;
            }
        }

        await fs.rm(tempDir, { recursive: true, force: true });

        const submission = await prisma.submission.create({
            data: {
                code,
                language,
                status: finalStatus,
                executionMs: maxExecutionTime,
                userId,
                problemId
            }
        });

        res.status(200).json({ 
            status: finalStatus, 
            details: failureDetails,
            executionMs: maxExecutionTime,
            submissionId: submission.id 
        });

    } catch (error) {
        console.error("Execution error:", error);
        res.status(500).json({ error: "Failed to execute code" });
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