// backend/src/controllers/problem.controller.js
import prisma from '../lib/prisma.js';

export const getAllProblems = async (req, res) => {
    try {
        const problems = await prisma.problem.findMany({
            select: {
                id: true,
                title: true,
                difficulty: true,
            }
        });
        res.status(200).json(problems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch problems" });
    }
};

export const getProblemById = async (req, res) => {
    try {
        const { id } = req.params;
        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: {
                    where: { isHidden: false },
                    select: { input: true, expectedOutput: true }
                }
            }
        });

        if (!problem) return res.status(404).json({ error: "Problem not found" });

        res.status(200).json(problem);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch problem details" });
    }
};