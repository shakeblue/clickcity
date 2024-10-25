const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const prompt = require('prompt-sync')();
const displayAuthorInfo = require('./author');

// Hiển thị thông tin tác giả
displayAuthorInfo();

// Đọc cấu hình Proxy
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

// Đọc Query IDs
function readQueryIDs() {
    const dataFilePath = path.join(__dirname, 'data.txt');
    return fs.readFileSync(dataFilePath, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean);
}

// Hàm chạy worker
function runWorker(queryIDs, proxies, workerKey) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { queryIDs, proxies, workerKey }
        });

        worker.on('message', (message) => {
            if (message === 'done') {
                resolve();
            } else {
                reject(new Error('Worker gặp lỗi'));
            }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker dừng với mã thoát ${code}`));
            }
        });
    });
}

// Hàm chính để quản lý workers
async function main() {
    const proxies = readProxyConfig();
    const queryIDs = readQueryIDs();
    const workerPromises = [];

    let numWorkers = 1;
    do {
        numWorkers = parseInt(prompt('Bạn muốn xử lý bao nhiêu luồng?: '), 10);
        if (isNaN(numWorkers) || numWorkers <= 0) {
            console.error(chalk.red('Số lượng luồng không hợp lệ. Vui lòng nhập một số nguyên dương.'));
        }
    } while (isNaN(numWorkers) || numWorkers <= 0);

    const batchSize = Math.ceil(queryIDs.length / numWorkers);
    
    while (true){
        let workerKey = 0;
        for (let i = 0; i < queryIDs.length; i += batchSize) {
            const batch = queryIDs.slice(i, i + batchSize);
            const batchProxies = proxies.slice(i, i + batchSize);
            workerKey ++;
            workerPromises.push(runWorker(batch, batchProxies, workerKey));
        }
         
        try {
            await Promise.all(workerPromises);
            console.log(chalk.green('Tất cả tài khoản đã được xử lý.'));
        } catch (error) {
            console.error(chalk.red('Lỗi trong hàm chính:'), error);
        }
        // đếm ngược 120 giây và tiếp tục
        let time = 300;
        console.log(chalk.yellow(`Chờ ${time} giây trước khi bắt đầu lại...`));
        while (time > 0) {
            console.log(chalk.yellow(`Tiếp tục sau ${time} giây...`));
            await new Promise(resolve => setTimeout(resolve, 1000));
            time--;
        }
    }
}

main();