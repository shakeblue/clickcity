const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');
const chalk = require('chalk');
const crypto = require('crypto');
const querystring = require('querystring');
const { profile } = require('console');


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

            // make login request
            fetch("https://prod-gamebackend-node.lufina.com/api/v2/user", {
                "headers": {
                  "accept": "*/*",
                  "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
                  "authorization": "tma user=%7B%22id%22%3A1628203242%2C%22first_name%22%3A%22Long%22%2C%22last_name%22%3A%22Ho%22%2C%22username%22%3A%22longht2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4055225154987014366&chat_type=sender&auth_date=1729608835&hash=41c86e3fc63aa64271819e8374f1e644765733480d9c6350eb54e39d9acf3c56",
                  "bypass-tunnel-reminder": "some_value",
                  "content-type": "application/json",
                  "priority": "u=1, i",
                  "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-site",
                  "cookie": "AWSALBTGCORS=QR3eySQn0bVdtrwlW4G4tTtLexH8lEpVD30xWq+ej9WOSgbFg2qJJM/4OESX39BBYJqXPY4hnej+U19xprC9/nePjoskPiom3VCJSPo3qVvqpNiEUS6gXo+rYwT4DkNscJWmlnJr6nYoeh+88ypQUD9llvsojIpOShayOAH6Nhpe",
                  "Referer": "https://prod-game.lufina.com/",
                  "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": "{\"currentTime\":\"2024-10-22T14:54:04.831Z\"}",
                "method": "POST"
              });

              // update country
              fetch("https://prod-gamebackend-node.lufina.com/api/v2/user/update", {
                "headers": {
                  "accept": "*/*",
                  "accept-language": "en-US,en;q=0.9",
                  "authorization": "tma user=%7B%22id%22%3A8018285856%2C%22first_name%22%3A%22Grady%20Borns%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22gradybornsjqosc557%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5639048843321592578&start_param=1628203242&auth_date=1729609943&hash=b76cb6fd14343fdbdec0ae535503315664cee8c9712a37b3e33787879cd823f6",
                  "bypass-tunnel-reminder": "some_value",
                  "content-type": "application/json",
                  "priority": "u=1, i",
                  "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-site",
                  "cookie": "AWSALBTGCORS=DEDxJz0F0BayOJ8yRj9mhSof8W8g3Jj88tIhyqhW0kxqM2+y1DAyCAup9UXlhbw1HEjjALdmlOsKr70ibV3UkwTE3zW7NHqYynTuH7OBs/khkaWhHVTJdYJ+amaK6CVwGiWxHhtkdQdR7fZoj/WiltlSClEYrj2WuFQWIg30/Scb",
                  "Referer": "https://prod-game.lufina.com/",
                  "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": "{\"country\":\"United States\"}",
                "method": "POST"
              });

              // if login response.status == 200 and response.data.status == 'true', log login success
              // get daily reward
              fetch("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards", {
                "headers": {
                  "accept": "*/*",
                  "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
                  "authorization": "tma user=%7B%22id%22%3A1628203242%2C%22first_name%22%3A%22Long%22%2C%22last_name%22%3A%22Ho%22%2C%22username%22%3A%22longht2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4055225154987014366&chat_type=sender&auth_date=1729608835&hash=41c86e3fc63aa64271819e8374f1e644765733480d9c6350eb54e39d9acf3c56",
                  "bypass-tunnel-reminder": "some_value",
                  "content-type": "application/json",
                  "priority": "u=1, i",
                  "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-site",
                  "cookie": "AWSALBTGCORS=KHKzR80GViZy+hgStZIBQVZmfIoEAdC56xxunR2ZDu/zqjKZ5zE56zghI0g2xWJhTMp3bZfPfcLpY3Al3BGwDvDJg7Mtj9lBzge4/0BxAcT9QZK+aFYv4odjhrUDdHaRlWB38HMt4G4OlCaZw9KE+FLs7imfa9mlCut4zPAX/i8v",
                  "Referer": "https://prod-game.lufina.com/",
                  "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": null,
                "method": "GET"
              });

                // if daily reward response.status == 200 and response.data.status == 'true', log daily reward success
                // get daily reward with pending status
                // pending reward = dailyReward.data.data.filter(reward => reward.status == 'pending' and reward.isActive == true) 
                // claim reward, rewardDay = reward.day
                fetch("https://prod-gamebackend-node.lufina.com/api/v2/daily-rewards/claim-rewards", {
                    "headers": {
                      "accept": "*/*",
                      "accept-language": "en-US,en;q=0.9",
                      "authorization": "tma user=%7B%22id%22%3A8018285856%2C%22first_name%22%3A%22Grady%20Borns%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22gradybornsjqosc557%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5639048843321592578&start_param=1628203242&auth_date=1729609943&hash=b76cb6fd14343fdbdec0ae535503315664cee8c9712a37b3e33787879cd823f6",
                      "bypass-tunnel-reminder": "some_value",
                      "content-type": "application/json",
                      "priority": "u=1, i",
                      "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": "\"Windows\"",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "cookie": "AWSALBTGCORS=4klWkFjbItMXO9RaQpmyNapfZ8E7DYXUmbFOt8bpD5U5e/AsbV3M3MCqFaXAkW4VB1VQNwDN4wQP7Iy72cYWTEPY9B7hPFGzcjjlC0Cv/rv0AOv44HPTmnX4ypwqxzReKE7zvWA4I1sOJVIftM3Hyam3YIonNpm96C9HOFSDvahQ",
                      "Referer": "https://prod-game.lufina.com/",
                      "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    "body": "{\"rewardDay\":1}",
                    "method": "POST"
                  });

                  // get daily quiz
                  fetch("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards", {
                    "headers": {
                      "accept": "*/*",
                      "accept-language": "en-US,en;q=0.9",
                      "authorization": "tma user=%7B%22id%22%3A8018285856%2C%22first_name%22%3A%22Grady%20Borns%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22gradybornsjqosc557%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5639048843321592578&start_param=1628203242&auth_date=1729609943&hash=b76cb6fd14343fdbdec0ae535503315664cee8c9712a37b3e33787879cd823f6",
                      "bypass-tunnel-reminder": "some_value",
                      "content-type": "application/json",
                      "priority": "u=1, i",
                      "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": "\"Windows\"",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "cookie": "AWSALBTGCORS=TH/4jxrjzgTI6bq91ArPyMJvhpVZutonSX77rwCcXxOcatnnSYdy4vjrUPE13WIdJ32fXr9SHBxSH9f2ArVwhV4kuiZp02Xf7Y99emG5dKB8Of83cJrXyOEu+pLl4CDf2gLLdUU7yXKZOtLkB3FJD0bLXaSVHvWBU44YiH6+M4EC",
                      "Referer": "https://prod-game.lufina.com/",
                      "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    "body": null,
                    "method": "GET"
                  });

                  // if daily quiz response.status == 200 and response.data.status == 'true', log daily quiz success
                  // quiz = response.data.data.questions[0]
                  // submit answer,
                //   const encryptData = (data2) => {
                //     return CryptoJS.AES.encrypt(
                //       data2,
                //       "H3SRVHe5HHJh2hvRxaeZrX7Ls2Vl1GNlJhdDhX7FEiLzhE2H7d3zilQH2J+3lHs0iBpqxOZCqi8rTHPGBAJ2Mw=="
                //     ).toString();
                //   }; 
                
                // const submitAnswerData = {
                //     questionId: quiz.questionId,
                //     answer: quiz.options.filter(option => quiz.answer == option.name),
                //     currentTime: new Date()
                //   };
                // data =  encryptData(JSON.stringify(submitAnswerData))
                  fetch("https://prod-gamebackend-node.lufina.com/api/v2/quiz-rewards/submitAnswer", {
                    "headers": {
                      "accept": "*/*",
                      "accept-language": "en-US,en;q=0.9",
                      "authorization": "tma user=%7B%22id%22%3A8018285856%2C%22first_name%22%3A%22Grady%20Borns%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22gradybornsjqosc557%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5639048843321592578&start_param=1628203242&auth_date=1729609943&hash=b76cb6fd14343fdbdec0ae535503315664cee8c9712a37b3e33787879cd823f6",
                      "bypass-tunnel-reminder": "some_value",
                      "content-type": "application/json",
                      "priority": "u=1, i",
                      "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": "\"Windows\"",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "cookie": "AWSALBTGCORS=26IZUu/u7sPFitJeDTkG5teBSCBH13xXmPc1JZrX7haeVVn8A3oZC3djn0V5CBq+ITfCLGEs9A57XwPMhga0Q5cuRTqwWAZzJ2d2pqX9jCGlI6DO4RiA31sikw7O5k81BB3EbBIg8BiFQLL4WJLMk9SeAGhEv9+fBx2ez1Zu0R1A",
                      "Referer": "https://prod-game.lufina.com/",
                      "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    "body": "{\"data\":\"U2FsdGVkX1+0Wp+i971qJxNzsv1dxUYY7HRJFm/Y9JkCvKvcnv9ZLKPN174Ax3pVNY5bmPbMI4rHKCzGJfz71K/E//3mQ+e60eycynKsNvTncrcPvi4A8zD5/Jf7wzs+XoKjq0KxnDj6QsD5I1s5/bM5QJdz4ZSTod0XYC7CD17hi99JmkHMFgsyHQvJ2h40Fxhy2D1DpD+RQD7vLaEjzuc50iigfp2YE6G2O87JIdw=\"}",
                    "method": "POST"
                  });

                    // if submit answer response.status == 200 and response.data.status == 'true', log submit answer success
                    // claim daily cipher
                    // let bodyObject = {
                    //     currentTime: new Date()
                    //   };
                    //   mutateClaimCipherReward({
                    //     data: encryptData(JSON.stringify(bodyObject))
                    //   });
                    // try {
                    //     const result2 = await apiClient.post(`api/v2/click/claim-cipher-reward`, {
                    //         data: encryptData(JSON.stringify(bodyObject))
                    //     });
                    //     return result2;
                    //   } catch (error) {
                    //     return Promise.reject(error);
                    //   }
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


// Start processing
main(workerData.queryIDs, workerData.proxies);