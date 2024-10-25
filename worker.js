const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');
const chalk = require('chalk');
const crypto = require('crypto');
const querystring = require('querystring');
const CryptoJS = require('crypto-js');
const moment = require('moment-timezone');
let userName = 'Unknown User'; // Default value, will be updated in main function
let workerIndex = '1';
let userIndex = 1;

function log(message, level = 'info') {
    const currentTime = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
    const formattedMessage = `[${chalk.white(currentTime)}] [${chalk.white(`Luồng ${workerIndex}`)}] [${chalk.yellow(`User ${userIndex}`)}] [${chalk.yellow(userName)}] ${message}`;
    if (level === 'info') {
        console.log(chalk.green(formattedMessage));
    } else if (level === 'error') {
        console.error(chalk.red(formattedMessage));
    }
}

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
        throw new Error(`Không thể kiểm tra IP proxy: ${error.message}`);
    }
}

// Get Proxy IP
async function getProxyIP(proxy) {
    try {
        return await checkProxyIP(proxy);
    } catch (error) {
        log(`Lỗi khi kiểm tra IP proxy: ${error.message}`, 'error');
        return 'Không xác định';
    }
}

// Encrypt Data
function encryptData(data) {
    const secretKey = "H3SRVHe5HHJh2hvRxaeZrX7Ls2Vl1GNlJhdDhX7FEiLzhE2H7d3zilQH2J+3lHs0iBpqxOZCqi8rTHPGBAJ2Mw==";
    return CryptoJS.AES.encrypt(data, secretKey).toString();
}

// Decrypt Data
function decryptData(data) {
    const secretKey = "H3SRVHe5HHJh2hvRxaeZrX7Ls2Vl1GNlJhdDhX7FEiLzhE2H7d3zilQH2J+3lHs0iBpqxOZCqi8rTHPGBAJ2Mw==";
    const decryptedBytes = CryptoJS.AES.decrypt(data, secretKey);
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
}

// Handle Login
async function handleLogin(axiosInstance) {
    try {
        const response = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/user", {
            currentTime: new Date().toISOString()
        });
        if (response.status === 200 && response.data.status === true) {
            log('Đăng nhập thành công');
            return response.data.data.user;
        } else {
            log('Đăng nhập thất bại', 'error');
            return null;
        }
    } catch (error) {
        log('Lỗi trong quá trình đăng nhập', 'error');
        log(error, 'error');
        return null;
    }
}

// Update Country
async function updateCountry(axiosInstance) {
    try {
        const response = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/user/update", {
            country: "United States"
        });
        if (response.status === 200 && response.data.status === true) {
            log('Cập nhật quốc gia thành công');
        } else {
            log('Cập nhật quốc gia thất bại', 'error');
        }
    } catch (error) {
        log('Lỗi khi cập nhật quốc gia', 'error');
        log(error, 'error');
    }
}

// Claim Daily Reward
async function claimDailyReward(axiosInstance) {
    try {
        const response = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards");
        if (response.status === 200 && response.data.status === true) {
            log('Lấy phần thưởng hàng ngày thành công');
            const pendingRewards = response.data.data.filter(reward => reward.status === 'PENDING' && reward.isActive);
            for (const reward of pendingRewards) {
                const claimResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards/claim-rewards", {
                    rewardDay: reward.day
                });
                if (claimResponse.status === 200 && claimResponse.data.status === true) {
                    log(`Phần thưởng cho ngày ${reward.day} đã được nhận thành công`);
                } else {
                    log(`Không thể nhận phần thưởng cho ngày ${reward.day}`, 'error');
                }
            }
        } else {
            log('Không thể lấy phần thưởng hàng ngày', 'error');
        }
    } catch (error) {
        log('Lỗi khi lấy phần thưởng hàng ngày', 'error');
        log(error, 'error');
    }
}

// Submit Daily Quiz
async function submitDailyQuiz(axiosInstance, quizReward) {
    if (quizReward) return;

    try {
        const response = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards");
        if (response.status === 200 && response.data.status === true) {
            log('Lấy câu đố hàng ngày thành công');
            const quiz = response.data.data.questions[0];
            const submitAnswerData = {
                questionId: quiz.questionId,
                answer: quiz.answer,
                currentTime: new Date().toISOString()
            };
            const submitResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards/submitAnswer", {
                data: encryptData(JSON.stringify(submitAnswerData))
            });
            if (submitResponse.status === 200 && submitResponse.data.status === true) {
                log('Gửi câu trả lời câu đố thành công');
            } else {
                log('Không thể gửi câu trả lời câu đố', 'error');
                log(submitResponse.data.message, 'error');
            }
        } else {
            log('Không thể lấy câu đố hàng ngày', 'error');
        }
    } catch (error) {
        log('Lỗi khi lấy câu đố hàng ngày', 'error');
        log(error, 'error');
    }
}

// Claim Daily Cipher
async function claimDailyCipher(axiosInstance, cipherRewarded) {
    if (cipherRewarded) return;

    try {
        const response = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/click/claim-cipher-reward", {
            data: encryptData(JSON.stringify({ currentTime: new Date().toISOString() }))
        });
        if (response.status === 200 && response.data.status === true) {
            log('Nhận phần thưởng cipher hàng ngày thành công');
        } else {
            log('Không thể nhận phần thưởng cipher hàng ngày', 'error');
        }
    } catch (error) {
        log('Lỗi khi nhận phần thưởng cipher hàng ngày', 'error');
        log(error, 'error');
    }
}

// Get and Claim Social Tasks
async function handleSocialTasks(axiosInstance, completedSocialTasks) {
    try {
        const response = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/social-rewards");
        if (response.status === 200 && response.data.status === true) {
            log('Lấy nhiệm vụ xã hội thành công');
            const socialTasks = response.data.data.filter(task => !completedSocialTasks.includes(task.name));
            log(`Lọc nhiệm vụ xã hội: ${socialTasks.length}`);
            for (const task of socialTasks) {
                try {
                    const claimResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/social-rewards/claim-rewards", {
                        name: task.name,
                        currentTime: new Date().toISOString()
                    });
                    if (claimResponse.status === 200 && claimResponse.data.status === true) {
                        log(`Nhiệm vụ ${task.name} đã được nhận thành công`);
                    } else {
                        log(`Không thể nhận nhiệm vụ ${task.name}`, 'error');
                    }
                } catch (error) {
                    log(`Lỗi khi nhận nhiệm vụ ${task.name}`, 'error');
                    log(error, 'error');
                }
            }
        } else {
            log('Không thể lấy nhiệm vụ xã hội', 'error');
        }
    } catch (error) {
        log('Lỗi khi lấy nhiệm vụ xã hội', 'error');
        log(error, 'error');
    }
}

// Save Clicks
async function saveClicks(axiosInstance, boostDetail) {
    try {
        const transactionClicks = boostDetail.availableBoost || Math.floor(Math.random() * 201) + 300;
        const clickGap = Math.random() < 0.5 ? transactionClicks * 0.5 : transactionClicks * 0.33;
        const clickData = {
            clicks: transactionClicks,
            clickGap: Math.floor(clickGap),
            currentTime: new Date().toISOString()
        };
        const response = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/click/save-clicks", {
            data: encryptData(JSON.stringify(clickData))
        });
        if (response.status === 200 && response.data.status === true) {
            log(`Lưu clicks thành công, tổng số clicks: ${transactionClicks}`);
        } else {
            log('Không thể lưu clicks', 'error');
        }
    } catch (error) {
        log('Lỗi khi lưu clicks', 'error');
        log(error, 'error');
    }
}

// Purchase Cards
async function purchaseCards(axiosInstance) {
    try {
        const user = await handleLogin(axiosInstance);
        totalBricks = user.totalBricks;
        // Get mining cards
        const response = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/mining-card/get-mining-card");
        if (response.status === 200 && response.data.status === true) {
            log('Lấy thẻ khai thác thành công');
            const cards = response.data.data;

            // Filter cards
            const filteredCards = cards.filter(card =>
                card.type === 'cash' &&
                card.status === 'active' &&
                !card.unlockCriteria
            );

            // Get current level of each card
            filteredCards.forEach(card => {
                card.currentLevel = card.purchases && card.purchases.purchasedLevel ? card.purchases.purchasedLevel : 0;
            });

            // Filter out cards that have reached max levels
            const availableCards = filteredCards.filter(card => card.currentLevel < card.maxLevels);

            // Get next level details for each card
            availableCards.forEach(card => {
                const nextCartLevelKey = card.currentLevel;
                card.nextCartLevel = card.levels[nextCartLevelKey];
            });

            // Sort cards by economic value (less price but more profitIncrease)
            availableCards.sort((a, b) => (a.nextCartLevel.price / a.nextCartLevel.profitIncrease) - (b.nextCartLevel.price / b.nextCartLevel.profitIncrease));

            // Select top cards purchasable by totalBricks
            const purchasableCards = [];
            let remainingBricks = totalBricks;
            for (const card of availableCards) {
                if (remainingBricks >= card.nextCartLevel.price) {
                    purchasableCards.push(card);
                    remainingBricks -= card.nextCartLevel.price;
                }
            }
            //if purchasableCards is empty, log no cards to purchase and return
            if (purchasableCards.length === 0) {
                log('Không có thẻ nào để mua');
                return true;
            }
            // Purchase selected cards
            for (const card of purchasableCards) {
                try {
                    // wait for 2 seconds before purchasing the next card
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    let bodyObject = {
                        currentTime: new Date().toISOString(),
                        cardId: card._id
                    };
                    const purchaseResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/mining-card/purchase", {
                        data: encryptData(JSON.stringify(bodyObject))
                    });
                    if (purchaseResponse.status === 200 && purchaseResponse.data.status === true) {
                        log(`Thẻ ${card._id} đã được mua thành công`);
                    } else {
                        log(`Không thể mua thẻ ${card._id}`, 'error');
                    }
                } catch (error) {
                    log(`Lỗi khi mua thẻ ${card._id}`, 'error');
                    log(error, 'error');
                }
            }
        } else {
            log('Không thể lấy thẻ khai thác', 'error');
        }
        return true;
    } catch (error) {
        log(`Lỗi khi lấy thẻ khai thác`, 'error');
        log(error, 'error');
    }
}

async function upgradeRankLevel(axiosInstance, userData) {
    try {
        const coins = userData.cashBalance;
        const levelMinPoints = [
            0,
            20000,
            100000,
            500000,
            1000000,
            10000000,
            50000000,
            100000000,
            500000000,
            2000000000
        ]
        const getLevelIndex = (coins) => {
            for (let i = 0; i < levelMinPoints.length; i++) {
                if (coins >= levelMinPoints[i]) {
                    if (i === levelMinPoints.length - 1 || coins < levelMinPoints[i + 1]) {
                        return i;
                    }
                }
            }
            return 0;
        };

        const rankLevelByCashBalance = getLevelIndex(userData.cashBalance);
        if (rankLevelByCashBalance !== userData.rankLevel) {
            const rankLevelResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/user/update-rank-level", {
                currentTime: new Date().toISOString()
            });
            if (rankLevelResponse.status === 200 && rankLevelResponse.data.status === true) {
                log('Nâng cấp cấp bậc thành công');
            } else {
                log('Không thể nâng cấp cấp bậc', 'error');
            }
        }
    } catch (error) {
        log('Lỗi khi nâng cấp cấp bậc', 'error');
        log(error, 'error');
    }
}

async function claimAcademyRewards(axiosInstance) {
    // Claim academy rewards
    try {
        const academyRewardsResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/academy-rewards");
        if (academyRewardsResponse.status === 200 && academyRewardsResponse.data.status === true) {
            log('Lấy phần thưởng học viện thành công');
            const unclaimedRewards = academyRewardsResponse.data.data.filter(reward => !reward.isClaimedRewards);
            for (const reward of unclaimedRewards) {
                try {
                    const claimAcademyRewardResponse = await axiosInstance.post("https://prod-gamebackend-node.lufina.com/api/v2/academy-rewards/claim-rewards", {
                        academyRewardsId: reward._id,
                        currentTime: new Date().toISOString()
                    });
                    if (claimAcademyRewardResponse.status === 200 && claimAcademyRewardResponse.data.status === true) {
                        log('Phần thưởng học viện đã được nhận thành công');
                    } else {
                        log('Không thể nhận phần thưởng học viện', 'error');
                    }
                } catch (error) {
                    log('Lỗi khi nhận phần thưởng học viện', 'error');
                    log(error, 'error');
                }
            }
        } else {
            log('Không thể lấy phần thưởng học viện', 'error');
        }
    } catch (error) {
        log('Lỗi khi lấy hoặc nhận phần thưởng học viện', 'error');
        log(error, 'error');
    }
}

async function seenStory(axiosInstance, hasSeenStory) {
    // Seen Story
    if (!hasSeenStory) {
        try {
            const seenStoryResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/user/seen-story");
            if (seenStoryResponse.status === 200 && seenStoryResponse.data.status === true) {
                log('Cập nhật đã xem story thành công');
            } else {
                log('Không thể cập nhật đã xem story', 'error');
            }
        } catch (error) {
            log('Lỗi khi cập nhật đã xem story', 'error');
            log(error, 'error');
        }
    }
}

async function seenTip(axiosInstance, hasSeenTip) {
    // Seen Tips
    if (!hasSeenTip) {
        try {
            const seenTipsResponse = await axiosInstance.get("https://prod-gamebackend-node.lufina.com/api/v2/user/seen-tips");
            if (seenTipsResponse.status === 200 && seenTipsResponse.data.status === true) {
                log('Cập nhật đã xem tips thành công');
            } else {
                log('Không thể cập nhật đã xem tips', 'error');
            }
        } catch (error) {
            log('Lỗi khi cập nhật đã xem tips', 'error');
            log(error, 'error');
        }
    }
}


// Main Function
async function main(queryIDs, proxies, workerKey) {
    try {
        for (let i = 0; i < queryIDs.length; i++) {
            const queryid = queryIDs[i];
            const proxy = proxies[i % proxies.length];
            userIndex = i + 1;
            workerIndex = workerKey;
            try {
                const parsedQuery = querystring.parse(queryid);
                const user = JSON.parse(decodeURIComponent(parsedQuery.user));
                userName = `${user.first_name} ${user.last_name}`.trim();
            } catch (decodeError) {
                log(`Error decoding query ID: ${queryid}`, 'error');
                log(decodeError, 'error');
                continue;
            }

            const proxyIP = await getProxyIP(proxy);
            log(`Proxy IP: ${proxyIP}`);

            const axiosInstance = createAxiosInstance(proxy, queryid);
            const user = await handleLogin(axiosInstance);
            if (!user) continue;

            const { socialMediaRewards, quizRewarded, cipherRewarded, country, boostDetail, hasSeenStory, hasSeenTip } = user;
            const completedSocialTasks = socialMediaRewards ? Object.keys(socialMediaRewards) : [];

            if (!country) await updateCountry(axiosInstance);
            await seenStory(axiosInstance, hasSeenStory);
            await seenTip(axiosInstance, hasSeenTip);
            await upgradeRankLevel(axiosInstance, user);
            await claimDailyReward(axiosInstance);
            await submitDailyQuiz(axiosInstance, quizRewarded);
            await claimDailyCipher(axiosInstance, cipherRewarded);
            await claimAcademyRewards(axiosInstance);
            await handleSocialTasks(axiosInstance, completedSocialTasks);
            await saveClicks(axiosInstance, boostDetail);
            await purchaseCards(axiosInstance);
        }
        parentPort.postMessage('done');
    } catch (error) {
        log('Lỗi trong hàm worker:', 'error');
        log(error, 'error');
    }
}

// Start processing
main(workerData.queryIDs, workerData.proxies, workerData.workerKey);