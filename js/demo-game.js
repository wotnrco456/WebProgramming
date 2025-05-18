/**
 * 데모 게임 페이지 관련 스크립트
 */

document.addEventListener('DOMContentLoaded', function() {
    // 요소 참조
    const gameContent = document.getElementById('game-content');
    const loadGameBtn = document.getElementById('load-game-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const restartBtn = document.getElementById('restart-btn');
    const muteBtn = document.getElementById('mute-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 게임 로드 상태
    let gameLoaded = false;
    let gameElement = null;
    
    // 게임 로드 버튼 클릭 이벤트
    loadGameBtn.addEventListener('click', function() {
        loadGame();
    });
    
    /**
     * 게임 로드 함수
     * game/index.html을 로드하여 유니티 WebGL 게임을 표시합니다.
     */
    function loadGame() {
        if (gameLoaded) return;
        
        // 로딩 메시지 보여주기
        gameContent.innerHTML = `
            <div class="game-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>게임을 불러오는 중입니다. 잠시만 기다려주세요...</p>
            </div>
        `;
        
        try {
            console.log('게임 로드 시도 중...');
            
            // 두 가지 방법 중 첫 번째 - 직접 HTML 태그로 삽입
            // 게임 경로 설정
            const gamePath = './game/index.html'; // 상대경로로 수정
            console.log('사용할 게임 경로:', gamePath);
            
            // iframe HTML 직접 생성
            gameContent.innerHTML = `
                <iframe src="${gamePath}" class="game-embed" style="width:100%; height:100%; border:none; background-color:#000;" 
                    allow="fullscreen; autoplay" allowfullscreen></iframe>
            `;
            
            // 생성된 iframe 요소 접근
            gameElement = gameContent.querySelector('iframe');
            
            console.log('iframe 요소 생성됨:', gameElement ? 'O' : 'X');
            
            // iframe 로딩 이벤트 처리
            gameElement.onload = function() {
                console.log('iframe 로드 완료');
                
                // 상태 초기화
                clearTimeout(loadTimeoutId);
                
                try {
                    // iframe 로드 성공 확인
                    if (gameElement.contentWindow) {
                        console.log('iframe contentWindow 접근 가능');
                        gameLoaded = true;
                    }
                } catch (error) {
                    console.warn('iframe 내부 접근 중 오류:', error);
                }
            };
            
            // iframe 로드 오류 처리
            gameElement.onerror = function(error) {
                console.error('iframe 로드 오류:', error);
                clearTimeout(loadTimeoutId);
                handleGameLoadError();
            };
            
            // 로딩 타임아웃 설정
            var loadTimeoutId = setTimeout(function() {
                console.warn('게임 로드 타임아웃 - 오류 처리 시작');
                handleGameLoadError();
            }, 15000); // 15초 타임아웃
            
            // 게임 로드 상태 업데이트
            gameLoaded = true;
            
            // 윈도우 언로드 시 정리
            window.addEventListener('unload', function() {
                // 필요한 정리 작업
                if (gameElement && gameElement.contentWindow) {
                    try {
                        // 게임 인스턴스 정리 시도
                        if (gameElement.contentWindow.unityInstance) {
                            gameElement.contentWindow.unityInstance.Quit();
                        }
                    } catch (e) {
                        console.warn('게임 정리 중 오류:', e);
                    }
                }
            });
            
        } catch (error) {
            console.error('게임 로드 중 오류 발생:', error);
            handleGameLoadError();
        }
    }
    
    /**
     * 게임 로드 오류 처리 함수
     */
    function handleGameLoadError() {
        console.log('게임 로드 오류 처리 함수 실행');
        
        // 오류 메시지 표시
        gameContent.innerHTML = `
            <div class="game-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>게임을 불러오는 중 오류가 발생했습니다.</p>
                <p class="error-details">파일 경로를 확인하고 범위 접근 오류가 있는지 확인해보세요.</p>
                <button id="direct-link-btn" class="load-game-btn">게임 페이지 직접 열기</button>
                <button id="retry-btn" class="load-game-btn">다시 시도</button>
            </div>
        `;
        
        // 재시도 버튼 이벤트 리스너
        document.getElementById('retry-btn').addEventListener('click', loadGame);
        
        // 직접 열기 버튼 이벤트 리스너 (테스트용)
        document.getElementById('direct-link-btn').addEventListener('click', function() {
            window.open('./game/index.html', '_blank');
        });
        
        // 게임 로드 상태 초기화
        gameLoaded = false;
        gameElement = null;
    }
    
    // 전체화면 버튼 클릭 이벤트
    fullscreenBtn.addEventListener('click', function() {
        // 게임 iframe이 있는 경우 iframe 내부의 전체화면 버튼을 활용하려고 시도
        if (gameLoaded && gameElement && gameElement.contentWindow) {
            try {
                // iframe 내부의 전체화면 버튼 찾기 시도
                const iframeFullscreenBtn = gameElement.contentDocument.querySelector('#unity-fullscreen-button');
                if (iframeFullscreenBtn) {
                    // iframe 내부의 전체화면 버튼 클릭
                    iframeFullscreenBtn.click();
                    return;
                }
            } catch (error) {
                console.warn('iframe 내부 전체화면 접근 실패:', error);
                // Cross-Origin 제한으로 접근 실패 시 기본 전체화면 사용
            }
        }
        
        // 기본 전체화면 동작 실행
        toggleFullscreen();
    });
    
    /**
     * 전체화면 토글 함수
     */
    function toggleFullscreen() {
        if (!gameContent) return;
        
        if (!document.fullscreenElement) {
            // 전체화면으로 전환
            if (gameContent.requestFullscreen) {
                gameContent.requestFullscreen();
            } else if (gameContent.mozRequestFullScreen) { // Firefox
                gameContent.mozRequestFullScreen();
            } else if (gameContent.webkitRequestFullscreen) { // Chrome, Safari, Opera
                gameContent.webkitRequestFullscreen();
            } else if (gameContent.msRequestFullscreen) { // IE/Edge
                gameContent.msRequestFullscreen();
            }
            
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창모드';
        } else {
            // 전체화면 종료
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
    }
    
    // 전체화면 변경 이벤트 감지
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    
    /**
     * 전체화면 버튼 업데이트 함수
     */
    function updateFullscreenButton() {
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창모드';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
    }
    
    // 재시작 버튼 클릭 이벤트
    restartBtn.addEventListener('click', function() {
        if (!gameLoaded) {
            loadGame();
            return;
        }
        
        // 게임 재시작 로직
        try {
            if (gameElement && gameElement.contentWindow) {
                // iframe 페이지 새로고침
                gameElement.src = gameElement.src;
                showGameMessage('게임을 재시작합니다...');
            } else {
                // iframe이 없는 경우 게임 다시 로드
                loadGame();
            }
        } catch (error) {
            console.error('게임 재시작 중 오류:', error);
            showGameMessage('게임 재시작 중 오류가 발생했습니다.');
        }
    });
    
    // 음소거 버튼 클릭 이벤트
    let isMuted = false;
    muteBtn.addEventListener('click', function() {
        isMuted = !isMuted;
        
        if (isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> 음소거 해제';
            // 유니티 게임 오디오 음소거 시도
            try {
                if (gameElement && gameElement.contentWindow) {
                    // 유니티 인스턴스에 접근 시도 (Same-Origin Policy 제한 있을 수 있음)
                    const unityInstance = gameElement.contentWindow.unityInstance;
                    if (unityInstance) {
                        // 유니티 게임에 음소거 메시지 전송 시도
                        unityInstance.SendMessage('AudioManager', 'SetMute', true);
                    }
                }
            } catch (error) {
                console.warn('음소거 적용 실패:', error);
            }
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> 음소거';
            // 유니티 게임 오디오 음소거 해제 시도
            try {
                if (gameElement && gameElement.contentWindow) {
                    const unityInstance = gameElement.contentWindow.unityInstance;
                    if (unityInstance) {
                        unityInstance.SendMessage('AudioManager', 'SetMute', false);
                    }
                }
            } catch (error) {
                console.warn('음소거 해제 실패:', error);
            }
        }
        
        // 메시지 표시
        showGameMessage(isMuted ? '게임 소리가 꺼졌습니다.' : '게임 소리가 켜졌습니다.');
    });
    
    /**
     * 게임 메시지 표시 함수
     * @param {string} message 표시할 메시지
     */
    function showGameMessage(message) {
        if (!gameLoaded || !gameElement) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        messageElement.style.position = 'absolute';
        messageElement.style.bottom = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = '#fff';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '100';
        
        gameContent.appendChild(messageElement);
        
        // 메시지 자동 제거
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 2000);
    }
    
    // 탭 전환 기능
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 활성화된 탭 버튼 변경
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 선택된 탭 컨텐츠 표시
            const tabId = this.getAttribute('data-tab');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // 페이지 로드 시 자동으로 게임 로드
    setTimeout(loadGame, 1000);
    
    // 키보드 이벤트 리스너 (게임 내 단축키)
    document.addEventListener('keydown', function(e) {
        if (!gameLoaded) return;
        
        // ESC 키: 전체화면 종료
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        // R 키: 게임 재시작
        if (e.key === 'r' || e.key === 'R') {
            restartBtn.click();
        }
        
        // M 키: 음소거 토글
        if (e.key === 'm' || e.key === 'M') {
            muteBtn.click();
        }
        
        // F 키: 전체화면 토글
        if (e.key === 'f' || e.key === 'F') {
            fullscreenBtn.click();
        }
    });
    
    /**
     * 실제 게임 HTML 콘텐츠를 로드하는 함수
     * iframe 대신 fetch와 DOMParser를 사용하여 안전하게 로드
     * 
     * @param {string} url 로드할 HTML 파일 URL
     * @returns {Promise} HTML 콘텐츠 로드 프로미스
     */
    function loadGameHTMLContent(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // HTML 파싱
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // 필요한 스크립트와 스타일을 추출
                const scripts = Array.from(doc.querySelectorAll('script'));
                const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'));
                const bodyContent = doc.body.innerHTML;
                
                // 컨테이너 생성
                const container = document.createElement('div');
                container.style.width = '100%';
                container.style.height = '100%';
                container.innerHTML = bodyContent;
                
                // 스타일 추가
                styles.forEach(style => {
                    const clone = style.cloneNode(true);
                    document.head.appendChild(clone);
                });
                
                // 스크립트 추가 (보안 주의: 신뢰할 수 있는 소스만 로드)
                scripts.forEach(script => {
                    if (script.src) {
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        document.body.appendChild(newScript);
                    } else {
                        // 인라인 스크립트는 새 스크립트 요소로 실행
                        // 주의: 보안 위험이 있으므로 신뢰할 수 있는 소스만 사용
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.body.appendChild(newScript);
                    }
                });
                
                return container;
            });
    }
});
