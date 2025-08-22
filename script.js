document.addEventListener('DOMContentLoaded', function() {
    // 頁面管理
    let currentPage = 1;
    const totalPages = 6;
    
    // 頁面切換函數
    function showPage(pageNumber) {
        // 隱藏所有頁面
        for (let i = 1; i <= totalPages; i++) {
            const page = document.getElementById(`page-${i}`);
            if (page) {
                page.classList.remove('active');
            }
        }
        
        // 顯示指定頁面
        const targetPage = document.getElementById(`page-${pageNumber}`);
        if (targetPage) {
            targetPage.classList.add('active');
            currentPage = pageNumber;
        }
        
        // 更新頁面顯示的問題和已選卡牌
        updatePageContent();
    }
    
    // 更新頁面內容
    function updatePageContent() {
        const question = document.getElementById('divination-question').value.trim();
        
        // 更新各頁面顯示的問題
        for (let i = 1; i <= 5; i++) {
            const questionDisplay = document.getElementById(`question-display-${i}`);
            if (questionDisplay) {
                questionDisplay.textContent = question || '未輸入問題';
            }
        }
        
        // 更新已選卡牌摘要
        updateCardSummaries();
    }
    
    // 更新卡牌摘要
    function updateCardSummaries() {
        // 行星摘要
        const planetSummaries = ['planet-summary', 'planet-summary-2', 'planet-summary-3', 'planet-summary-4'];
        const planetImages = ['planet-image-small', 'planet-image-small-2', 'planet-image-small-3', 'planet-image-small-4'];
        
        planetSummaries.forEach((id, index) => {
            const element = document.getElementById(id);
            const imageElement = document.getElementById(planetImages[index]);
            if (element && selectedCards.planet) {
                const planetName = cardData.planet.find(p => p.id === selectedCards.planet).name;
                element.textContent = planetName;
                
                // 更新縮小的圖片
                if (imageElement) {
                    imageElement.style.backgroundImage = `url(planet/planet_${String(selectedCards.planet).padStart(2, '0')}.png)`;
                    imageElement.classList.add('show');
                }
            }
        });
        
        // 星座摘要
        const starSummaries = ['star-summary', 'star-summary-2', 'star-summary-3'];
        const starImages = ['star-image-small', 'star-image-small-2', 'star-image-small-3'];
        
        starSummaries.forEach((id, index) => {
            const element = document.getElementById(id);
            const imageElement = document.getElementById(starImages[index]);
            if (element && selectedCards.star) {
                const starName = cardData.star.find(s => s.id === selectedCards.star).name;
                element.textContent = starName;
                
                // 更新縮小的圖片
                if (imageElement) {
                    imageElement.style.backgroundImage = `url(star/star_${String(selectedCards.star).padStart(2, '0')}.png)`;
                    imageElement.classList.add('show');
                }
            }
        });
        
        // 宮位摘要
        const houseSummaries = ['house-summary', 'house-summary-2'];
        const houseImages = ['house-image-small', 'house-image-small-2'];
        
        houseSummaries.forEach((id, index) => {
            const element = document.getElementById(id);
            const imageElement = document.getElementById(houseImages[index]);
            if (element && selectedCards.house) {
                const houseName = cardData.house.find(h => h.id === selectedCards.house).name;
                element.textContent = houseName;
                
                // 更新縮小的圖片
                if (imageElement) {
                    imageElement.style.backgroundImage = `url(house/house_${String(selectedCards.house).padStart(2, '0')}.png)`;
                    imageElement.classList.add('show');
                }
            }
        });
    }
    
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
    let audioContext = null;
    let userHasInteracted = false;

    // 檢測是否為移動設備
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 初始化音效
    function initAudio() {
        try {
            // 創建音頻對象
            waitingAudio = new Audio('sound/waiting.mp3');
            waitingAudio.loop = true;
            waitingAudio.volume = 0.7;
            waitingAudio.preload = 'auto';
            
            gotAudio = new Audio('sound/got.mp3');
            gotAudio.loop = false;
            gotAudio.volume = 0.8;
            gotAudio.preload = 'auto';
            
            shuffleAudio = new Audio('sound/shuffle.mp3');
            shuffleAudio.loop = false;
            shuffleAudio.volume = 0.6;
            shuffleAudio.preload = 'auto';

            // 移動設備特殊處理
            if (isMobileDevice()) {
                console.log('檢測到移動設備，設置音頻特殊處理');
                
                // 監聽用戶首次交互
                const enableAudio = () => {
                    if (!userHasInteracted) {
                        userHasInteracted = true;
                        console.log('用戶已交互，啟用音頻');
                        
                        // 顯示音頻已啟用的提示（可選）
                        showAudioEnabledNotification();
                        
                        // 預載所有音頻
                        [waitingAudio, gotAudio, shuffleAudio].forEach(audio => {
                            if (audio) {
                                audio.load();
                                // 短暫播放並立即暫停以解鎖音頻
                                audio.play().then(() => {
                                    audio.pause();
                                    audio.currentTime = 0;
                                }).catch(e => console.log('音頻預載失敗:', e));
                            }
                        });
                    }
                };

                // 監聽多種交互事件
                ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
                    document.addEventListener(event, enableAudio, { once: true, passive: true });
                });
            }
            
            console.log('音效初始化成功');
        } catch (error) {
            console.error('音效初始化失敗:', error);
        }
    }

    // 安全播放音頻的通用函數
    function safePlayAudio(audio, audioName) {
        if (!audio) return Promise.resolve();
        
        console.log(`嘗試播放${audioName}...`);
        
        // 移動設備且用戶未交互時，直接返回
        if (isMobileDevice() && !userHasInteracted) {
            console.log(`移動設備未交互，跳過${audioName}播放`);
            return Promise.resolve();
        }
        
        return audio.play()
            .then(() => {
                console.log(`${audioName}播放成功`);
            })
            .catch(e => {
                console.log(`${audioName}播放失敗:`, e);
                
                // 如果是移動設備，嘗試在下次用戶交互時播放
                if (isMobileDevice()) {
                    const playOnNextInteraction = () => {
                        audio.play().catch(err => console.log(`延遲播放${audioName}失敗:`, err));
                    };
                    
                    ['touchstart', 'click'].forEach(event => {
                        document.addEventListener(event, playOnNextInteraction, { once: true, passive: true });
                    });
                }
            });
    }

    // 播放等待音效
    function playWaitingSound() {
        safePlayAudio(waitingAudio, '等待音效');
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
        safePlayAudio(gotAudio, '完成音效');
    }

    // 播放卡片選擇音效
    function playShuffleSound() {
        if (shuffleAudio) {
            shuffleAudio.currentTime = 0; // 重置音效到開始位置
            safePlayAudio(shuffleAudio, '卡片選擇音效');
        }
    }

    // 顯示音頻已啟用通知
    function showAudioEnabledNotification() {
        // 創建一個簡短的通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 215, 0, 0.9);
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10000;
            transition: opacity 0.3s ease;
        `;
        notification.textContent = '🔊 音效已啟用';
        document.body.appendChild(notification);

        // 3秒後移除通知
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 占卜問題
    const divinationQuestion = document.getElementById('divination-question');
    
    // 預設問題按鈕
    const presetButtons = document.querySelectorAll('.preset-btn');

    // 對話歷史
    let conversationHistory = [];

    // 為占卜問題輸入框添加事件監聽
    divinationQuestion.addEventListener('input', function() {
        const question = this.value.trim();
        const nextButton = document.getElementById('next-to-planet');
        
        if (question) {
            nextButton.disabled = false;
            nextButton.style.opacity = '1';
        } else {
            nextButton.disabled = true;
            nextButton.style.opacity = '0.5';
        }
    });

    // 為占卜問題輸入框添加Enter鍵事件監聽
    divinationQuestion.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const question = this.value.trim();
            if (question) {
                // 直接開始抽牌
                showPage(2);
            }
        }
    });

    // 預設問題按鈕點擊事件
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            divinationQuestion.value = question;
            
            // 啟用下一步按鈕
            const nextButton = document.getElementById('next-to-planet');
            nextButton.disabled = false;
            nextButton.style.opacity = '1';
            
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

    // 頁面導航按鈕事件
    document.getElementById('next-to-planet').addEventListener('click', () => {
        const question = divinationQuestion.value.trim();
        if (question) {
            showPage(2);
        }
    });

    // 為所有重新開始按鈕添加事件監聽器
    document.getElementById('restart-journey-1').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('restart-journey-2').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('restart-journey-3').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('restart-journey-4').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('restart-journey-5').addEventListener('click', () => {
        window.location.reload();
    });

    // 聯繫女巫
    async function connectToWitch() {
        const question = divinationQuestion.value.trim();
        const planetName = cardData.planet.find(p => p.id === selectedCards.planet).name;
        const starName = cardData.star.find(s => s.id === selectedCards.star).name;
        const houseName = cardData.house.find(h => h.id === selectedCards.house).name;
        
        // 檢查是否設置了 API Key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('請先設置 OpenAI API Key 以獲取詳細解讀');
            settingsPanel.style.display = 'block';
            return;
        }
        
        // 播放等待音效
        playWaitingSound();
        
        // 構建發送給 API 的訊息
        const readingResult = `行星：${planetName}\n星座：${starName}\n宮位：${houseName}`;
        
        // 如果對話歷史為空，初始化系統訊息
        if (conversationHistory.length === 0) {
            conversationHistory.push({
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
「你問我該不該接受這份工作？從骰子來看，答案是可以。但摩羯座和第十宮的組合意味著你必須準備好承受壓力，並且你將無法輕易逃避責任。這份工作會給你成長的機會，但同時也會榨乾你的精力。所以，如果你準備好在工作中磨練自己，並且承受上司的高壓，那麼就勇敢地接受吧。只是不會有太多快樂時光。別指望在這裡找到什麼輕鬆愉快的日子。」`
            });
        }
        
        // 添加用戶問題到對話歷史
        conversationHistory.push({
            role: "user", 
            content: `用戶問題：${question}\n占卜結果：${readingResult}`
        });
        
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
            
            // 停止等待音效
            stopWaitingSound();
            
            // 播放完成音效
            playGotSound();
            
            if (data.error) {
                throw new Error(data.error.message || 'API 請求失敗');
            }
            
            // 提取回應內容
            const reply = data.choices[0].message.content;
            
            // 添加到對話歷史
            conversationHistory.push({role: "assistant", content: reply});
            
            // 轉到女巫回覆頁
            showPage(6);
            
            // 添加用戶問題到聊天界面
            addMessageToChat('user', `${question}`);
            
            // 添加 AI 回應到聊天界面
            addMessageToChat('witch', reply);
            
        } catch (error) {
            // 停止等待音效
            stopWaitingSound();
            
            console.error('API 錯誤:', error);
            alert(`連接女巫失敗: ${error.message}`);
        }
    }

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
        
        // 滾動到頂部，讓新訊息在畫面頂部顯示
        chatMessages.scrollTop = 0;
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
            chatMessages.scrollTop = 0; // 滾動到頂部
            
            // 播放等待音效
            playWaitingSound();
            
            // 構建用於 API 調用的訊息陣列
            const messages = [
                {
                    role: "system", 
                    content: `configure_astrology_dice_bot --dice=random --style="厭世女巫" --functions="深度解讀, 用非常厭世口吻，給予勸告與警示" --language=traditional_chinese --output_detail="豐富" --tone="多層次" --insights="深入分析" language=traditional_chinese`
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

    // 初始化音效
    initAudio();

    // 初始化頁面內容
    updatePageContent();

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
                        
                        // 更新頁面內容
                        updatePageContent();
                        
                        // 自動跳轉到下一頁
                        autoGoToNextPage(type);
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

    // 自動跳轉到下一頁
    function autoGoToNextPage(type) {
        let nextPage = 1; // 預設返回第一頁

        switch(type) {
            case 'planet':
                nextPage = 3; // 行星選擇後跳到星座頁
                break;
            case 'star':
                nextPage = 4; // 星座選擇後跳到宮位頁
                break;
            case 'house':
                nextPage = 5; // 宮位選擇後跳到聯繫女巫頁
                break;
        }

        // 延遲跳轉，讓用戶看到選中的卡牌
        setTimeout(() => {
            showPage(nextPage);
            
            // 如果是最後一步（宮位選擇），自動開始聯繫女巫
            if (type === 'house') {
                setTimeout(() => {
                    connectToWitch();
                }, 1000);
            }
        }, 1000); // 1秒後自動跳轉
    }
}); 