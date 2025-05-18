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
    
    // Unity 인스턴스에 직접 접근하기 위한 전역 변수
    window.gameUnityInstance = null;
    
    // 게임 로드 버튼 클릭 이벤트
    loadGameBtn.addEventListener('click', function() {
        loadGame();
    });
    
    /**
     * 게임 로드 함수 - iframe 대신 직접 로드 방식으로 변경
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
            console.log('게임 직접 로드 시도 중...');
            
            // Unity 게임을 직접 로드하기 위한 초기 HTML 구조
            gameContent.innerHTML = `
                <div id="unity-container" class="unity-desktop">
                    <canvas id="unity-canvas" width="960" height="600" tabindex="-1" style="width: 100%; height: 100%;"></canvas>
                    <div id="unity-loading-bar">
                        <div id="unity-logo"></div>
                        <div id="unity-progress-bar-empty">
                            <div id="unity-progress-bar-full"></div>
                        </div>
                    </div>
                    <div id="unity-warning"></div>
                </div>
            `;
            
            // Unity 컨테이너와 캔버스 스타일 설정
            const unityContainer = document.getElementById('unity-container');
            unityContainer.style.width = '100%';
            unityContainer.style.height = '100%';
            unityContainer.style.position = 'relative';
            unityContainer.style.background = '#000';
            
            const unityCanvas = document.getElementById('unity-canvas');
            unityCanvas.style.width = '100%';
            unityCanvas.style.height = '100%';
            
            // Unity 로더 및 스크립트 설정
            const buildUrl = "./game/Build";
            const loaderUrl = buildUrl + "/game.loader.js";
            
            const config = {
                dataUrl: buildUrl + "/game.data",
                frameworkUrl: buildUrl + "/game.framework.js",
                codeUrl: buildUrl + "/game.wasm",
                streamingAssetsUrl: "StreamingAssets",
                companyName: "DefaultCompany",
                productName: "DesignPattern",
                productVersion: "0.1",
            };
            
            // Unity 로딩 게이지 표시
            document.querySelector("#unity-loading-bar").style.display = "block";
            
            // Unity 로더 스크립트 추가
            const script = document.createElement("script");
            script.src = loaderUrl;
            script.onload = () => {
                // Unity 인스턴스 생성
                createUnityInstance(unityCanvas, config, (progress) => {
                    // 로딩 진행 상태 업데이트
                    const progressBarFull = document.querySelector("#unity-progress-bar-full");
                    if (progressBarFull) {
                        progressBarFull.style.width = 100 * progress + "%";
                    }
                }).then((unityInstance) => {
                    // Unity 인스턴스가 준비되면 전역 변수에 저장
                    window.gameUnityInstance = unityInstance;
                    console.log('Unity 인스턴스가 준비되었습니다.');
                    
                    // 로딩 바 숨기기
                    const loadingBar = document.querySelector("#unity-loading-bar");
                    if (loadingBar) {
                        loadingBar.style.display = "none";
                    }
                    
                    // 게임 로드 완료 상태 설정
                    gameLoaded = true;
                    
                    // 이미 음소거 상태라면 음소거 적용
                    if (isMuted) {
                        toggleMute(true);
                    }
                    
                    // 로드 완료 메시지 표시
                    showGameMessage('게임이 준비되었습니다!');
                }).catch((message) => {
                    console.error('Unity 인스턴스 생성 오류:', message);
                    handleGameLoadError();
                });
            };
            
            // 스크립트 오류 처리
            script.onerror = function(error) {
                console.error('Unity 로더 스크립트 로드 오류:', error);
                handleGameLoadError();
            };
            
            // 스크립트를 문서에 추가
            document.body.appendChild(script);
            
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
        window.gameUnityInstance = null;
    }
    
    // 전체화면 버튼 클릭 이벤트
    fullscreenBtn.addEventListener('click', function() {
        // Unity 인스턴스의 내장 전체화면 기능 사용
        if (gameLoaded && window.gameUnityInstance) {
            window.gameUnityInstance.SetFullscreen(1);
        } else {
            // Unity가 로드되지 않았거나 접근할 수 없는 경우 DOM 전체화면 사용
            toggleFullscreen();
        }
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
        
        // 게임 재시작 로직 - 현재 페이지 새로고침
        location.reload();
    });
    
    // 음소거 버튼 클릭 이벤트
    let isMuted = false;
    muteBtn.addEventListener('click', function() {
        isMuted = !isMuted;
        toggleMute(isMuted);
        
        // 버튼 상태 업데이트
        if (isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> 음소거 해제';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> 음소거';
        }
        
        // 메시지 표시
        showGameMessage(isMuted ? '게임 소리가 꺼졌습니다.' : '게임 소리가 켜졌습니다.');
    });
    
    /**
     * 음소거 토글 함수
     * @param {boolean} mute 음소거 여부
     */
    function toggleMute(mute) {
        if (gameLoaded && window.gameUnityInstance) {
            try {
                // Unity 게임에 음소거 명령 전송 - int 값 사용
                // bool값을 int로 변환(true->1, false->0)
                const muteValue = mute ? 1 : 0;
                window.gameUnityInstance.SendMessage('AudioManager', 'SetMute', muteValue);
                console.log('음소거 상태 변경:', mute, '값:', muteValue);
                return true;
            } catch (error) {
                console.warn('음소거 기능 실행 중 오류:', error);
                return false;
            }
        }
        return false;
    }
    
    /**
     * 게임 메시지 표시 함수
     * @param {string} message 표시할 메시지
     */
    function showGameMessage(message) {
        if (!gameContent) return;
        
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
    
    // 페이지를 떠날 때 Unity 인스턴스 정리
    window.addEventListener('unload', function() {
        if (window.gameUnityInstance) {
            window.gameUnityInstance.Quit();
        }
    });
});