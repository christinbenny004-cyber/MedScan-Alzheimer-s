const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

// Enable CORS for React dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
}));

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 16 * 1024 * 1024 } // 16 MB
});

// Paths to Python and Inference Worker
const pythonExecutable = 'python'; // Or 'python3' depending on environment
const workerScript = path.join(__dirname, '..', 'backend', 'inference_worker.py');

// --- Health Check Endpoint ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', node_backend: true });
});

// --- Prediction Endpoint ---
app.post('/api/predict', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Send a "file" field.' });
    }

    const imagePath = req.file.path;
    console.log(`[MedScan Node] Received image for prediction: ${req.file.originalname}`);

    // Spawn Python script to run inference
    execFile(pythonExecutable, [workerScript, imagePath], { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
        // Clean up uploaded file
        fs.unlink(imagePath, (err) => {
            if (err) console.error(`Failed to delete temporary file ${imagePath}:`, err);
        });

        if (error) {
            console.error('[MedScan Node] Python worker error:', error);
            console.error('[MedScan Node] Python stderr:', stderr);
            return res.status(500).json({ error: 'Python inference failed. See server logs.' });
        }

        try {
            // Find the JSON block in stdout (ignoring debug prints)
            const resultMatch = stdout.match(/<MEDSCAN_RESULT>([\s\S]*?)<\/MEDSCAN_RESULT>/);
            if (!resultMatch) {
                console.error('[MedScan Node] Invalid Python output:', stdout);
                return res.status(500).json({ error: 'Failed to parse inference result from Python.' });
            }

            const jsonResponse = JSON.parse(resultMatch[1]);
            res.json(jsonResponse);

        } catch (parseError) {
            console.error('[MedScan Node] JSON parse error:', parseError);
            console.log('[MedScan Node] Raw stdout:', stdout);
            res.status(500).json({ error: 'Failed to parse JSON from Python worker.' });
        }
    });
});

app.listen(port, () => {
    console.log(`==================================================`);
    console.log(`  MedScan Node.js Backend`);
    console.log(`  Listening on http://127.0.0.1:${port}`);
    console.log(`==================================================`);
});
