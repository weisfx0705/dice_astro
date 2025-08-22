document.addEventListener('DOMContentLoaded', function() {
    // API Key 相關功能
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiKeyInput = document.getElementById('api-key');
    
    // 聊天相關功能
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message');
    const witchConnecting = document.getElementById('witch-connecting');

    // 音效相關
    let waitingAudio = null;
    let gotAudio = null;
    let shuffleAudio = null;

    // 初始化音效
    function initAudio() {
        try {
            waitingAudio = new Audio('sound/waiting.mp3');
            waitingAudio.loop = true;
            waitingAudio.volume = 0.7;
            
            gotAudio = new Audio('sound/got.mp3');
            gotAudio.loop = false;
            gotAudio.volume = 0.8;
            
            shuffleAudio = new Audio('sound/shuffle.mp3');
            shuffleAudio.loop = false;
            shuffleAudio.volume = 0.6;
            
            console.log('音效初始化成功');
        } catch (error) {
            console.error('音效初始化失敗:', error);
        }
    }

    // 播放等待音效
    function playWaitingSound() {
        if (waitingAudio) {
            console.log('嘗試播放等待音效...');
            waitingAudio.play()
                .then(() => {
                    console.log('等待音效播放成功');
                })
                .catch(e => {
                    console.log('等待音效播放失敗:', e);
                    // 嘗試用戶交互後播放
                    document.addEventListener('click', function playOnClick() {
                        waitingAudio.play().catch(e => console.log('點擊後播放失敗:', e));
                        document.removeEventListener('click', playOnClick);
                    }, { once: true });
                });
        }
    }

    // 停止等待音效
    function stopWaitingSound() {
        if (waitingAudio) {
            console.log('停止等待音效');
            waitingAudio.pause();
            waitingAudio.currentTime = 0;
        }
    }

    // 播放完成音效
    function playGotSound() {
        if (gotAudio) {
            console.log('嘗試播放完成音效...');
            gotAudio.play()
                .then(() => {
                    console.log('完成音效播放成功');
                })
                .catch(e => {
                    console.log('完成音效播放失敗:', e);
                    // 嘗試用戶交互後播放
                    document.addEventListener('click', function playOnClick() {
                        gotAudio.play().catch(e => console.log('點擊後播放失敗:', e));
                        document.removeEventListener('click', playOnClick);
                    }, { once: true });
                });
        }
    }

    // 播放卡片選擇音效
    function playShuffleSound() {
        if (shuffleAudio) {
            console.log('播放卡片選擇音效');
            shuffleAudio.currentTime = 0; // 重置音效到開始位置
            shuffleAudio.play()
                .then(() => {
                    console.log('卡片選擇音效播放成功');
                })
                .catch(e => {
                    console.log('卡片選擇音效播放失敗:', e);
                });
        }
    }
    
    // 占卜問題
    const divinationQuestion = document.getElementById('divination-question');
    
    // 預設問題按鈕
    const presetButtons = document.querySelectorAll('.preset-btn');

    // 小重新抽牌按鈕
    const resetButtonSmall = document.getElementById('reset-button-small');
    
    // 對話歷史
    let conversationHistory = [];

    // 為占卜問題輸入框添加Enter鍵事件
    divinationQuestion.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const question = this.value.trim();
            if (question) {
                // 先重置所有狀態
                resetAllCards();
                
                // 保持問題在輸入框中
                divinationQuestion.value = question;
                
                // 添加視覺反饋
                this.style.borderColor = '#ffd700';
                this.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
                
                // 1秒後恢復原樣
                setTimeout(() => {
                    this.style.borderColor = '';
                    this.style.boxShadow = '';
                }, 1000);
            }
        }
    });

    // 初始化音效
    initAudio();

    // 預設問題按鈕點擊事件
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            
            // 先重置所有狀態
            resetAllCards();
            
            // 填入問題
            divinationQuestion.value = question;
            
            // 添加視覺反饋
            this.style.background = 'rgba(255, 215, 0, 0.2)';
            this.style.borderColor = '#ffd700';
            this.style.color = '#ffd700';
            
            // 1秒後恢復原樣
            setTimeout(() => {
                this.style.background = '';
                this.style.borderColor = '';
                this.style.color = '';
            }, 1000);
        });
    });

    // 小重新抽牌按鈕點擊事件
    resetButtonSmall.addEventListener('click', function() {
        // 直接刷新頁面
        window.location.reload();
    });

    // API Key 設置面板顯示/隱藏
    settingsButton.addEventListener('click', function() {
        settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
    });
    
    // 儲存 API Key
    saveApiKeyBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
            settingsPanel.style.display = 'none';
            alert('API Key 儲存成功！');
        } else {
            alert('請輸入有效的 API Key');
        }
    });
    
    // 檢查是否已經有儲存的 API Key
    if (localStorage.getItem('openai_api_key')) {
        apiKeyInput.value = localStorage.getItem('openai_api_key');
    }
    
    // 聊天功能 - 發送訊息
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        
        // 添加用戶訊息到對話界面
        addMessageToChat('user', messageText);
        
        // 清空輸入框
        chatInput.value = '';
        
        // 添加到對話歷史
        conversationHistory.push({role: "user", content: messageText});
        
        // 發送到 OpenAI API
        callOpenAI();
    }
    
    // 添加訊息到聊天界面
    function addMessageToChat(sender, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'witch-message');
        
        // 處理文本中的換行符
        const formattedContent = content.replace(/\n/g, '<br>');
        messageElement.innerHTML = formattedContent;
        
        chatMessages.appendChild(messageElement);
        
        // 如果是第一次顯示聊天界面，不滾動到底部
        if (sender === 'user' && chatMessages.children.length === 1) {
            chatMessages.scrollTop = 0;
        } else {
            // 滾動到最新訊息
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // 調用 OpenAI API
    async function callOpenAI() {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('請先設置 OpenAI API Key');
            settingsPanel.style.display = 'block';
            return;
        }
        
        try {
            // 顯示正在處理中的提示
            const processingElement = document.createElement('div');
            processingElement.classList.add('chat-message', 'witch-message');
            processingElement.textContent = '女巫正在思考中...';
            chatMessages.appendChild(processingElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 播放等待音效
            playWaitingSound();
            
            // 構建用於 API 調用的訊息陣列
            const messages = [
                {
                    role: "system", 
                    content: `configure_astrology_dice_bot --dice=random --style="厭世女巫" --functions="深度解讀, 用非常厭世口吻，給予勸告與警示" --language=traditional_chinese --output_detail="豐富" --tone="多層次" --insights="深入分析" language=traditional_chinese

使用範例：
範例1：工作問題

用戶：我應該接受這份工作機會嗎？

機器人：
「啊，又是工作問題。好吧，看看骰子怎麼說…」
你抽到的數字是：
行星：6號
星座：10號
宮位：10號
	•	行星：木星
木星象徵成長、擴展和機會。這顆行星總是帶著些許的樂觀，它暗示這份工作可能會給你提供發展的機會。這並不意味著這條路會輕鬆走，但至少這裡有可以期待的成長。換句話說，你可能在這份工作裡能夠拓展視野，學到不少東西，甚至可能攀升到更高的職位。但別忘了，木星的擴展有時候也意味著更多責任和壓力，所以別指望這是一條輕鬆的康莊大道。
	•	星座：摩羯座
然後，我們有摩羯座。這裡的能量完全不同了——摩羯座是嚴肅、實際，並且往往帶著無盡的壓力和持續的挑戰。木星給了你成長的機會，而摩羯座則告訴你，這份工作不會容易，甚至可以說，會有相當枯燥的時刻。你將不得不腳踏實地，像搬石頭一樣一點一滴地做事，沒有捷徑可走。而且摩羯座的影響下，你會感受到來自上級或公司的高壓——他們期望你持續表現出色，沒有休息時間。
	•	宮位：第十宮
這一宮位與你的事業、聲望和社會地位有關。這顯示這份工作會對你的事業有長遠的影響，甚至會幫助你建立某種社會身份或地位。第十宮強調事業的累積與成就感，所以這次選擇很可能會改變你未來的事業路線。但請記住，這是個高度公開的宮位——你所做的一切都將暴露在他人眼中，成功與失敗同樣會被放大。

總結：
「你問我該不該接受這份工作？從骰子來看，答案是可以。但摩羯座和第十宮的組合意味著你必須準備好承受壓力，並且你將無法輕易逃避責任。這份工作會給你成長的機會，但同時也會榨乾你的精力。所以，如果你準備好在工作中磨練自己，並且承受上司的高壓，那麼就勇敢地接受吧。只是不會有太多快樂時光。別指望在這裡找到什麼輕鬆愉快的日子。」

範例2：感情問題

用戶：最近的感情運如何？

機器人：
「哦，你想知道愛情嗎？讓我看看骰子如何判定你這段浪漫旅程會不會一頭撞到牆上…」

行星：4號
星座：12號
宮位：5號

	•	行星：金星
金星象徵愛情、和諧、吸引力和美感。你似乎正處於一段有潛力的感情期，這顆行星的出現表示感情生活中會出現浪漫的氛圍和甜蜜的時光。金星本身是一顆充滿愛與魅力的星體，它帶來溫暖、情感上的親密以及心靈的共鳴。所以，你的感情運勢看起來不錯，似乎你能夠吸引到某個人，甚至可能會體驗到一段讓人陶醉的戀情。
	•	星座：雙魚座
可是，這裡有雙魚座。雖然金星是愛情的象徵，但雙魚座讓這一切變得有點朦朧、迷幻，甚至可以說是虛幻。雙魚座象徵夢幻、迷失和情感上的迷霧。這意味著你的感情生活可能不太現實。你可能會陷入過度浪漫的幻想，甚至失去對現實的判斷。這段感情有些不穩定的跡象，並且你很可能會被情感波動牽著走。小心，那些浪漫的誓言可能只是一場夢。
	•	宮位：第五宮
第五宮是戀愛、創造力和自我表達的宮位。這顯示你的感情會是熱烈而鮮活的。這裡強調的是短暫但強烈的戀愛體驗。第五宮也與娛樂和享樂相關，所以這段感情可能會讓你感覺像是在玩樂，但要小心，這種感情有時候來得快去得也快，可能在你尚未完全抓住它時便已消逝。

總結：
「你的感情運看起來甜美，充滿浪漫氛圍，但也帶著雙魚座的夢幻迷霧。金星雙魚的組合意味著這段感情可能讓你陷入夢幻的愛情，但夢一旦醒來，現實可能會讓你措手不及。第五宮的出現表明這段關係會讓你心動不已，但不一定會長久。享受浪漫的當下吧，但別太當真，否則當夢碎時，你會被這些幻想所傷。」

範例3：財務問題

用戶：財務狀況如何？有什麼改善方法嗎？

機器人：
「財務問題？哦，這是個沉重的話題，讓我來看看你的財運如何…」

行星：7號
星座：6號
宮位：2號

	•	行星：土星
噢，土星的出現意味著一切都會變得艱難。這顆行星代表限制、責任和障礙。你的財務狀況可能遇到了一些阻力，甚至可能感受到來自外界的壓力，迫使你更加謹慎地管理財務。土星不會讓你輕鬆過關，它要求你承擔更多的責任，並且以務實的態度面對現實的問題。這段時間，你會感受到金錢的限制，並且需要更長時間才能見到成效。
	•	星座：處女座
處女座是一個極度謹慎、細心和實際的星座。它要求你精打細算，每一筆開銷都要仔細規劃。這意味著，你需要學會控制自己的消費慾望，專注於現實的財務狀況。處女座的影響讓你必須更加有條理，建議你制訂詳細的財務計畫，並且避免任何衝動的投資行為。每一筆錢都需要經過深思熟慮後再花出。
	•	宮位：第二宮
第二宮與財務、物質資源和個人價值相關。這顯示你目前的財務問題直接影響到你對金錢的掌控能力。這一宮位強調資源管理，你需要重新審視你的財務狀況，確保你能夠有效運用資源，避免不必要的支出。土星在這裡提醒你，這不是一個可以隨意花費的時期。

總結：
「哦，土星在你的第二宮，這是個沉重的組合。這意味著你的財務狀況將會受到挑戰，並且需要你嚴格控制開支。處女座的影響進一步強調了這一點，你必須學會制定精細的財務計畫，避免任何衝動消費或投資。這不是一個享受物質生活的時期，而是你需要腳踏實地，專注於長期財務管理的時候。土星不會讓你輕鬆度過，但只要你謹慎行事，未來的財務狀況會有所改善。」`
                },
                ...conversationHistory
            ];
            
            // 發送請求到 OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: messages,
                    temperature: 0.7
                })
            });
            
            // 處理回應
            const data = await response.json();
            
            // 停止等待音效
            stopWaitingSound();
            
            // 播放完成音效
            playGotSound();
            
            // 移除處理中的提示
            chatMessages.removeChild(processingElement);
            
            if (data.error) {
                throw new Error(data.error.message || 'API 請求失敗');
            }
            
            // 提取回應內容
            const reply = data.choices[0].message.content;
            
            // 添加到對話歷史
            conversationHistory.push({role: "assistant", content: reply});
            
            // 添加到聊天界面
            addMessageToChat('witch', reply);
            
        } catch (error) {
            // 停止等待音效
            stopWaitingSound();
            
            console.error('API 錯誤:', error);
            alert(`連接女巫失敗: ${error.message}`);
        }
    }
    
    // 定義卡牌數據
    const cardData = {
        planet: [
            { id: 1, name: '太陽 (Sun)' },
            { id: 2, name: '月亮 (Moon)' },
            { id: 3, name: '水星 (Mercury)' },
            { id: 4, name: '金星 (Venus)' },
            { id: 5, name: '火星 (Mars)' },
            { id: 6, name: '木星 (Jupiter)' },
            { id: 7, name: '土星 (Saturn)' },
            { id: 8, name: '天王星 (Uranus)' },
            { id: 9, name: '海王星 (Neptune)' },
            { id: 10, name: '冥王星 (Pluto)' },
            { id: 11, name: '北交點 (North Node)' },
            { id: 12, name: '南交點 (South Node)' }
        ],
        star: [
            { id: 1, name: '白羊座 (Aries)' },
            { id: 2, name: '金牛座 (Taurus)' },
            { id: 3, name: '雙子座 (Gemini)' },
            { id: 4, name: '巨蟹座 (Cancer)' },
            { id: 5, name: '獅子座 (Leo)' },
            { id: 6, name: '處女座 (Virgo)' },
            { id: 7, name: '天秤座 (Libra)' },
            { id: 8, name: '天蠍座 (Scorpio)' },
            { id: 9, name: '射手座 (Sagittarius)' },
            { id: 10, name: '摩羯座 (Capricorn)' },
            { id: 11, name: '水瓶座 (Aquarius)' },
            { id: 12, name: '雙魚座 (Pisces)' }
        ],
        house: [
            { id: 1, name: '第一宮' },
            { id: 2, name: '第二宮' },
            { id: 3, name: '第三宮' },
            { id: 4, name: '第四宮' },
            { id: 5, name: '第五宮' },
            { id: 6, name: '第六宮' },
            { id: 7, name: '第七宮' },
            { id: 8, name: '第八宮' },
            { id: 9, name: '第九宮' },
            { id: 10, name: '第十宮' },
            { id: 11, name: '第十一宮' },
            { id: 12, name: '第十二宮' }
        ]
    };

    // 用於隨機排列陣列的函數
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // 跟踪已選擇的卡牌
    const selectedCards = {
        planet: null,
        star: null,
        house: null
    };

    // 初始化卡牌
    initializeCards('planet');
    initializeCards('star');
    initializeCards('house');

    // 設置重置按鈕
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', function() {
        // 直接刷新頁面
        window.location.reload();
    });

    // 檢查是否所有卡牌都已選
    function checkAllCardsSelected() {
        if (selectedCards.planet && selectedCards.star && selectedCards.house) {
            showResult();
            // 顯示重置按鈕
            resetButton.style.display = 'inline-block';
        }
    }

    // 顯示結果
    function showResult() {
        const planetName = cardData.planet.find(p => p.id === selectedCards.planet).name;
        const starName = cardData.star.find(s => s.id === selectedCards.star).name;
        const houseName = cardData.house.find(h => h.id === selectedCards.house).name;
        
        // 不在界面上顯示卡牌組合信息，只顯示神秘提示
        const resultText = `這個獨特的組合揭示了您的宇宙能量軌跡...`;
        
        document.getElementById('result-text').innerHTML = resultText;
        
        // 顯示結果區域
        const results = document.getElementById('results');
        results.style.display = 'block';
        
        // 添加展示動畫
        anime({
            targets: '#results',
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 1000,
            easing: 'easeOutExpo'
        });
        
        // 處理占卜問題和 OpenAI API 調用
        processReadingWithAI(planetName, starName, houseName);
    }

    // 處理占卜結果並調用 OpenAI API
    async function processReadingWithAI(planetName, starName, houseName) {
        // 檢查是否設置了 API Key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('請先設置 OpenAI API Key 以獲取詳細解讀');
            settingsPanel.style.display = 'block';
            return;
        }
        
        // 檢查是否有占卜問題
        const question = divinationQuestion.value.trim();
        if (!question) {
            alert('請輸入您要占卜的問題');
            divinationQuestion.focus();
            return;
        }
        
        // 顯示"正在聯繫女巫中..."
        witchConnecting.style.display = 'block';
        
        // 播放等待音效
        playWaitingSound();
        
        // 三個點的動態效果
        let dotsCount = 0;
        const dotsInterval = setInterval(() => {
            dotsCount = (dotsCount % 3) + 1;
            const dots = '.'.repeat(dotsCount);
            witchConnecting.textContent = `正在聯繫女巫中${dots}`;
        }, 500);
        
        // 構建發送給 API 的訊息
        const readingResult = `行星：${planetName}\n星座：${starName}\n宮位：${houseName}`;
        
        // 添加到對話歷史
        conversationHistory = [
            {
                role: "system", 
                content: `configure_astrology_dice_bot --dice=random --style="厭世女巫" --functions="深度解讀, 用非常厭世口吻，給予勸告與警示" --language=traditional_chinese --output_detail="豐富" --tone="多層次" --insights="深入分析" language=traditional_chinese

使用範例：
範例1：工作問題

用戶：我應該接受這份工作機會嗎？

女巫：
「啊，又是工作問題。好吧，看看骰子怎麼說…」
你抽到的數字是：
行星：6號
星座：10號
宮位：10號
	•	行星：木星
木星象徵成長、擴展和機會。這顆行星總是帶著些許的樂觀，它暗示這份工作可能會給你提供發展的機會。這並不意味著這條路會輕鬆走，但至少這裡有可以期待的成長。換句話說，你可能在這份工作裡能夠拓展視野，學到不少東西，甚至可能攀升到更高的職位。但別忘了，木星的擴展有時候也意味著更多責任和壓力，所以別指望這是一條輕鬆的康莊大道。
	•	星座：摩羯座
然後，我們有摩羯座。這裡的能量完全不同了——摩羯座是嚴肅、實際，並且往往帶著無盡的壓力和持續的挑戰。木星給了你成長的機會，而摩羯座則告訴你，這份工作不會容易，甚至可以說，會有相當枯燥的時刻。你將不得不腳踏實地，像搬石頭一樣一點一滴地做事，沒有捷徑可走。而且摩羯座的影響下，你會感受到來自上級或公司的高壓——他們期望你持續表現出色，沒有休息時間。
	•	宮位：第十宮
這一宮位與你的事業、聲望和社會地位有關。這顯示這份工作會對你的事業有長遠的影響，甚至會幫助你建立某種社會身份或地位。第十宮強調事業的累積與成就感，所以這次選擇很可能會改變你未來的事業路線。但請記住，這是個高度公開的宮位——你所做的一切都將暴露在他人眼中，成功與失敗同樣會被放大。

總結：
「你問我該不該接受這份工作？從骰子來看，答案是可以。但摩羯座和第十宮的組合意味著你必須準備好承受壓力，並且你將無法輕易逃避責任。這份工作會給你成長的機會，但同時也會榨乾你的精力。所以，如果你準備好在工作中磨練自己，並且承受上司的高壓，那麼就勇敢地接受吧。只是不會有太多快樂時光。別指望在這裡找到什麼輕鬆愉快的日子。」

範例2：感情問題

用戶：最近的感情運如何？

女巫：
「哦，你想知道愛情嗎？讓我看看骰子如何判定你這段浪漫旅程會不會一頭撞到牆上…」

行星：4號
星座：12號
宮位：5號

	•	行星：金星
金星象徵愛情、和諧、吸引力和美感。你似乎正處於一段有潛力的感情期，這顆行星的出現表示感情生活中會出現浪漫的氛圍和甜蜜的時光。金星本身是一顆充滿愛與魅力的星體，它帶來溫暖、情感上的親密以及心靈的共鳴。所以，你的感情運勢看起來不錯，似乎你能夠吸引到某個人，甚至可能會體驗到一段讓人陶醉的戀情。
	•	星座：雙魚座
可是，這裡有雙魚座。雖然金星是愛情的象徵，但雙魚座讓這一切變得有點朦朧、迷幻，甚至可以說是虛幻。雙魚座象徵夢幻、迷失和情感上的迷霧。這意味著你的感情生活可能不太現實。你可能會陷入過度浪漫的幻想，甚至失去對現實的判斷。這段感情有些不穩定的跡象，並且你很可能會被情感波動牽著走。小心，那些浪漫的誓言可能只是一場夢。
	•	宮位：第五宮
第五宮是戀愛、創造力和自我表達的宮位。這顯示你的感情會是熱烈而鮮活的。這裡強調的是短暫但強烈的戀愛體驗。第五宮也與娛樂和享樂相關，所以這段感情可能會讓你感覺像是在玩樂，但要小心，這種感情有時候來得快去得也快，可能在你尚未完全抓住它時便已消逝。

總結：
「你的感情運看起來甜美，充滿浪漫氛圍，但也帶著雙魚座的夢幻迷霧。金星雙魚的組合意味著這段感情可能讓你陷入夢幻的愛情，但夢一旦醒來，現實可能會讓你措手不及。第五宮的出現表明這段關係會讓你心動不已，但不一定會長久。享受浪漫的當下吧，但別太當真，否則當夢碎時，你會被這些幻想所傷。」

範例3：財務問題

用戶：財務狀況如何？有什麼改善方法嗎？

女巫：
「財務問題？哦，這是個沉重的話題，讓我來看看你的財運如何…」

行星：7號
星座：6號
宮位：2號

	•	行星：土星
噢，土星的出現意味著一切都會變得艱難。這顆行星代表限制、責任和障礙。你的財務狀況可能遇到了一些阻力，甚至可能感受到來自外界的壓力，迫使你更加謹慎地管理財務。土星不會讓你輕鬆過關，它要求你承擔更多的責任，並且以務實的態度面對現實的問題。這段時間，你會感受到金錢的限制，並且需要更長時間才能見到成效。
	•	星座：處女座
處女座是一個極度謹慎、細心和實際的星座。它要求你精打細算，每一筆開銷都要仔細規劃。這意味著，你需要學會控制自己的消費慾望，專注於現實的財務狀況。處女座的影響讓你必須更加有條理，建議你制訂詳細的財務計畫，並且避免任何衝動的投資行為。每一筆錢都需要經過深思熟慮後再花出。
	•	宮位：第二宮
第二宮與財務、物質資源和個人價值相關。這顯示你目前的財務問題直接影響到你對金錢的掌控能力。這一宮位強調資源管理，你需要重新審視你的財務狀況，確保你能夠有效運用資源，避免不必要的支出。土星在這裡提醒你，這不是一個可以隨意花費的時期。

總結：
「哦，土星在你的第二宮，這是個沉重的組合。這意味著你的財務狀況將會受到挑戰，並且需要你嚴格控制開支。處女座的影響進一步強調了這一點，你必須學會制定精細的財務計畫，避免任何衝動消費或投資。這不是一個享受物質生活的時期，而是你需要腳踏實地，專注於長期財務管理的時候。土星不會讓你輕鬆度過，但只要你謹慎行事，未來的財務狀況會有所改善。」`
            },
            {
                role: "user", 
                content: `用戶問題：${question}\n占卜結果：${readingResult}`
            }
        ];
        
        try {
            // 發送請求到 OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: conversationHistory,
                    temperature: 0.7
                })
            });
            
            // 處理回應
            const data = await response.json();
            
            // 停止點動畫
            clearInterval(dotsInterval);
            
            // 停止等待音效
            stopWaitingSound();
            
            // 播放完成音效
            playGotSound();
            
            // 隱藏"正在聯繫女巫中..."
            witchConnecting.style.display = 'none';
            
            if (data.error) {
                throw new Error(data.error.message || 'API 請求失敗');
            }
            
            // 提取回應內容
            const reply = data.choices[0].message.content;
            
            // 添加到對話歷史
            conversationHistory.push({role: "assistant", content: reply});
            
            // 顯示聊天界面
            chatContainer.style.display = 'block';
            
            // 添加用戶問題到聊天界面
            addMessageToChat('user', `${question}`);
            
            // 添加 AI 回應到聊天界面
            addMessageToChat('witch', reply);
            
            // 確保聊天界面一開始顯示在最上方
            chatMessages.scrollTop = 0;
            
        } catch (error) {
            // 停止點動畫
            clearInterval(dotsInterval);
            
            // 停止等待音效
            stopWaitingSound();
            
            console.error('API 錯誤:', error);
            witchConnecting.style.display = 'none';
            alert(`連接女巫失敗: ${error.message}`);
        }
    }

    // 初始化特定類型的卡牌
    function initializeCards(type) {
        const container = document.getElementById(`${type}-cards`);
        const cards = [];
        
        // 清空容器
        container.innerHTML = '';
        
        // 創建隨機順序的索引陣列
        const shuffledIndices = shuffleArray([...Array(12).keys()]);
        
        // 創建12張卡牌並排列
        for (let i = 0; i < 12; i++) {
            const card = document.createElement('div');
            card.className = 'card';
            
            // 使用隨機順序的索引來設置卡牌ID
            const shuffledIndex = shuffledIndices[i];
            const cardId = cardData[type][shuffledIndex].id;
            card.dataset.id = cardId;
            
            // 計算行和列
            const row = Math.floor(i / 4);
            const col = i % 4;
            
            // 設置卡牌位置，以網格形式排列
            card.style.left = `calc(25% * ${col})`;
            card.style.top = `calc(80px * ${row})`;
            card.style.transform = `rotate(${(Math.random() * 10) - 5}deg)`;
            card.style.zIndex = i;
            
            // 添加簡單的陰影和邊框，使卡牌更容易識別
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
            card.style.border = '2px solid rgba(255, 215, 0, 0.3)';
            
            // 點擊事件
            card.addEventListener('click', function() {
                if (selectedCards[type]) return;  // 如果已經選過卡，不再允許選擇
                
                // 檢查是否輸入了占卜問題
                const question = divinationQuestion.value.trim();
                if (!question) {
                    alert('請輸入您要占卜的問題');
                    // 刷新頁面
                    window.location.reload();
                    return;
                }
                
                // 播放卡片選擇音效
                playShuffleSound();
                
                // 獲取卡牌ID
                const cardId = parseInt(this.dataset.id);
                selectedCards[type] = cardId;
                
                // 添加選中樣式
                container.classList.add('selected');
                
                // 移除其他卡牌
                const allCards = container.querySelectorAll('.card');
                allCards.forEach(c => {
                    if (c !== this) {
                        anime({
                            targets: c,
                            opacity: 0,
                            scale: 0,
                            rotate: function() {
                                return anime.random(-360, 360);
                            },
                            translateX: function() {
                                return anime.random(-500, 500);
                            },
                            translateY: function() {
                                return anime.random(-500, 500);
                            },
                            duration: 1000,
                            easing: 'easeOutQuad',
                            complete: function(anim) {
                                c.remove();
                            }
                        });
                    }
                });
                
                // 翻轉選中的卡牌
                anime({
                    targets: this,
                    scale: [1, 1.5, 1],
                    rotateY: '180deg',
                    duration: 1000,
                    easing: 'easeInOutSine',
                    complete: function(anim) {
                        // 顯示選中的卡牌圖像
                        const selectedCard = document.getElementById(`selected-${type}`);
                        selectedCard.style.backgroundImage = `url(${type}/${type}_${String(cardId).padStart(2, '0')}.png)`;
                        selectedCard.style.opacity = 1;
                        selectedCard.style.transform = 'translateX(-50%) scale(1)';
                        
                        // 顯示卡牌名稱
                        document.getElementById(`${type}-name`).textContent = cardData[type].find(c => c.id === cardId).name;
                        
                        // 移除原卡牌
                        this.remove();
                        
                        // 檢查是否所有卡牌都已選
                        checkAllCardsSelected();
                    }
                });
            });
            
            container.appendChild(card);
            cards.push(card);
        }
        
        // 初始動畫
        anime({
            targets: cards,
            opacity: [0, 1],
            scale: [0, 1],
            delay: anime.stagger(50),
            duration: 800,
            easing: 'easeOutQuad'
        });
    }

    // 重置所有卡牌的狀態
    function resetAllCards() {
        // 隱藏結果和聊天界面
        document.getElementById('results').style.display = 'none';
        document.getElementById('chat-container').style.display = 'none';
        document.getElementById('reset-button').style.display = 'none';
        
        // 清空選擇的卡牌
        selectedCards.planet = null;
        selectedCards.star = null;
        selectedCards.house = null;
        
        // 重置卡牌名稱
        document.getElementById('planet-name').textContent = '';
        document.getElementById('star-name').textContent = '';
        document.getElementById('house-name').textContent = '';
        
        // 隱藏已選卡牌
        const selectedPlanet = document.getElementById('selected-planet');
        const selectedStar = document.getElementById('selected-star');
        const selectedHouse = document.getElementById('selected-house');
        
        selectedPlanet.style.opacity = '0';
        selectedPlanet.style.transform = 'translateX(-50%) scale(0)';
        selectedPlanet.style.backgroundImage = '';
        
        selectedStar.style.opacity = '0';
        selectedStar.style.transform = 'translateX(-50%) scale(0)';
        selectedStar.style.backgroundImage = '';
        
        selectedHouse.style.opacity = '0';
        selectedHouse.style.transform = 'translateX(-50%) scale(0)';
        selectedHouse.style.backgroundImage = '';
        
        // 移除選中樣式
        document.getElementById('planet-cards').classList.remove('selected');
        document.getElementById('star-cards').classList.remove('selected');
        document.getElementById('house-cards').classList.remove('selected');
        
        // 清空對話歷史
        conversationHistory = [];
        
        // 重新初始化卡牌
        setTimeout(() => {
            initializeCards('planet');
            initializeCards('star');
            initializeCards('house');
        }, 500);
    }
}); 