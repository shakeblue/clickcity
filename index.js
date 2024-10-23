const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const prompt = require('prompt-sync')();

// Read Proxy Configuration
function readProxyConfig() {
    const proxyFilePath = path.join(__dirname, 'proxy.txt');
    const proxyData = fs.readFileSync(proxyFilePath, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean);
    return proxyData.map(proxy => {
        const proxyUrl = new URL(proxy.trim());
        return {
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
            auth: `${proxyUrl.username}:${proxyUrl.password}`
        };
    });
}

// Read Query IDs
function readQueryIDs() {
    const dataFilePath = path.join(__dirname, 'data.txt');
    return fs.readFileSync(dataFilePath, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean);
}

// Function to run a worker
function runWorker(queryIDs, proxies, cipherCode) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { queryIDs, proxies, cipherCode }
        });

        worker.on('message', (message) => {
            if (message === 'done') {
                resolve();
            } else {
                reject(new Error('Worker encountered an error'));
            }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

// Main function to manage workers
async function main() {
    const proxies = readProxyConfig();
    const queryIDs = readQueryIDs();
    const workerPromises = [];

    let numWorkers = 1;
    do {
        numWorkers = parseInt(prompt('How many threads would you like to process?: '), 10);
        if (isNaN(numWorkers) || numWorkers <= 0) {
            console.error(chalk.red('Invalid number of workers. Please enter a positive integer.'));
        }
    } while (isNaN(numWorkers) || numWorkers <= 0);

    const batchSize = Math.ceil(queryIDs.length / numWorkers);
    
    for (let i = 0; i < queryIDs.length; i += batchSize) {
        const batch = queryIDs.slice(i, i + batchSize);
        const batchProxies = proxies.slice(i, i + batchSize);
        workerPromises.push(runWorker(batch, batchProxies));
    }

    try {
        await Promise.all(workerPromises);
        console.log(chalk.green('All accounts have been processed.'));
    } catch (error) {
        console.error(chalk.red('Error in main function:'), error);
    }
}

main();