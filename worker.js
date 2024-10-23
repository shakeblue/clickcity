const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');
const chalk = require('chalk');
const crypto = require('crypto');
const querystring = require('querystring');
const CryptoJS = require('crypto-js');

// Create Axios Instance
function createAxiosInstance(proxy, queryid) {
    return axios.create({
        headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "authorization": `tma ${queryid}`,
            "content-type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        httpsAgent: new HttpsProxyAgent(proxy)
    });
}

// Check Proxy IP
async function checkProxyIP(proxy) {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: new HttpsProxyAgent(proxy)
        });
        return response.data.ip;
    } catch (error) {
        throw new Error(`Failed to check proxy IP: ${error.message}`);
    }
}

// Main Function
async function main(queryIDs, proxies) {
    try {
        for (let i = 0; i < queryIDs.length; i++) {
            const queryid = queryIDs[i];
            const proxy = proxies[i % proxies.length]; // Use corresponding proxy or loop if fewer proxies

            try {
                // Parse the query string to get the user parameter
                const parsedQuery = querystring.parse(queryid);
                const user = JSON.parse(decodeURIComponent(parsedQuery.user));
                userName = `${user.first_name} ${user.last_name}`.trim();
            } catch (decodeError) {
                console.error(chalk.red(`Error decoding query ID: ${queryid}`), decodeError);
                continue; // Skip to the next iteration if decoding fails
            }

            console.log(chalk.yellow(`Processing query ID: ${queryid} with proxy: ${proxy.host}:${proxy.port} for user: ${userName}`));

            const proxyIP = await getProxyIP(proxy);
            console.log(chalk.yellow(`Proxy IP: ${proxyIP}`));

            const axiosInstance = createAxiosInstance(proxy, queryid);
            let completedSocialTasks = [];
            let quizReward = false;
            let cipherRewarded = false;
            // Login
            try {
                const loginResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/user", {
                    currentTime: new Date().toISOString()
                });
                if (loginResponse.status === 200 && loginResponse.data.status === true) {
                    console.log(chalk.green('Login successful'));
                    completedSocialTasks = loginResponse.data.data.user.socialMediaRewards ? Object.keys(loginResponse.data.data.user.socialMediaRewards) : [];
                    quizReward = loginResponse.data.data.user.quizRewarded;
                    cipherRewarded = loginResponse.data.data.user.cipherRewarded;
                    //if !loginResponse.data.data.user.country, update country
                    if (!loginResponse.data.data.user.country) {
                        try {
                            const updateCountryResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/user/update", {
                                country: "United States"
                            });
                            if (updateCountryResponse.status === 200 && updateCountryResponse.data.status === true) {
                                console.log(chalk.green('Country update successful'));
                            } else {
                                console.error(chalk.red('Country update failed'));
                            }
                        } catch (error) {
                            console.error(chalk.red('Error updating country'), error);
                        }
                    }
                } else {
                    console.error(chalk.red('Login failed'));
                    continue;
                }
            } catch (error) {
                console.error(chalk.red('Error during login'), error);
                continue;
            }

            // Claim Daily Reward
            try {
                const dailyRewardResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards");
                if (dailyRewardResponse.status === 200 && dailyRewardResponse.data.status === true) {
                    console.log(chalk.green('Daily reward fetched successfully'));
                    const pendingRewards = dailyRewardResponse.data.data.filter(reward => reward.status === 'pending' && reward.isActive);
                    for (const reward of pendingRewards) {
                        const claimRewardResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards/claim-rewards", {
                            rewardDay: reward.day
                        });
                        if (claimRewardResponse.status === 200 && claimRewardResponse.data.status === true) {
                            console.log(chalk.green(`Reward for day ${reward.day} claimed successfully`));
                        } else {
                            console.error(chalk.red(`Failed to claim reward for day ${reward.day}`));
                        }
                    }
                } else {
                    console.error(chalk.red('Failed to fetch daily rewards'));
                }
            } catch (error) {
                console.error(chalk.red('Error fetching daily rewards'), error);
            }

            // Submit Daily Quiz
            try {
                if (!quizReward) {
                    const dailyQuizResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards");
                    if (dailyQuizResponse.status === 200 && dailyQuizResponse.data.status === true) {
                        console.log(chalk.green('Daily quiz fetched successfully'));
                        const quiz = dailyQuizResponse.data.data.questions[0];
                        const submitAnswerData = {
                            questionId: quiz.questionId,
                            answer: quiz.answer,
                            currentTime: new Date().toISOString()
                        };
                        const submitAnswerResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards/submitAnswer", {
                            data: encryptData(JSON.stringify(submitAnswerData))
                        });
                        if (submitAnswerResponse.status === 200 && submitAnswerResponse.data.status === true) {
                            console.log(chalk.green('Quiz answer submitted successfully'));
                        } else {
                            console.error(chalk.red('Failed to submit quiz answer'),submitAnswerResponse.data.message);
                        }
                    } else {
                        console.error(chalk.red('Failed to fetch daily quiz'));
                    }
                }
          
            } catch (error) {
                console.error(chalk.red('Error fetching daily quiz'), errorMessage);
            }

            // Claim Daily Cipher
            try {
                if (!cipherRewarded) {
                    const claimCipherResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/click/claim-cipher-reward", {
                        data: encryptData(JSON.stringify({ currentTime: new Date().toISOString() }))
                    });
                    if (claimCipherResponse.status === 200 && claimCipherResponse.data.status === true) {
                        console.log(chalk.green('Daily cipher claimed successfully'));
                    } else {
                        console.error(chalk.red('Failed to claim daily cipher'));
                    }
                }
            } catch (error) {
                console.error(chalk.red('Error claiming daily cipher'), error);
            }

            // Get all social tasks
            try {
                const socialTasksResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/social-rewards");
                if (socialTasksResponse.status === 200 && socialTasksResponse.data.status === true) {
                    console.log(chalk.green('Social tasks fetched successfully'));
                    const socialTasks = socialTasksResponse.data.data.filter(task => !completedSocialTasks.includes(task.name));
                    console.log(chalk.green(`Filtered social tasks: ${socialTasks.length}`));
                    for (const task of socialTasks) {
                        try {
                            const claimTaskResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/social-rewards/claim-rewards", {
                                name: task.name,
                                currentTime: new Date().toISOString()
                            });
                            if (claimTaskResponse.status === 200 && claimTaskResponse.data.status === true) {
                                console.log(chalk.green(`Task ${task.name} claimed successfully`));
                            } else {
                                console.error(chalk.red(`Failed to claim task ${task.name}`));
                            }
                        } catch (error) {
                            console.error(chalk.red(`Error claiming task ${task.name}`), error);
                        }
                    }
                } else {
                    console.error(chalk.red('Failed to fetch social tasks'));
                }
            } catch (error) {
                console.error(chalk.red('Error fetching social tasks'), error);
            }
        }

        parentPort.postMessage('done');
    } catch (error) {
        console.error(chalk.red('Error in worker function:'), error);
        parentPort.postMessage('error');
    }
}

async function getProxyIP(proxy) {
    try {
        return await checkProxyIP(proxy);
    } catch (error) {
        console.error(chalk.red(`Error checking proxy IP: ${error.message}`));
        return 'Unknown';
    }
}

// Encrypt Data
function encryptData(data) {
    // The secret key (same as used in decryption)
    const secretKey = "H3SRVHe5HHJh2hvRxaeZrX7Ls2Vl1GNlJhdDhX7FEiLzhE2H7d3zilQH2J+3lHs0iBpqxOZCqi8rTHPGBAJ2Mw==";

    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();

    return encrypted;
}

// Decrypt Data
function decryptData(data) {
    // The secret key used for encryption (as in your original code)
    const secretKey = "H3SRVHe5HHJh2hvRxaeZrX7Ls2Vl1GNlJhdDhX7FEiLzhE2H7d3zilQH2J+3lHs0iBpqxOZCqi8rTHPGBAJ2Mw==";

    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(data, secretKey);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
}
// Start processing
main(workerData.queryIDs, workerData.proxies);