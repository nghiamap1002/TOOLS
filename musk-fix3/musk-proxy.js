const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { GetApiHash, GetHashByTime } = require('./muskgethash');

let apiHash = '';

class MuskEmpireAPI {
    headers(apiKey, apiTime, apiHash) {
        return {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "Api-Hash": apiHash,
            "Api-Time": apiTime,
            "Origin": "https://game.muskempire.io",
            "Referer": "https://game.muskempire.io/",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        };
    }

    async auth(initData, proxy) {
        const url = "https://api.muskempire.io/telegram/auth";
        const chatInstanceMatch = initData.match(/chat_instance=([^&]*)/);
        const chatInstance = chatInstanceMatch ? chatInstanceMatch[1] : '';

        const payload = {
            data: {
                initData: initData,
                platform: "android",
                chatId: ""
            }
        };

        const agent = new HttpsProxyAgent(proxy);
        const myHeader = GetApiHash(initData);
        const temp = myHeader.headers;
        apiHash = temp['Api-Hash']
        const response = await axios.post(url, payload, {
            headers: myHeader.headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async getUserData(apiKey, proxy) {
        const url = "https://api.muskempire.io/user/data/all";
        const payload = { data: {} };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async claimDailyReward(apiKey, rewardId, proxy) {
        const url = "https://api.muskempire.io/quests/daily/claim";
        const payload = { data: rewardId };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async getDB(apiKey, proxy) {
        const url = "https://api.muskempire.io/dbs";
        const payload = { data: { dbs: ["all"] } };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async improveSkill(apiKey, skillKey, proxy) {
        const url = "https://api.muskempire.io/skills/improve";
        const payload = { data: skillKey };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async guiTap(apiKey, amount, currentEnergy, proxy) {
        const url = "https://api.muskempire.io/hero/action/tap";
        const seconds = Math.floor(Math.random() * (900 - 500 + 1)) + 500;
        const payload = {
            data: {
                data: {
                    task: {
                        amount: amount,
                        currentEnergy: currentEnergy
                    }
                },
                seconds: seconds
            }
        };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async pvpFight(apiKey, level, balance, proxy) {
        const url = "https://api.muskempire.io/pvp/fight";
        const strategies = ['aggressive', 'flexible', 'protective'];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
//      const strategy = "protective";
        let league;

        if (level >= 13 && balance >= 100000000) {
            league = 'diamond';
        }
        else if (level >= 10 && balance >= 10000000) {
            league = 'platinum';
        }
        else if (level >= 8 && balance >= 1000000) {
            league = 'gold';
        }
        else if (level > 4 && balance >= 100000) {
            league = 'silver';
        }
        else if (level <= 4 && balance >= 10000) {
            league = 'bronze';
        }
        else {
            return "Không đủ điều kiện tham gia bất kỳ giải đấu nào.";
        }

        const payload = {
            data: {
                league: league,
                strategy: strategy
            }
        };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async claimFightReward(apiKey, proxy) {
        const url = "https://api.muskempire.io/pvp/claim";
        const payload = { data: {} };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.post(url, payload, {
            headers,
            httpsAgent: agent
        });
        return response.data;
    }

    async checkProxyIP(proxy) {
        try {
            const proxyAgent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpsAgent: proxyAgent
            });
            if (response.status === 200) {
                return response.data.ip;
            } else {
                throw new Error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error khi kiểm tra IP của proxy: ${error.message}`);
        }
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }));
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const proxyFile = path.join(__dirname, 'proxy.txt');
        const initDataList = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
        const proxyList = fs.readFileSync(proxyFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        if (initDataList.length !== proxyList.length) {
            console.error('Số lượng proxy không khớp với số lượng dữ liệu!');
            process.exit(1);
        }

        console.log('Tool được chia sẻ miễn phí tại kênh telegram Dân Cày Airdrop @dancayairdrop !');
        const nangcap = await this.askQuestion('Bạn có muốn nâng cấp kỹ năng không? (y/n): ');
        const hoinangcap = nangcap.toLowerCase() === 'y';
        const pvp = await this.askQuestion('Bạn có muốn chơi đàm phán không? (y/n): ');
        const hoipvp = pvp.toLowerCase() === 'y';

        while (true) {
            for (let no = 0; no < initDataList.length; no++) {
                const initData = initDataList[no];
                const proxy = proxyList[no];
                try {
                    const authResponse = await this.auth(initData, proxy);
                    if (authResponse.success) {
                        const apiKey = initData.match(/hash=([^&]*)/)[1];
                        
                        await this.processUserData(apiKey, no, proxy);
                        await this.processDailyRewards(apiKey, proxy);
                        await this.processGuiTap(apiKey, proxy);
                        if (hoipvp) {
                            await this.processPvP(apiKey, proxy);
                        }
                        if (hoinangcap) {
                            await this.processSkillUpgrade(apiKey, proxy);
                        }
                    } else {
                        console.log(`Đăng nhập thất bại cho tài khoản ${no + 1}!`);
                    }
                } catch (error) {
                    this.log(`Lỗi khi xử lý tài khoản ${no + 1}: ${error.message}`);
                }
            }
            await this.waitWithCountdown(Math.floor(60));
        }
    }

    async processUserData(apiKey, accountNumber, proxy) {
        try {
            const userData = await this.getUserData(apiKey, proxy);
            const heroData = userData.data.hero;
            const firstName = userData.data.profile.firstName;
            console.log(`========== Tài khoản ${accountNumber + 1} | ${firstName} | ip: ${await this.checkProxyIP(proxy)} ==========`);
            this.log(`Balance: ${heroData.money}`);
            this.log(`Lợi nhuận mỗi giờ: ${heroData.moneyPerHour}`);
            this.log(`Level: ${heroData.level}`);
            this.log(`EXP: ${heroData.exp}`);
            this.log(`Energy: ${heroData.earns.task.energy}`);
            this.log(`PvP Wins: ${heroData.pvpWin}`);
            this.log(`PvP Losses: ${heroData.pvpLose}`);
        } catch (error) {
            this.log(`Lỗi khi lấy dữ liệu người dùng cho tài khoản ${accountNumber + 1}: ${error.message}`);
        }
    }

    async processDailyRewards(apiKey, proxy) {
        try {
            const userData = await this.getUserData(apiKey, proxy);
            const lastIndex = userData.data.hero.dailyRewardLastIndex;
            const nextRewardId = lastIndex + 1;
            try {
                const claimResponse = await this.claimDailyReward(apiKey, nextRewardId, proxy);
                if (claimResponse.success) {
                    this.log(`Điểm danh thành công ngày ${nextRewardId}`);
                } else {
                    this.log(`Điểm danh thất bại ngày ${nextRewardId}`);
                }
            } catch (error) {
                this.log(`Lỗi khi điểm danh ngày ${nextRewardId}: ${error.message}`);
            }
    
        } catch (error) {
            this.log(`Lỗi khi xử lý phần thưởng hàng ngày: ${error.message}`);
        }
    }    

    async processGuiTap(apiKey, proxy) {
        try {
            const userData = await this.getUserData(apiKey, proxy);
            const energy = userData.data.hero.earns.task.energy;
            const actionResponse = await this.guiTap(apiKey, energy, 0, proxy);
            if (actionResponse.success) {
                this.log('Tap thành công!');
                const heroData = actionResponse.data.hero;
                this.log(`Balance: ${heroData.money}`);
            } else {
                this.log('Tap thất bại!');
            }
        } catch (error) {
            this.log(`Lỗi khi thực hiện tap: ${error.message}`);
        }
    }

    async processSkillUpgrade(apiKey, proxy) {
        try {
            const dbSkillsResponse = await this.getDB(apiKey, proxy);
            if (dbSkillsResponse.success) {
                const userData = await this.getUserData(apiKey, proxy);
                let money = userData.data.hero.money;
                for (const skill of dbSkillsResponse.data.dbSkills) {
                    while (money > skill.priceBasic) {
                        try {
                            const improveResponse = await this.improveSkill(apiKey, skill.key, proxy);
                            if (improveResponse.success) {
                                this.log(`Nâng cấp kỹ năng ${skill.title} thành công!`);
                                money = improveResponse.data.hero.money;
                            } else {
                                this.log(`Nâng cấp kỹ năng ${skill.title} thất bại!`);
                                break;
                            }
                        } catch (error) {
                            this.log(`Lỗi khi nâng cấp kỹ năng ${skill.title}: ${error.message}`);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            this.log(`Lỗi khi nâng cấp kỹ năng: ${error.message}`);
        }
    }

    async processPvP(apiKey, proxy) {
        try {
            const userData = await this.getUserData(apiKey, proxy);
            const { level } = userData.data.hero;
            const money = userData.data.hero.money;
            const id = userData.data.profile.id;

            for (let i = 0; i < 5; i++) {
                try {
                    const fightResponse = await this.pvpFight(apiKey, level, money, proxy);
                    if (fightResponse.success) {
                        const fightData = fightResponse.data.fight;
                        this.log(`Bắt đầu đàm phán lần (${i + 1}): League: ${fightData.league}, Chiến lược: ${fightData.player2Strategy}, Hợp đồng: ${fightData.moneyContract}, Tiền lãi: ${fightData.moneyProfit}`);
                        if (fightData.winner === id) {
                            this.log('Win! Yêu cầu phần thưởng...');
                        } else {
                            this.log('Thua mẹ rồi!');
                        }
                        try {
                            const claimResponse = await this.claimFightReward(apiKey, proxy);
                            if (claimResponse.success) {
                                const claimData = claimResponse.data.fight;
                                const claimData2 = claimResponse.data.hero;
                                this.log(`Reward Claimed: Hợp đồng: ${claimData.moneyContract}, Tiền lãi: ${claimData.moneyProfit}, Balance: ${claimData2.money}`);
                            } else {
                                this.log('Claim Failed');
                            }
                        } catch (error) {
                            this.log(`Lỗi khi yêu cầu phần thưởng PvP: ${error.message}`);
                        }
                    } else {
                        this.log('Không đủ điều kiện cho bất kì cuộc đàm phán nào!');
                    }
                } catch (error) {
                    this.log(`Lỗi khi thực hiện PvP lần ${i + 1}: ${error.message}`);
                }
            }
        } catch (error) {
            this.log(`Lỗi khi thực hiện PvP: ${error.message}`);
        }
    }
}

if (require.main === module) {
    const muskEmpireAPI = new MuskEmpireAPI();
    muskEmpireAPI.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}