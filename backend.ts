import express from 'express'; // Import using default import syntax
import { readFile, writeFile } from 'fs/promises';
import fs from 'fs';

// Interface for submission data structure
interface Submission {
    name: string;
    email: string;
    phone: string;
    github_link: string;
    stopwatch_time: number;
}

const dbPath = 'db.json';

// Helper function to read submissions from JSON file (with error handling)
async function readSubmissions(): Promise<Submission[]> {
    try {
        const data = await readFile(dbPath, 'utf-8');
        return JSON.parse(data) as Submission[];
    } catch (error) {
        console.error('Error reading submissions:', error);
        // Consider returning an empty array or throwing a specific error here
        return []; // Or throw new Error('Failed to read submissions');
    }
}

// Helper function to write submissions to JSON file (with error handling)
async function writeSubmissions(submissions: Submission[]) {
    try {
        const data = JSON.stringify(submissions, null, 2); // Pretty-print for readability
        await writeFile(dbPath, data);
    } catch (error) {
        console.error('Error writing submissions:', error);
        // Consider throwing a specific error to handle in the endpoint
        throw new Error('Failed to write submissions');
    }
}

// Check if db.json exists, create it if not (with error handling)
if (!fs.existsSync(dbPath)) {
    try {
        async () => {
            await writeFile(dbPath, '[]'); // Create an empty array as initial data
            console.log('db.json file created successfully.');
        }
    } catch (error) {
        console.error('Error creating db.json file:', error);
        // Handle potential issues creating the file (e.g., permissions)
        process.exit(1); // Exit the process if file creation fails
    }
}

// Express app setup
const app = express();
const port = 3000;

// Ping endpoint
app.get('/ping', (_req, res) => {
    res.json({ success: true });
});

// Submit endpoint (POST request with form data)
app.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, github_link, stopwatch_time } = req.body;

        const submissions = await readSubmissions();
        submissions.push({ name, email, phone, github_link, stopwatch_time });
        await writeSubmissions(submissions);

        res.json({ message: 'Submission saved successfully!' });
    } catch (error) {
        console.error('Error saving submission:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Read endpoint (GET request with index query parameter)
app.get('/read', async (req, res) => {
    try {
        const index = parseInt(req.query.index as string, 10); // Parse index parameter

        if (isNaN(index) || index < 0) {
            throw new Error('Invalid index parameter');
        }

        const submissions = await readSubmissions();
        const submission = submissions[index];

        if (!submission) {
            res.status(404).json({ message: 'Submission not found' });
        } else {
            res.json(submission);
        }
    } catch (error) {
        console.error('Error reading submission:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
