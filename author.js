// author.js
const chalk = require('chalk');
const figlet = require('figlet');

function displayAuthorInfo() {
    console.log(chalk.yellow(figlet.textSync('Tool by Long Ho', { horizontalLayout: 'full' })));
    console.log(chalk.blue('Tool được phát triển bởi Long Ho, nhằm mục đích hỗ trợ cộng đồng Airdrop Viet Nam.'));
    console.log(chalk.green('Tele: ') + chalk.cyan.underline('https://t.me/longht2010'));
    console.log(chalk.green('Zalo: ') + chalk.cyan.underline('0989320735'));
    console.log(chalk.green('====================================================================================='));
}

module.exports = displayAuthorInfo;